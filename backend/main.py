import os
import copy
import asyncio
from datetime import datetime
import httpx
from fastapi import FastAPI, Depends, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
import stripe
from pathlib import Path
from dotenv import load_dotenv

# Load .env from backend/ or project root (when running as uvicorn from backend/)
load_dotenv()
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import google.generativeai as genai

from database import engine, get_db, Base
import models
from pydantic import BaseModel
from engines import calculate_health_score, calculate_wealth_age, generate_prophecy_text, generate_gemini_prophecy, extract_simulation_parameters, generate_villain_roast

# 1. Create DB Tables
models.Base.metadata.create_all(bind=engine)

# 2. Setup Background Scheduler
scheduler = BackgroundScheduler()

def check_villain_alerts():
    print("CRON: Checking Villain Arc patterns...")

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(check_villain_alerts, 'interval', hours=1)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Stripe Configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

HACKATHON_TOP_UP_TOTAL = 0
HACKATHON_SABOTAGE_MODE = False

# --- MOCK FALLBACK DATA ---
MOCK_ASSETS = [
    {"name": "Stocks", "value": 185000, "pct": 38, "color": "#3b82f6", "emoji": "📈"},
    {"name": "Real Estate", "value": 150000, "pct": 31, "color": "#10b981", "emoji": "🏠"},
    {"name": "Savings", "value": 75000, "pct": 15, "color": "#8b5cf6", "emoji": "💰"},
    {"name": "Crypto", "value": 45000, "pct": 9, "color": "#f59e0b", "emoji": "₿"},
    {"name": "Bonds", "value": 32500, "pct": 7, "color": "#ec4899", "emoji": "📜"}
]

ALPHAVANTAGE_API_KEY = os.getenv("ALPHAVANTAGE_API_KEY")
STOCK_FALLBACK_DATA = [
    {"name": "Apple", "symbol": "AAPL", "price": 190.25, "color": "#22c55e"},
    {"name": "Microsoft", "symbol": "MSFT", "price": 420.40, "color": "#3b82f6"},
    {"name": "Tesla", "symbol": "TSLA", "price": 220.10, "color": "#ef4444"},
]

COINGECKO_API_KEY = os.getenv("COINGECKO_API_KEY")

FALLBACK_DATA = [
    {"name": "Bitcoin", "symbol": "BTC", "price": 85430.50, "color": "#f59e0b", "icon": "₿"},
    {"name": "Ethereum", "symbol": "ETH", "price": 4200.75, "color": "#627eea", "icon": "⟠"},
    {"name": "Solana", "symbol": "SOL", "price": 185.20, "color": "#14f195", "icon": "◎"},
]

ALPACA_API_KEY_ID = os.getenv("ALPACA_API_KEY_ID")
ALPACA_API_SECRET_KEY = os.getenv("ALPACA_API_SECRET_KEY")
ALPACA_BASE_URL = os.getenv("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")

# Optional: non-Alpaca wealth for full portfolio (sandbox). Alpaca = Stocks + Savings only.
# SUPPLEMENTAL_REAL_ESTATE, SUPPLEMENTAL_CRYPTO, SUPPLEMENTAL_BONDS (numbers, default 0)

# --- ROUTES ---

@app.post("/api/demo/sabotage")
async def trigger_sabotage():
    global HACKATHON_SABOTAGE_MODE
    HACKATHON_SABOTAGE_MODE = True
    print(f"DEBUG: Sabotage Mode is now {HACKATHON_SABOTAGE_MODE}")
    return {"success": True, "message": "Data sabotaged!"}


@app.post("/api/portfolio/stripe/top-up")
async def create_stripe_checkout():
    """Generates a secure Stripe Checkout URL"""
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'sgd',
                    'product_data': {
                        'name': 'Wealth Wellness Portfolio Top-Up',
                        'description': 'Instantly fund your Savings account.',
                    },
                    'unit_amount': 50000,
                },
                'quantity': 1,
            }],
            mode='payment',
            success_url='https://checkout.stripe.com/test/success',
            cancel_url='https://stripe.com',
        )
        return {"success": True, "url": session.url}
    except Exception as e:
        print("Stripe Error:", e)
        return {"success": False, "error": str(e)}


