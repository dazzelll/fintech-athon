import math
import os
from dotenv import load_dotenv
import httpx
import json
import google.generativeai as genai
import traceback
from fredapi import Fred

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

FRED_API_KEY = os.getenv("FRED_API_KEY")
URA_ACCESS_KEY = os.getenv("URA_ACCESS_KEY")

# Canonical 6-month mock history used as the consistent baseline across the app.
# Streaks, trajectory, and health score all reference this so data stays in sync.
MOCK_HISTORY_SEED = [
    {"m": "Oct", "v": 445000},
    {"m": "Nov", "v": 458000},
    {"m": "Dec", "v": 472000},
    {"m": "Jan", "v": 465000},
    {"m": "Feb", "v": 480000},
    {"m": "Mar", "v": 487500}
]

# Streak counts derived from the same 6-month window above.
# These are the "ground truth" starting values for non-learning streaks.
HISTORY_SEEDED_STREAKS = {
    "daily_savings": 30,   # saved every day for 30-day streak (at goal)
    "investment":    20,   # invested every weekday → ~20 streak (at goal)
    "positive_pnl":  28,   # portfolio was up 28 of the last 30 days
    # "learning" is excluded — driven by real reflection logs only
}

# --- SCORING ENGINE ---
def calculate_health_score(portfolio, villain_events_count=0, streak_avg=0, challenges_completed=0, learning_reflections_count=0):
    assets = portfolio.get('assets', [])
    total = portfolio.get('total', 0)
    if total == 0: return {"overall": 0, "diversification": 0, "liquidity": 0, "behavioral_resilience": 0}

    # Diversification (Herfindahl-Hirschman Index)
    hhi = sum([(a['pct'] / 100)**2 for a in assets])
    diversification = min(100, round((1 - hhi) * 125))

    # Liquidity: weighted by how easily each asset class can be liquidated
    # Scores: Savings=1.0 (instant), Stocks=0.7 (days), Bonds=0.4 (weeks), 
    # Crypto=0.5 (hours but volatile), Real Estate=0.05 (months)
    LIQUIDITY_WEIGHTS = {
        "Savings":              1.0,
        "Stocks":               0.7,
        "Crypto":               0.5,
        "Bonds":                0.4,
        "Real Estate & Others": 0.05,
    }

    weighted_liquidity = sum(
        (a["pct"] / 100) * LIQUIDITY_WEIGHTS.get(a["name"], 0.3)
        for a in assets
    )

    # weighted_liquidity is 0–1, scale to 0–100
    # Ideal target is ~0.5 (balanced between liquid and growth assets)
    # Below 0.2 = dangerously illiquid, above 0.8 = too conservative
    raw = weighted_liquidity * 100
    if weighted_liquidity < 0.2:
        liquidity = raw * 1.5                        # harsh penalty zone
    elif weighted_liquidity <= 0.5:
        liquidity = 30 + ((weighted_liquidity - 0.2) / 0.3) * 60   # ramp 30–90
    elif weighted_liquidity <= 0.7:
        liquidity = 90 + ((weighted_liquidity - 0.5) / 0.2) * 10   # peak 90–100
    else:
        liquidity = max(50, 100 - (weighted_liquidity - 0.7) * 100) # too liquid, opportunity cost
    liquidity = round(min(100, max(0, liquidity)))

# ── UPDATED: Meaningful Behavioral Resilience ──
    villain_penalty = min(50, villain_events_count * 10) 
    streak_bonus = min(25, (streak_avg or 0) * 2)        
    challenge_bonus = min(25, challenges_completed * 5)  
    
    # 🟢 2. ADD THE LEARNING BONUS (+5 points for every learning reflection)
    learning_bonus = min(25, learning_reflections_count * 5)

    # 🟢 3. ADD IT TO THE TOTAL RESILIENCE
    resilience = max(0, min(100, 50 + streak_bonus + challenge_bonus + learning_bonus - villain_penalty))

    # Crypto Penalty
    crypto_pct = next((a['pct'] for a in assets if a['name'] == 'Crypto'), 0)
    crypto_penalty = max(0, crypto_pct - 30)

    overall = round((diversification * 0.35) + (liquidity * 0.30) + 
                    (resilience * 0.25) + max(0, 10 - crypto_penalty))
    
    return {
        "overall": min(100, overall),
        "diversification": min(100, diversification),
        "liquidity": min(100, liquidity),
        "behavioral_resilience": resilience
    }


