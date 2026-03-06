import math
import os
from dotenv import load_dotenv
import httpx
import json
import google.generativeai as genai
import traceback

# Load environment variables
load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# --- SCORING ENGINE ---
def calculate_health_score(portfolio, villain_events_count=0, streak_avg=0):
    assets = portfolio.get('assets', [])
    total = portfolio.get('total', 0)
    if total == 0: return {"overall": 0, "diversification": 0, "liquidity": 0, "behavioral_resilience": 0}

    # Diversification (Herfindahl-Hirschman Index)
    hhi = sum([(a['pct'] / 100)**2 for a in assets])
    diversification = min(100, round((1 - hhi) * 125))

    # Liquidity (Savings Blob)
    savings_pct = next((a['pct'] for a in assets if a['name'] == 'Savings'), 0)
    liquidity = min(100, savings_pct * 5)

    # Resilience
    villain_penalty = min(40, villain_events_count * 10)
    streak_bonus = min(20, (streak_avg or 0) * 2)
    resilience = max(0, min(100, 60 + streak_bonus - villain_penalty))

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
        model = genai.GenerativeModel('gemini-2.5-flash', generation_config={"response_mime_type": "application/json"})
        
        prompt = f"""
        You are a financial data parser. Read the user's scenario and extract the parameters into JSON.
        Assume a default timeframe of 5 years and a default monthly contribution of $500 if not specified.

        User Scenario: "{scenario_text}"

        Return ONLY a JSON object with these exact keys:
        - "years_to_simulate" (int): How many years to project. Default 5.
        - "monthly_contribution" (int): How much they save per month. Default 500.
        - "one_time_expense" (int): Any big purchase mentioned (e.g., car, vacation). Default 0.
        - "expense_year" (int): Which year the expense happens. Default 1.
        - "income_pause_months" (int): How many months they are out of a job or not saving. Default 0.
        """
        response = await model.generate_content_async(prompt)
        return json.loads(response.text)
        
    except Exception as e:
        print("Gemini Extraction Error:", e)
        return {
            "years_to_simulate": 5, "monthly_contribution": 500,
            "one_time_expense": 0, "expense_year": 1, "income_pause_months": 0
        }

async def generate_prophecy_text(data):
    """Simulator Prophecy - Supportive and Strategic"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""You are a brilliant, supportive Gen-Z financial strategist for an app called Wealth Wellness Hub.
        The user just ran a simulation to test a financial decision.
        
        Data: Projected wealth after this scenario: ${data['projectedWealth']}. 
        The scenario they simulated: "{data.get('scenario', 'Normal growth')}"
        
        Rules:
        - DO NOT roast them. This is a safe space to test ideas.
        - Give them 1 piece of actionable advice or a smart alternative/pivot based on their scenario.
        - Sound like a highly intelligent Gen Z bestie. Use positive slang (e.g., 'main character energy', 'level up', 'secure the bag').
        - Max 3 sentences. No bullet points.
        """
        
        response = await model.generate_content_async(prompt)
        return response.text.strip()
    except Exception as e:
        print("Gemini API Error:", e)
        return "Testing your options is a massive W. Keep tweaking the variables until you secure the bag."
    
async def generate_gemini_prophecy(risk_level: int, goals_summary: str):
    """Manifestation Board Prophecy via Official GenAI SDK"""
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
        return f"The oracle is temporarily disconnected. Error: {str(e)}"
    
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

The portfolio has two critical problems: savings are dangerously low and crypto is overweight.

Return ONLY a JSON object with exactly these two keys:

"message": A single sentence (max 20 words, lowercase only) diagnosing the biggest problem with their portfolio. Be specific to their actual numbers. Slightly snarky but friendly — like a bestie who happens to be a financial advisor. No hashtags.

"steps": 2-3 concrete action steps they should take RIGHT NOW to fix this portfolio, tailored to their {risk_level}/10 risk level. Write as a short paragraph (not a list). Sound like an intelligent Gen Z financial advisor. Reference their actual numbers. Be specific — e.g. "move $X from crypto into savings" not vague advice. Max 4 sentences.
"""
        
        response = model.generate_content(prompt)
        result = json.loads(response.text)
        message = result.get("message", "your portfolio needs urgent attention bestie.")
        steps = result.get("steps", "Start by rebalancing — move funds from crypto into savings to hit at least 15% liquidity.")
        return message, steps
        
    except Exception as e:
        print("Gemini API Error:", e)
        fallback_message = "your savings are depleted and crypto is wilding bestie. we need to fix this."
        fallback_steps = "Move at least $20,000 from crypto into your savings account now to restore liquidity. Then set a monthly auto-transfer of $500 into savings until you hit 15% of your total portfolio."
        return fallback_message, fallback_steps