@app.post("/api/portfolio/stripe/confirm")
async def confirm_top_up():
    """Hackathon backdoor: Adds $500 to the global state after a successful checkout"""
    global HACKATHON_TOP_UP_TOTAL
    HACKATHON_TOP_UP_TOTAL += 500
    return {"success": True, "new_total": HACKATHON_TOP_UP_TOTAL}


@app.get("/api/portfolio")
async def get_portfolio():
    """Fetches the portfolio and applies any Stripe top-ups"""
    global HACKATHON_TOP_UP_TOTAL
    global HACKATHON_SABOTAGE_MODE

    assets = copy.deepcopy(MOCK_ASSETS)

    villain_event_active = HACKATHON_SABOTAGE_MODE
    if HACKATHON_SABOTAGE_MODE:
        for a in assets:
            if a['name'] == 'Savings':
                a['value'] = 15000   # Drop savings dangerously low
            if a['name'] == 'Crypto':
                a['value'] = 120000  # Spike crypto to look reckless

    for a in assets:
        if a['name'] == 'Savings':
            a['value'] += HACKATHON_TOP_UP_TOTAL

    total = sum(a['value'] for a in assets)
    for a in assets:
        a['pct'] = round((a['value'] / total) * 100) if total > 0 else 0

    portfolio_obj = {"total": total, "assets": assets}
    # Pass villain_events_count=1 when sabotaged so health score reflects it
    villain_events_count = 1 if HACKATHON_SABOTAGE_MODE else 0
    health = calculate_health_score(portfolio_obj, villain_events_count=villain_events_count, streak_avg=12)
    wealth_age = calculate_wealth_age(total, 35, health["overall"])

    for a in assets:
        if a['name'] == 'Crypto' and a['pct'] > 30:
            a['mood'] = 'worried'
        elif a['pct'] > 0:
            a['mood'] = 'happy'
        else:
            a['mood'] = 'neutral'

    return {
        "total": total,
        "assets": assets,
        "health": health,
        "wealth_age": wealth_age,
        "villain_event_active": villain_event_active,
        "history": [
            {"m": "Jan", "v": 465000},
            {"m": "Feb", "v": 480000},
            {"m": "Mar", "v": total}
        ]
    }

class SandboxPortfolio(BaseModel):
    total: float
    assets: list

def _get_supplemental_assets() -> list[dict]:
    """Optional non-Alpaca wealth (Real Estate, Crypto, Bonds). Set in .env or 0."""
    def _float_env(name: str, default: float = 0.0) -> float:
        try:
            return float(os.getenv(name, str(default)))
        except (TypeError, ValueError):
            return default

    return [
        {"name": "Real Estate", "value": _float_env("SUPPLEMENTAL_REAL_ESTATE", 0), "pct": 0, "color": "#10b981", "emoji": "🏠", "mood": "neutral"},
        {"name": "Crypto", "value": _float_env("SUPPLEMENTAL_CRYPTO", 0), "pct": 0, "color": "#f59e0b", "emoji": "₿", "mood": "neutral"},
        {"name": "Bonds", "value": _float_env("SUPPLEMENTAL_BONDS", 0), "pct": 0, "color": "#ec4899", "emoji": "📜", "mood": "neutral"},
    ]