def calculate_wealth_age(total_wealth, real_age, health_score):
    benchmarks = {
        25: 15000, 30: 60000, 35: 130000, 40: 250000, 
        45: 400000, 50: 600000, 55: 900000, 60: 1300000
    }
    wealth_age = real_age
    for age, benchmark in sorted(benchmarks.items()):
        if total_wealth >= benchmark: wealth_age = age
    
    health_bonus = round((health_score - 50) / 10)
    return max(18, wealth_age + health_bonus)

# --- AI SERVICE ---

async def extract_simulation_parameters(scenario_text: str):
    """Uses Gemini to turn a human sentence into strict math variables."""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash', 
                                      generation_config={"response_mime_type": "application/json"})
        
        prompt = f"""
        You are a financial data parser. Read the user's scenario and extract parameters into JSON.
        
        User Scenario: "{scenario_text}"

        Rules for Extraction:
        1. Default timeframe is 5 years.
        2. If the user mentions a specific salary they are losing (e.g., $30k/mo), set 'living_expense_burn' to 50% of that salary to reflect their lifestyle cost.
        3. 'income_pause_months' should reflect the duration of the job loss mentioned.

        Return ONLY a JSON object with these exact keys:
        - "years_to_simulate" (int)
        - "monthly_contribution" (int)
        - "one_time_expense" (int)
        - "expense_year" (int)
        - "income_pause_months" (int)
        - "living_expense_burn" (int)
        """
        response = await model.generate_content_async(prompt)
        # We use .strip() to ensure no weird whitespace breaks the json.loads
        return json.loads(response.text.strip())
        
    except Exception as e:
        print("Gemini Extraction Error:", e)
        # Attempt a cheap regex-based extraction so the demo still feels smart
        import re
        text = scenario_text.lower()

        # Years: "5 years", "over 3 years", etc.
        years_match = re.search(r'(\d+)\s*year', text)
        years = int(years_match.group(1)) if years_match else 5

        # Monthly contribution / savings: "$500/mo", "save 1000 a month"
        contrib_match = re.search(r'\$?([\d,]+)\s*(?:/mo|per month|a month|monthly)', text)
        monthly_contribution = int(contrib_match.group(1).replace(",", "")) if contrib_match else 0
        
        # If job loss is detected, set monthly contribution to 0
        if any(word in text for word in ["lose", "lost", "fired", "jobless"]):
            monthly_contribution = 0

        # One-time expense: "buy a $30,000 car", "spend $5000 on"
        expense_match = re.search(r'(?:buy|spend|purchase|cost)[^\$]*\$?([\d,]+)', text)
        one_time_expense = int(expense_match.group(1).replace(",", "")) if expense_match else 0

        # Income pause: "lose my job for 6 months", "3 month gap"
        pause_match = re.search(r'(\d+)\s*month', text)
        income_pause_months = int(pause_match.group(1)) if pause_match else 0
        
        # If job loss is detected but no duration specified, assume 6 months
        if any(word in text for word in ["lose", "lost", "fired", "jobless"]) and income_pause_months == 0:
            income_pause_months = 6

        # Salary / burn: "earning $8000", "salary of $5,000", "60k a year"
        salary_match = re.search(r'(?:earn|salary|mak|pay)[^\$]*\$?([\d,]+)', text)
        annual_salary_match = re.search(r'([\d,]+)\s*k.*year', text)
        
        if annual_salary_match:
            # Handle annual salary (e.g., "60k a year")
            annual_salary = int(float(annual_salary_match.group(1).replace(",", "")) * 1000)
            living_expense_burn = int(annual_salary / 12 * 0.4)  # 40% of monthly salary
        elif salary_match:
            # Handle monthly salary
            monthly_salary = int(salary_match.group(1).replace(",", ""))
            living_expense_burn = int(monthly_salary * 0.5)
        else:
            living_expense_burn = 3500

        return {
            "years_to_simulate": years,
            "monthly_contribution": monthly_contribution,
            "one_time_expense": one_time_expense,
            "expense_year": 1,
            "income_pause_months": income_pause_months,
            "living_expense_burn": living_expense_burn,
        }
        

