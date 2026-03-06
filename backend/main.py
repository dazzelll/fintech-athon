import os
import copy
import httpx
from fastapi import FastAPI, Depends, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
import stripe
from dotenv import load_dotenv
load_dotenv()

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

class ProphecyRequest(BaseModel):
    mode: str
    goalsSummary: str
@app.post("/api/manifestation/prophecy")
async def get_manifestation_prophecy(req: ProphecyRequest):
    """Endpoint for the Manifestation Board to get a Gemini prophecy"""
    prophecy = await generate_gemini_prophecy(
    mode=data.get('mode', 'growth'),
    goals_summary=f"Projected wealth: ${projected:,} by {2026 + years + 5}, health score: 85"
)
    
@app.post("/api/villain/roast")
async def get_villain_roast():
    """Always generates a snarky portfolio check based on current state"""
    assets = copy.deepcopy(MOCK_ASSETS)
    
    # Apply sabotage if active so advice reflects real current state
    if HACKATHON_SABOTAGE_MODE:
        for a in assets:
            if a['name'] == 'Savings': a['value'] = 15000
            if a['name'] == 'Crypto':  a['value'] = 120000

    roast = await generate_villain_roast(assets)
    return {"success": True, "roast": roast}

@app.get("/api/crypto/live-prices")
async def get_live_crypto_prices():
    url = "https://api.coingecko.com/api/v3/simple/price"
    params = {
        "ids": "bitcoin,ethereum,solana",
        "vs_currencies": "sgd",
    }

    headers = {}

    if COINGECKO_API_KEY:
        # Most CoinGecko keys use this header
        headers["x-cg-api-key"] = COINGECKO_API_KEY
    else:
        print("COINGECKO_API_KEY NOT FOUND in env, using fallback only")

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(url, params=params, headers=headers, timeout=5.0)
            print("CoinGecko raw response status:", resp.status_code)
            print("CoinGecko raw body (first 300 chars):", resp.text[:300])

            if resp.status_code != 200:
                # Any non‑200 → use fallback
                return {"success": True, "data": FALLBACK_DATA}

            data = resp.json()
            # Extra safety: make sure expected keys exist
            if not all(k in data for k in ("bitcoin", "ethereum", "solana")):
                print("Unexpected CoinGecko payload keys:", list(data.keys()))
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

    async with httpx.AsyncClient() as client:
        try:
            for name, symbol, color in symbols:
                params = {
                    "function": "GLOBAL_QUOTE",
                    "symbol": symbol,
                    "apikey": ALPHAVANTAGE_API_KEY,
                }
                resp = await client.get(base_url, params=params, timeout=5.0)
                print(f"Alpha Vantage {symbol} status:", resp.status_code)
                data = resp.json()

                quote = data.get("Global Quote") or data.get("GlobalQuote") or {}
                price_str = quote.get("05. price") or quote.get("05.price")

                if not price_str:
                    print(f"Missing price for {symbol}, got:", data)
                    raise ValueError("No price in response")

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
        