def _alpaca_history_to_chart(timestamps: list[int], equity: list[float], num_points: int = 6) -> list[dict]:
    """Convert Alpaca portfolio history to [{ m: 'Oct', v: 123 }, ...] for 6-month chart."""
    if not timestamps or not equity or len(timestamps) != len(equity):
        return []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    n = len(equity)
    step = max(1, (n - 1) // (num_points - 1)) if num_points > 1 else 1
    indices = [min(i * step, n - 1) for i in range(num_points)]
    result = []
    for i in indices:
        ts = timestamps[i]
        dt = datetime.utcfromtimestamp(ts)
        result.append({"m": month_names[dt.month - 1], "v": round(equity[i], 2)})
    return result


async def fetch_alpaca_portfolio() -> SandboxPortfolio | None:
    """
    Fetch from Alpaca: Stocks (positions) + Cash (Savings).
    Merge with supplemental assets (Real Estate, Crypto, Bonds) from env so we return full wealth.
    """
    if not (ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY):
        print("Alpaca: not configured (set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY in .env)")
        return None

    headers = {
        "APCA-API-KEY-ID": ALPACA_API_KEY_ID,
        "APCA-API-SECRET-KEY": ALPACA_API_SECRET_KEY,
    }

    async with httpx.AsyncClient(base_url=ALPACA_BASE_URL, headers=headers, timeout=5.0) as client:
        try:
            acct_resp = await client.get("/v2/account")
            acct_resp.raise_for_status()
            acct = acct_resp.json()
            equity = float(acct.get("portfolio_value", 0.0) or acct.get("equity", 0.0))
            cash = float(acct.get("cash", 0.0))

            pos_resp = await client.get("/v2/positions")
            pos_resp.raise_for_status()
            positions = pos_resp.json()
            stocks_value = 0.0
            stock_holdings = []
            for p in positions:
                qty = float(p.get("qty", 0))
                price = float(p.get("current_price", 0))
                mv = qty * price
                stocks_value += mv
                unrealized_pct = float(p.get("unrealized_plpc", 0) or 0) * 100
                stock_holdings.append({
                    "ticker": p.get("symbol", ""),
                    "name": p.get("symbol", "Position"),
                    "value": round(mv, 2),
                    "change": round(unrealized_pct, 2),
                })

            # Optional: 6-month portfolio history for charts
            portfolio_history: list[dict] = []
            try:
                hist_resp = await client.get("/v2/account/portfolio/history", params={"period": "6M", "timeframe": "1D"})
                if hist_resp.status_code == 200:
                    hist = hist_resp.json()
                    ts_list = hist.get("timestamp") or []
                    eq_list = hist.get("equity") or []
                    portfolio_history = _alpaca_history_to_chart(ts_list, eq_list, 6)
            except Exception:
                pass

            # Synthetic 6-month history for Savings (Alpaca doesn't give cash-over-time)
            cash_val = max(0.0, cash)
            last_equity = portfolio_history[-1]["v"] if portfolio_history else 0
            if cash_val > 0 and len(portfolio_history) >= 2 and last_equity > 0:
                savings_history = [{"m": p["m"], "v": round(cash_val * (p["v"] / last_equity), 2)} for p in portfolio_history]
            else:
                # No equity history or zero: show gentle growth to current cash
                savings_history = [
                    {"m": "Oct", "v": round(cash_val * 0.92, 2)}, {"m": "Nov", "v": round(cash_val * 0.94, 2)},
                    {"m": "Dec", "v": round(cash_val * 0.96, 2)}, {"m": "Jan", "v": round(cash_val * 0.98, 2)},
                    {"m": "Feb", "v": round(cash_val * 0.99, 2)}, {"m": "Mar", "v": round(cash_val, 2)},
                ] if cash_val > 0 else []

            # Performance % from history (month = last vs prev)
            def _pct_from_history(h: list[dict]) -> float:
                if len(h) < 2:
                    return 0.0
                prev, last = h[-2]["v"], h[-1]["v"]
                return round((last - prev) / prev * 100, 2) if prev else 0.0

            month_pct_stocks = _pct_from_history(portfolio_history)
            month_pct_savings = _pct_from_history(savings_history)

            # Alpaca: Stocks + Cash (Savings). Order matches MOCK_ASSETS.
            supplemental = _get_supplemental_assets()
            assets = [
                {
                    "name": "Stocks",
                    "value": stocks_value,
                    "pct": 0,
                    "color": "#3b82f6",
                    "emoji": "📈",
                    "mood": "happy",
                    "holdings": stock_holdings,
                    "history": portfolio_history,
                    "day": 0,
                    "week": round(month_pct_stocks * 0.25, 2),
                    "month": month_pct_stocks,
                    "year": round(month_pct_stocks * 4, 2) if portfolio_history else 0,
                },
                supplemental[0],
                {
                    "name": "Savings",
                    "value": cash_val,
                    "pct": 0,
                    "color": "#8b5cf6",
                    "emoji": "💰",
                    "mood": "happy",
                    "holdings": [{"ticker": "CASH", "name": "Brokerage Cash", "value": round(cash_val, 2), "change": 0}] if cash_val > 0 else [],
                    "history": savings_history,
                    "day": 0,
                    "week": round(month_pct_savings * 0.25, 2),
                    "month": month_pct_savings,
                    "year": round(month_pct_savings * 4, 2),
                },
                supplemental[1],
                supplemental[2],
            ]

            total = sum(a["value"] for a in assets)
            if total <= 0:
                total = equity if equity > 0 else 0
            if total <= 0:
                return None

            for a in assets:
                a["pct"] = round((a["value"] / total) * 100) if total > 0 else 0

            return SandboxPortfolio(total=total, assets=assets)
        except Exception as e:
            print("Alpaca sandbox fetch error:", repr(e))
            return None


@app.get("/api/alpaca/status")
async def alpaca_status():
    """
    Check if Alpaca paper API is configured and reachable.
    Returns connected=True only when account and positions endpoints succeed.
    """
    if not (ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY):
        return {
            "connected": False,
            "reason": "ALPACA_API_KEY_ID or ALPACA_API_SECRET_KEY not set (check .env)",
        }
    headers = {
        "APCA-API-KEY-ID": ALPACA_API_KEY_ID,
        "APCA-API-SECRET-KEY": ALPACA_API_SECRET_KEY,
    }
    try:
        async with httpx.AsyncClient(base_url=ALPACA_BASE_URL, headers=headers, timeout=5.0) as client:
            acct_resp = await client.get("/v2/account")
            acct_resp.raise_for_status()
            acct = acct_resp.json()
            return {
                "connected": True,
                "reason": "ok",
                "account_status": acct.get("status"),
                "base_url": ALPACA_BASE_URL,
            }
    except httpx.HTTPStatusError as e:
        return {
            "connected": False,
            "reason": f"Alpaca API error: HTTP {e.response.status_code}",
        }
    except Exception as e:
        return {
            "connected": False,
            "reason": f"Alpaca request failed: {repr(e)}",
        }


@app.get("/api/coingecko/status")
async def coingecko_status():
    """Check if CoinGecko API is configured and reachable (crypto prices)."""
    if not COINGECKO_API_KEY:
        return {
            "connected": False,
            "reason": "COINGECKO_API_KEY not set (check .env)",
        }
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {"ids": "bitcoin", "vs_currencies": "sgd"}
    headers = {"x-cg-api-key": COINGECKO_API_KEY}
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url, params=params, headers=headers, timeout=5.0)
        if resp.status_code != 200:
            return {
                "connected": False,
                "reason": f"CoinGecko API error: HTTP {resp.status_code}",
            }
        data = resp.json()
        if "bitcoin" in data and "sgd" in data.get("bitcoin", {}):
            return {"connected": True, "reason": "ok"}
        if "status" in data and "error_message" in data.get("status", {}):
            return {"connected": False, "reason": data["status"].get("error_message", "API error")}
        return {"connected": False, "reason": "Unexpected response format"}
    except Exception as e:
        return {"connected": False, "reason": f"Request failed: {repr(e)}"}