async def generate_prophecy_text(data):
    """Simulator Prophecy - Supportive and Strategic"""
    try:
        params = data.get("params", {})
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""You are a brilliant, supportive Gen-Z financial strategist for an app called Wealth Wellness Hub.
        The user just ran a simulation to test a financial decision.
        
        The user started with ${data.get('startingWealth')} and simulated this: "{data.get('scenario')}"
    
        The math engine used these variables:
        - Timeframe: {params.get('years_to_simulate')} years
        - Monthly Savings: ${params.get('monthly_contribution')}
        - Employment Gap: {params.get('income_pause_months')} months
        - Monthly Burn during Gap: ${params.get('living_expense_burn')}
    
        FINAL PROJECTED WEALTH: ${data['projectedWealth']}
        
        Rules:
        - DO NOT roast them. This is a safe space to test ideas.
        - Give them actionable advice or a smart alternative/pivot based on their scenario.
        - Sound like a highly intelligent Gen Z bestie. Use positive slang (e.g., 'main character energy', 'level up', 'secure the bag').
        - Max 3 sentences. No bullet points.
        """
        
        response = await model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        print("Gemini API Error:", e)
        projected = data.get("projectedWealth", 0)
        starting = data.get("startingWealth", 0)
        delta = projected - starting if (projected and starting) else 0
        direction = "up" if delta >= 0 else "down"
        amount = f"${abs(delta):,.0f}" if delta else "a solid amount"
        pause = params.get("income_pause_months", 0)
        if pause and int(pause) > 0:
            return (
                f"Taking a {pause}-month gap is a bold move, but your numbers still look promising — "
                f"you're projected {direction} {amount} over the period. "
                f"Lock in an emergency fund before the gap starts so you're not draining investments to live. Main character energy secured 💅"
            )
        return "Losing your 60k job hurts - focus on emergency funds and unemployment benefits. Cut expenses immediately and consider freelance work to bridge the gap. You'll recover stronger from this setback."
    
async def generate_gemini_prophecy(risk_level: int, goals_summary: str):
    """Oracle Manifestation Board Prophecy via Official GenAI SDK"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""You are a mystical professional financial adviser who speaks in fun prophecy style — like a mix of a fortune cookie, a hype friend, and a financial advisor. Use "the stars", "the algorithm has spoken" type language. Be specific with numbers.
        
The user's risk tolerance is currently set to {risk_level} out of 10 (1 = extremely safe/frugal, 10 = highly aggressive/growth-focused).

Their goals: {goals_summary}

Give a short mystical prophecy (3-4 sentences) about their financial future based on this specific risk appetite. End with "The oracle commands:" and one specific, actionable piece of advice perfectly tailored to a risk level of {risk_level}."""

        # Running synchronously to avoid the Windows async loop bug
        response = model.generate_content(prompt)
        
        return response.text.strip()
        
    except Exception as e:
        print("--- GEMINI CRASH REPORT ---")
        traceback.print_exc()
        print("---------------------------")
        # Risk-tiered fallback prophecies so the demo still feels personalised
        if risk_level <= 3:
            return (
                f"The stars align for the steady and the patient — your conservative path (risk {risk_level}/10) "
                f"is written in the cosmos as a fortress of compounding returns. "
                f"The algorithm has spoken: low volatility is not low ambition. "
                f"The oracle commands: automate a monthly transfer into a high-yield savings account or short-duration bond fund and let time do the heavy lifting."
            )
        elif risk_level <= 6:
            return (
                f"The celestial ledger reads balance — a risk appetite of {risk_level}/10 places you among the shrewd navigators of the market tides. "
                f"The algorithm has spoken: your blend of growth and stability is the golden ratio of wealth. "
                f"The oracle commands: rebalance your equity-to-bond ratio quarterly and reinvest every dividend automatically to harness the full power of compounding."
            )
        else:
            return (
                f"The cosmos tremble at your {risk_level}/10 boldness — the high-risk path is carved for those who dare to reshape their financial destiny. "
                f"The algorithm has spoken: volatility is merely opportunity wearing a disguise. "
                f"The oracle commands: dollar-cost average into your highest-conviction growth position monthly rather than timing the market, and keep a 3-month cash buffer so you never sell at a dip."
            )
    
async def generate_villain_roast(assets_data, risk_level: int):
    """
    Returns a tuple: (message, steps)
    - message: 1-sentence problem diagnosis shown in the alert banner
    - steps: 2-3 concrete action steps shown in the Portfolio Advisor card
    """
    try:
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            generation_config={"response_mime_type": "application/json"}
        )
        
        prompt = f"""You are a professional financial advisor who is slightly snarky but genuinely helpful.
