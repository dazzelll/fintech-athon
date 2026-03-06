import os
import copy
from fastapi import FastAPI, Depends, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler

import stripe

import google.generativeai as genai

from database import engine, get_db, Base
import models
from pydantic import BaseModel
from engines import calculate_health_score, calculate_wealth_age, generate_gemini_prophecy, generate_villain_roast

# 1. Create DB Tables
models.Base.metadata.create_all(bind=engine)

# 2. Setup Background Scheduler (Replaces node-cron)
scheduler = BackgroundScheduler()

def check_villain_alerts():
    print("CRON: Checking Villain Arc patterns...")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs every hour
    scheduler.add_job(check_villain_alerts, 'interval', hours=1)
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# Stripe Configuration
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
# Gemini Configuration
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# State variable to track how much money we've "topped up" via Stripe
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

@app.post("/api/demo/sabotage")
async def trigger_sabotage():
    global HACKATHON_SABOTAGE_MODE
    HACKATHON_SABOTAGE_MODE = True
    return {"success": True, "message": "Data sabotaged!"}

# --- ROUTES ---

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
                    'unit_amount': 50000, # $500.00 in cents
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
    
    # Copy the mock data so we don't permanently alter the original list
    assets = copy.deepcopy(MOCK_ASSETS)
    
    # --- THE SABOTAGE MATH ---
    # Ruin their financial health if the secret switch was flipped
    if HACKATHON_SABOTAGE_MODE:
        for a in assets:
            if a['name'] == 'Savings':
                a['value'] = 15000  # Drop savings dangerously low (under 12%)
            if a['name'] == 'Crypto':
                a['value'] = 120000 # Spike crypto to make them look reckless
    
    # 1. Apply the Stripe money directly to the "Savings" asset
    for a in assets:
        if a['name'] == 'Savings':
            a['value'] += HACKATHON_TOP_UP_TOTAL

    # 2. Recalculate totals and percentages with the new money
    total = sum(a['value'] for a in assets)
    for a in assets:
        a['pct'] = round((a['value'] / total) * 100) if total > 0 else 0

    # Calculate Health & Add Moods
    portfolio_obj = {"total": total, "assets": assets}
    health = calculate_health_score(portfolio_obj, villain_events_count=0, streak_avg=12)
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
        "history": [{"m": "Jan", "v": 465000}, {"m": "Feb", "v": 480000}, {"m": "Mar", "v": total}] # Dynamically update the final chart month
    }

@app.post("/api/simulator/run")
async def simulator_run(data: dict = Body(...)):
    # Simulating simple wealth projection based on your Node.js logic
    wealth = 487500
    monthly = data.get('monthlyContribution', 500)
    years = data.get('timeYears', 5)
    
    projected = round(wealth * (1.08 ** years) + (monthly * 12 * years))
    
    # Trigger OpenAI GenZ Prophecy
    prophecy = await generate_gemini_prophecy({
        "projectedWealth": projected,
        "freedomYear": 2026 + years + 5,
        "healthScore": 85
    })
    
    return {
        "projectedWealth": projected,
        "softLifeScore": min(100, round((projected / 500000) * 80)),
        "prophecyText": prophecy
    }

@app.get("/api/villain")
async def get_villain_data():
    global HACKATHON_SABOTAGE_MODE
    
    # 1. If healthy, stay quiet!
    if not HACKATHON_SABOTAGE_MODE:
        return {"alerts": []}
        
    # 2. If sabotaged, ask the engine to generate the roast based on the current assets
    dynamic_message = await generate_villain_roast(MOCK_ASSETS)

    return {
        "alerts": [{
            "id": "crypto_overweight", 
            "message": dynamic_message, 
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
    prophecy = await generate_gemini_prophecy(req.mode, req.goalsSummary)
    return {"success": True, "prophecyText": prophecy}