@app.get("/api/gemini/status")
async def gemini_status():
    """Check if Gemini API key is set (used for prophecies and villain roast)."""
    key = os.getenv("GEMINI_API_KEY")
    if not key or not key.strip():
        return {"connected": False, "reason": "GEMINI_API_KEY not set (check .env)"}
    return {"connected": True, "reason": "key set"}


class SimulatorRequest(BaseModel):
    scenario: str


@app.post("/api/simulator/run")
async def simulator_run(req: SimulatorRequest):
    params = await extract_simulation_parameters(req.scenario)

    wealth = 487500
    annual_return_rate = 0.08

    years = params.get("years_to_simulate", 5)
    monthly = params.get("monthly_contribution", 500)
    expense = params.get("one_time_expense", 0)
    expense_yr = params.get("expense_year", 1)
    pause_months = params.get("income_pause_months", 0)

    projected = wealth
    for y in range(1, years + 1):
        projected *= (1 + annual_return_rate)
        months_saving = 12
        if y == 1:
            months_saving -= pause_months
        projected += (monthly * max(0, months_saving))
        if y == expense_yr:
            projected -= expense

    projected = max(0, round(projected))

    prophecy = await generate_prophecy_text({
        "projectedWealth": projected,
        "scenario": req.scenario
    })

    return {
        "projectedWealth": projected,
        "softLifeScore": min(100, round((projected / 500000) * 80)),
        "prophecyText": prophecy,
        "extractedParams": params
    }