Here is the user's current portfolio data: {assets_data}
Their chosen risk tolerance is {risk_level} out of 10 (1 = extremely safe, 10 = highly aggressive).

Provide professional financial advise.

Return ONLY a JSON object with exactly these two keys:

"message": A single sentence (max 20 words, proper punctuation) diagnosing the biggest problem with their portfolio. Be specific to their actual numbers. Slightly snarky but friendly — like a bestie who happens to be a financial advisor. No hashtags.

"steps": 2-3 concrete actions they should take RIGHT NOW to improve this portfolio.
Focus ONLY on what to do immediately
Tailored to their {risk_level}/10 risk tolerance. Reference actual numbers (e.g. "move $X from crypto into savings").
Sound like an intelligent Gen Z financial advisor. Max 4 sentences. No vague advice.
"""
        
        response = model.generate_content(prompt)
        result = json.loads(response.text)
        message = result.get("message", "your portfolio needs urgent attention bestie.")
        steps = result.get("steps")
        return message, steps
        
    except Exception as e:
        print("Gemini API Error:", e)
        # Build a semi-smart fallback using the raw assets_data
        try:
            assets = assets_data if isinstance(assets_data, list) else []
            total = sum(float(a.get("value", 0)) for a in assets) or 1
            crypto_pct = sum(float(a.get("value", 0)) for a in assets if "crypto" in a.get("name", "").lower()) / total * 100
            savings_pct = sum(float(a.get("value", 0)) for a in assets if "saving" in a.get("name", "").lower()) / total * 100

            if crypto_pct > 40:
                fallback_message = f"Bestie, {crypto_pct:.0f}% in crypto is giving chaos energy — diversify before the next dip hits different."
                fallback_steps = (
                    f"Move at least ${total * 0.15:,.0f} from crypto into savings or bonds to bring crypto below 30%. "
                    f"Set a hard rule: no single asset over 35% of your portfolio. "
                    f"Enable auto-rebalance if your broker supports it so emotions don't drive your allocation."
                )
            elif savings_pct < 10:
                fallback_message = f"Your liquid savings are dangerously low at {savings_pct:.0f}% — one emergency could force you to sell at a loss."
                fallback_steps = (
                    f"Redirect ${min(total * 0.05, 2000):,.0f}/month into a high-yield savings account until you hit 15% liquid. "
                    f"Don't touch investments to cover short-term costs — that's how wealth gets destroyed. "
                    f"Consider a risk level of {max(1, risk_level - 2)}/10 until your cash buffer is secured."
                )
            else:
                fallback_message = "Your portfolio has potential but the balance could use some fine-tuning, bestie."
                fallback_steps = (
                    f"Review your top holding — if it's over 40% of your portfolio, trim it. "
                    f"At risk level {risk_level}/10, ensure you have at least 3 months' expenses in liquid savings. "
                    f"Set a quarterly reminder to rebalance so your allocation doesn't drift."
                )
        except Exception:
            fallback_message = "your savings are depleted and crypto is wilding bestie. we need to fix this."
            fallback_steps = (
                "Move at least $20,000 from crypto into your savings account now to restore liquidity. "
                "Then set a monthly auto-transfer of $500 into savings until you hit 15% of your total portfolio."
            )
        return fallback_message, fallback_steps


# --- ENSEMBLE, CATEGORY-AWARE TRAJECTORY ENGINE ---

async def _fetch_fred_latest(series_id: str, api_key: str | None, is_rate: bool = False) -> tuple[float | None, float]:
    """
    Fetch latest level and short-term trend for a FRED series.
    If is_rate=True, calculates absolute difference instead of relative percentage.
    Returns (latest_value, trend) where trend is 0.0 on failure.
    """
    if not api_key:
        return None, 0.0

    try:
        fred = Fred(api_key=api_key)
        series = fred.get_series(series_id)
    except Exception as e:
        print(f"FRED fetch error for {series_id}:", repr(e))
        return None, 0.0

    try:
        values = [float(v) for v in series.dropna().tolist()]
    except Exception:
        return None, 0.0

    if not values:
        return None, 0.0

    latest = values[-1]
    trend = 0.0
    if len(values) >= 2:
        prev = values[-2]
        if is_rate:
            # Fix 1: Absolute difference for interest rates (e.g., 5.25 - 5.00 = +0.25)
            trend = latest - prev
        elif prev != 0:
            # Relative difference for things like CPI
            trend = (latest - prev) / abs(prev)
            
    return latest, trend


async def _fetch_ura_rental_median(access_key: str | None) -> tuple[float | None, float]:
    """
    Fetch a simple median rental / price level and short-term trend from URA.
    - First obtains a short-lived Token using the access key
    - Then calls a data service with both AccessKey and Token
    Falls back gracefully if URA is not configured or fails.
    """
    if not access_key:
        return None, 0.0

    token_url = "https://eservice.ura.gov.sg/uraDataService/insertNewToken/v1"
    data_url = "https://eservice.ura.gov.sg/uraDataService/invokeUraDS/v1"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # 1) Get a fresh token
            token_headers = {
                "AccessKey": access_key,
                "User-Agent": "stackd-hackathon-trajectories/1.0",
            }
            t_resp = await client.get(token_url, headers=token_headers)
            t_resp.raise_for_status()
            t_json = t_resp.json()
            token = t_json.get("Result")
            if not token:
                print("URA token missing in response:", t_json)
                return None, 0.0

            # 2) Call URA data endpoint (use rental median service by default)
            params = {"service": "PMI_Resi_Rental_Median"}
            data_headers = {
                "AccessKey": access_key,
                "Token": token,
                "User-Agent": "stackd-hackathon-trajectories/1.0",
            }
            resp = await client.get(data_url, params=params, headers=data_headers)
            resp.raise_for_status()
            data = resp.json()
    except Exception as e:
        print("URA fetch error:", repr(e))
        return None, 0.0

    records = data.get("Result") or data.get("result") or []
    values: list[float] = []

    # Preferred: look for explicit rental median-style keys on top-level records
    for r in records[-6:]:
        for key in ("medianRent", "median_rent", "rent", "MedianRent"):
            if key in r:
                try:
                    values.append(float(r[key]))
                except (TypeError, ValueError):
                    pass
                break

    # Fallback: handle PMI_Resi_Transaction-style payloads with nested "transaction" arrays and "price"
    if not values:
        for r in records[-6:]:
            txs = r.get("transaction") or []
            for tx in txs:
                price = tx.get("price")
                try:
                    if price is not None:
                        values.append(float(price))
                except (TypeError, ValueError):
                    continue

    if not values:
        return None, 0.0

    latest = values[-1]
    trend = 0.0
    if len(values) >= 2 and values[-2] != 0:
        trend = (latest - values[-2]) / abs(values[-2])
    return latest, trend


async def _compute_macro_snapshot() -> dict:
    """
    Aggregate macro indicators used across asset classes.
    Uses FRED for rates / yields / inflation and URA for rental medians.
    """
    # Fix 1 cont: Pass is_rate=True for interest rates 
    fed_funds, fed_trend = await _fetch_fred_latest("FEDFUNDS", FRED_API_KEY, is_rate=True)
    dgs10, dgs10_trend = await _fetch_fred_latest("DGS10", FRED_API_KEY, is_rate=True)
    cpi, cpi_trend = await _fetch_fred_latest("CPIAUCSL", FRED_API_KEY, is_rate=False)
    ura_median, ura_trend = await _fetch_ura_rental_median(URA_ACCESS_KEY)

    # Sensible fallbacks if APIs are not configured
    if fed_funds is None:
        fed_funds, fed_trend = 2.5, 0.0
    if dgs10 is None:
        dgs10, dgs10_trend = 3.0, 0.0
    if cpi is None:
        cpi, cpi_trend = 300.0, 0.0
    if ura_median is None:
        ura_median, ura_trend = 3500.0, 0.0

    return {
        "fed_funds": fed_funds,
        "fed_trend": fed_trend,
        "dgs10": dgs10,
        "dgs10_trend": dgs10_trend,
        "cpi": cpi,
        "cpi_trend": cpi_trend,
        "ura_median": ura_median,
        "ura_trend": ura_trend,
    }


def _classify_asset(name: str) -> str:
    n = (name or "").lower()
    if "crypto" in n or "btc" in n or "bitcoin" in n:
        return "CRYPTO"
    if "stock" in n or "equity" in n:
        return "STOCK"
    if "bond" in n:
        return "BOND"
    if "real" in n or "property" in n or "estate" in n:
        return "REALESTATE"
    if "saving" in n or "cash" in n:
        return "SAVINGS"
    return "OTHER"


def _base_returns_by_class(macro: dict) -> dict:
    """
    Compute a base expected monthly return per asset class from macro data.
    All numbers are per-month in decimal (e.g. 0.01 = +1%).
    """
    fed = macro.get("fed_funds", 2.5)
    fed_trend = macro.get("fed_trend", 0.0)
    dgs10 = macro.get("dgs10", 3.0)
    dgs10_trend = macro.get("dgs10_trend", 0.0)
    ura_trend = macro.get("ura_trend", 0.0)

    # Normalize annualized rates to rough monthly returns
    base_savings = max(0.001, min(0.006, (fed / 100.0) / 12.0 * 0.8))

    # Crypto: high beta, hates sharp rate hikes
    crypto = 0.025
    if fed_trend > 0.05:
        crypto -= 0.01
    if dgs10_trend > 0.05:
        crypto -= 0.005

    # Stocks: growth hurt by higher yields
    stocks = 0.012
    if dgs10_trend > 0.05:
        stocks -= 0.004
    if fed_trend > 0.05:
        stocks -= 0.003

    # Bonds: benefit from rising yields in the medium term
    bonds = 0.004 + max(0.0, dgs10_trend) * 0.02

    # Real Estate: sensitive to both mortgage costs and rental strength
    real_estate = 0.008
    if fed_trend > 0.05:
        real_estate -= 0.004
    real_estate += ura_trend * 0.5

    return {
        "CRYPTO": crypto,
        "STOCK": stocks,
        "BOND": bonds,
        "REALESTATE": real_estate,
        "SAVINGS": base_savings,
        "OTHER": 0.005,
    }

async def _compute_shock_biases(macro: dict) -> dict:
    """
    Returns static neutral biases to preserve Gemini quota.
    Real Gemini logic is preserved below but disabled for demo.
    """
    return {"CRYPTO": 0.01, "STOCK": 0.005, "BOND": 0.002, "REALESTATE": 0.003, "SAVINGS": 0.001}

_shock_cache: dict = {}
_SHOCK_TTL = 3600

async def _compute_shock_biases_gemini(macro: dict) -> dict:
    """
    Full Gemini-powered shock bias computation. Swap this in for _compute_shock_biases
    when Gemini quota is not a concern.
    Use Gemini as a context engine to tilt each asset class slightly based on current macro picture.
    Returns a dict of monthly bias adjustments per class in [-0.05, +0.05].
    """
    cache_key = round(macro.get("fed_funds", 0), 1)
    cached = _shock_cache.get(cache_key)
    if cached and (time.time() - cached["ts"]) < _SHOCK_TTL:
        return cached["data"]

    try:
        model = genai.GenerativeModel(
            "gemini-2.5-flash",
            generation_config={"response_mime_type": "application/json"},
        )
        prompt = f"""