class ProphecyRequest(BaseModel):
    riskLevel: int
    goalsSummary: str


@app.post("/api/manifestation/prophecy")
async def get_manifestation_prophecy(req: ProphecyRequest):
    """Endpoint for the Manifestation Board to get a Gemini prophecy"""
    prophecy = await generate_gemini_prophecy(req.riskLevel, req.goalsSummary)
    return {"success": True, "prophecyText": prophecy}


# FIX: Use a proper request body instead of a query param on a POST route.
# This ensures the frontend can reliably send riskLevel and get villain alerts.
class VillainRoastRequest(BaseModel):
    riskLevel: int = 5


@app.post("/api/villain/roast")
async def get_villain_data(req: VillainRoastRequest):
    global HACKATHON_SABOTAGE_MODE

    # FIX: Return early with empty alerts when sabotage is not active
    if not HACKATHON_SABOTAGE_MODE:
        return {"alerts": [], "caughtIn4K": [], "history": []}

    # Build the sabotaged asset snapshot so the roast reflects real numbers
    sabotaged_assets = copy.deepcopy(MOCK_ASSETS)
    for a in sabotaged_assets:
        if a['name'] == 'Savings':
            a['value'] = 15000
        if a['name'] == 'Crypto':
            a['value'] = 120000

    # Recalculate percentages so the AI sees accurate pct values
    total = sum(a['value'] for a in sabotaged_assets)
    for a in sabotaged_assets:
        a['pct'] = round((a['value'] / total) * 100) if total > 0 else 0

    dynamic_message, action_steps = await generate_villain_roast(sabotaged_assets, req.riskLevel)

    return {
        "alerts": [{
            "id": "crypto_overweight",
            "message": dynamic_message,
            "steps": action_steps,
            "severity": "high",
            "emoji": "🚨"
        }],
        "caughtIn4K": ["you've ordered food delivery 23 times this month. we see you bestie 👀"],
        "history": []
    }

@app.get("/api/crypto/live-prices")
async def get_live_crypto_prices():
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {
        "ids": "bitcoin,ethereum,solana",
        "vs_currencies": "sgd",
    }

    headers = {}

    if COINGECKO_API_KEY:
        headers["x-cg-api-key"] = COINGECKO_API_KEY
    else:
        print("CoinGecko: not configured (set COINGECKO_API_KEY in .env), using fallback only")

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, params=params, headers=headers, timeout=5.0)
            print("CoinGecko raw response status:", resp.status_code)
            print("CoinGecko raw body (first 300 chars):", resp.text[:300])

            if resp.status_code != 200:
                print("CoinGecko: non-200 response, using fallback")
                return {"success": True, "data": FALLBACK_DATA}

            data = resp.json()
            # Extra safety: make sure expected keys exist
            if not all(k in data for k in ("bitcoin", "ethereum", "solana")):
                print("CoinGecko: unexpected payload, using fallback")
                return {"success": True, "data": FALLBACK_DATA}

            return {
                "success": True,
                "data": [
                    {
                        "name": "Bitcoin",
                        "symbol": "BTC",
                        "price": float(data["bitcoin"]["sgd"]),
                        "color": "#f59e0b",
                        "icon": "₿",
                    },
                    {
                        "name": "Ethereum",
                        "symbol": "ETH",
                        "price": float(data["ethereum"]["sgd"]),
                        "color": "#627eea",
                        "icon": "⟠",
                    },
                    {
                        "name": "Solana",
                        "symbol": "SOL",
                        "price": float(data["solana"]["sgd"]),
                        "color": "#14f195",
                        "icon": "◎",
                    },
                ],
            }
        except Exception as e:
            print("API Fetch Error (CoinGecko) EXCEPTION:", repr(e))
            return {"success": True, "data": FALLBACK_DATA}

@app.get("/api/stocks/live-prices")
async def get_live_stock_prices():
    if not ALPHAVANTAGE_API_KEY:
        print("ALPHAVANTAGE_API_KEY not set, using fallback stock data")
        return {"success": True, "data": STOCK_FALLBACK_DATA}

    base_url = "https://www.alphavantage.co/query"
    symbols = [
        ("Apple", "AAPL", "#22c55e"),
        ("Microsoft", "MSFT", "#3b82f6"),
        ("Tesla", "TSLA", "#ef4444"),
    ]

    results = []

    # Fallback prices by symbol (used when rate-limited or missing data)
    fallback_by_symbol = {d["symbol"]: d["price"] for d in STOCK_FALLBACK_DATA}

    async with httpx.AsyncClient() as client:
        try:
            for i, (name, symbol, color) in enumerate(symbols):
                if i > 0:
                    await asyncio.sleep(1.2)  # Free tier: 1 request per second
                params = {
                    "function": "GLOBAL_QUOTE",
                    "symbol": symbol,
                    "apikey": ALPHAVANTAGE_API_KEY,
                }
                resp = await client.get(base_url, params=params, timeout=5.0)
                print(f"Alpha Vantage {symbol} status:", resp.status_code)
                data = resp.json()

                # Rate limit returns {"Information": "..."} instead of quote
                if "Information" in data:
                    print(f"Alpha Vantage rate limit for {symbol}, using fallback price")
                    price = fallback_by_symbol.get(symbol, 0.0)
                else:
                    quote = data.get("Global Quote") or data.get("GlobalQuote") or {}
                    price_str = quote.get("05. price") or quote.get("05.price")
                    if not price_str:
                        print(f"Missing price for {symbol}, using fallback")
                        price = fallback_by_symbol.get(symbol, 0.0)
                    else:
                        price = float(price_str)

                results.append(
                    {
                        "name": name,
                        "symbol": symbol,
                        "price": price,
                        "color": color,
                        "icon": "📈",
                    }
                )

            return {"success": True, "data": results}
        except Exception as e:
            print("Alpha Vantage fetch error:", repr(e))
            return {"success": True, "data": STOCK_FALLBACK_DATA}
        
@app.get("/api/portfolio/sandbox")
async def get_sandbox_portfolio():
    """
    Try to build a portfolio from sandbox (Alpaca).
    If anything fails, fall back to the existing mock /api/portfolio logic.
    """
    sandbox = await fetch_alpaca_portfolio()
    if sandbox is None:
        print("Sandbox portfolio: using fallback (Alpaca not available)")
        # Fallback: reuse the existing logic from /api/portfolio
        return await get_portfolio()

    # Reuse existing health/wealth age logic so the blob + villain arc still work
    assets = sandbox.assets
    total = sandbox.total

    portfolio_obj = {"total": total, "assets": assets}
    health = calculate_health_score(portfolio_obj, villain_events_count=0, streak_avg=12)
    wealth_age = calculate_wealth_age(total, 35, health["overall"])

    # Ensure moods for blobs
    for a in assets:
        if a["name"] == "Crypto" and a.get("pct", 0) > 30:
            a["mood"] = "worried"
        elif a.get("pct", 0) > 0:
            a["mood"] = "happy"
        else:
            a["mood"] = "neutral"

    return {
        "total": total,
        "assets": assets,
        "health": health,
        "wealth_age": wealth_age,
        "villain_event_active": False,
        "history": [],
    }