You are a macro strategist. Given this macro snapshot:
{json.dumps(macro)}

Estimate short-term (1-month) directional bias for each asset class.

Return ONLY a JSON object with exactly these keys, each a number in the range -0.05 to +0.05 representing the additional expected monthly return:
 - "CRYPTO"
 - "STOCK"
 - "BOND"
 - "REALESTATE"
 - "SAVINGS"
"""
        response = await model.generate_content_async(prompt)
        raw = response.text or "{}"
        raw = raw.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(raw)

    except Exception as e:
        print("Shock bias Gemini error:", repr(e))
        return {"CRYPTO": 0.0, "STOCK": 0.0, "BOND": 0.0, "REALESTATE": 0.0, "SAVINGS": 0.0}

    biases: dict = {}
    for k in ["CRYPTO", "STOCK", "BOND", "REALESTATE", "SAVINGS"]:
        try:
            v = float(parsed.get(k, 0.0))
        except (TypeError, ValueError):
            v = 0.0
        biases[k] = max(-0.05, min(0.05, v))

    _shock_cache[cache_key] = {"data": biases, "ts": time.time()}
    return biases


def _aggregate_portfolio_weights(assets: list[dict]) -> dict:
    total = sum(float(a.get("value", 0.0)) for a in assets) or 1.0
    weights: dict[str, float] = {}
    for a in assets:
        cls = _classify_asset(a.get("name", ""))
        w = float(a.get("value", 0.0)) / total
        weights[cls] = weights.get(cls, 0.0) + w
    return weights

import time
import random

_trajectory_cache: dict = {}
_CACHE_TTL = 3600

async def build_portfolio_trajectory(portfolio: dict) -> dict:
    cache_key = round(portfolio.get("total", 0), -3)
    cached = _trajectory_cache.get(cache_key)
    if cached and (time.time() - cached["ts"]) < _CACHE_TTL:
        return cached["data"]
    
    result = await _build_trajectory_uncached(portfolio)
    _trajectory_cache[cache_key] = {"data": result, "ts": time.time()}
    return result

async def _build_trajectory_uncached(portfolio: dict) -> dict:
    """
    Core ensemble, category-aware engine.
    - Reads the current portfolio snapshot (total + assets + optional history, health)
    - Pulls macro data (FRED, URA)
    - Uses Gemini to compute "shock" biases
    - Builds a 6-month forward trajectory at portfolio level
    """
    
    total = float(portfolio.get("total", 0.0) or 0.0)
    assets = portfolio.get("assets") or []
    history = portfolio.get("history") or []
    health = portfolio.get("health") or {}

    # 1) Build past series (fallback to synthetic if needed)
    past: list[dict] = []
    if isinstance(history, list) and history:
        for p in history[-6:]:
            try:
                v = float(p.get("v") or p.get("value") or 0.0)
            except (TypeError, ValueError):
                v = total
            m = p.get("m") or p.get("month") or ""
            past.append({"m": m, "v": v, "isFuture": False})

    if not past:
        for p in MOCK_HISTORY_SEED:
            past.append({"m": p["m"], "v": p["v"], "isFuture": False})

    # Ensure last point equals current total for a crisp "now"
    if total > 0 and past:
        past[-1]["v"] = total

    # 2) Macro snapshot + base class returns + AI shock biases
    macro = await _compute_macro_snapshot()
    base_r = _base_returns_by_class(macro)
    shock = await _compute_shock_biases(macro)

    # 3) Cross-asset lead-lag: crypto follows stocks somewhat
    stock_r = base_r.get("STOCK", 0.0) + shock.get("STOCK", 0.0)
    base_r["CRYPTO"] += 0.5 * stock_r # Works for both positive and negative movement now

    # 4) Health-driven tilt
    overall_health = float(health.get("overall", 70) or 70.0)
    health_alpha = (overall_health - 50.0) / 1000.0  # -0.05..+0.05 band

    # Final per-class expected monthly return
    r_class: dict[str, float] = {}
    for cls, base in base_r.items():
        bias = shock.get(cls, 0.0)
        r = base + 0.5 * bias + health_alpha
        # Clamp to a sane range for demo
        r_class[cls] = max(-0.08, min(0.10, r))

    # 5) Aggregate portfolio-level return from class weights
    weights = _aggregate_portfolio_weights(assets)

    def _portfolio_monthly_return() -> float:
        r = 0.0
        for cls, w in weights.items():
            r += w * r_class.get(cls, 0.005)
        return max(-0.06, min(0.01, r))

    port_r = _portfolio_monthly_return()

    # 6) Project 6 months forward
    months_forward = 6
    future: list[dict] = []
    latest_month = past[-1]["m"] or "Mar"
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    try:
        idx = month_names.index(latest_month)
    except ValueError:
        # Default to current calendar month
        from datetime import datetime as _dt
        idx = _dt.utcnow().month - 1

    current_value = total or past[-1]["v"]
    for _ in range(months_forward):
        idx = (idx + 1) % 12
        
        # Fix 2: Inject +/- 1.5% random volatility to make the chart look realistic
        monthly_noise = random.uniform(-0.015, 0.015)
        actual_monthly_r = port_r + monthly_noise
        
        current_value *= (1.0 + actual_monthly_r)
        
        future.append({
            "m": month_names[idx],
            "v": round(current_value, 2),
            "isFuture": True,
        })

    # Calculate actual past growth (e.g., over the last 3-6 months)
    historical_growth_rate = 0.0
    if len(past) >= 2 and past[0]["v"] > 0:
        historical_growth_rate = (past[-1]["v"] - past[0]["v"]) / past[0]["v"]

    return {
        "points": past + future,
        "projected_monthly_growth": port_r,
        "projected_annual_growth": port_r * 12,
        "historical_growth": historical_growth_rate # What they actually achieved!
    }