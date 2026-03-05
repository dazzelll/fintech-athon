import os
from fastapi import FastAPI, Depends, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler

import plaid
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.accounts_balance_get_request import AccountsBalanceGetRequest
from plaid.model.sandbox_public_token_create_request import SandboxPublicTokenCreateRequest

from database import engine, get_db, Base
import models
from engines import calculate_health_score, calculate_wealth_age, generate_prophecy_text

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

# 3. Plaid Configuration
configuration = plaid.Configuration(
    host=plaid.Environment.Sandbox,
    api_key={
        'clientId': os.getenv('PLAID_CLIENT_ID'),
        'secret': os.getenv('PLAID_SECRET'),
    }
)
api_client = plaid.ApiClient(configuration)
plaid_client = plaid_api.PlaidApi(api_client)

# In-memory token storage for hackathon speed (tie this to DB later)
HACKATHON_ACCESS_TOKEN = None

# --- MOCK FALLBACK DATA ---
MOCK_ASSETS = [
    {"name": "Stocks", "value": 185000, "pct": 38, "color": "#3b82f6", "emoji": "📈"},
    {"name": "Real Estate", "value": 150000, "pct": 31, "color": "#10b981", "emoji": "🏠"},
    {"name": "Savings", "value": 75000, "pct": 15, "color": "#8b5cf6", "emoji": "💰"},
    {"name": "Crypto", "value": 45000, "pct": 9, "color": "#f59e0b", "emoji": "₿"},
    {"name": "Bonds", "value": 32500, "pct": 7, "color": "#ec4899", "emoji": "📜"}
]

# --- ROUTES ---

@app.post("/api/portfolio/plaid/link-token")
async def create_link_token():
    request = LinkTokenCreateRequest(
        products=[Products("auth"), Products("transactions")],
        client_name="Wealth Wellness Hub",
        country_codes=[CountryCode("US")],
        language="en",
        user=LinkTokenCreateRequestUser(client_user_id="hackathon-user")
    )
    response = plaid_client.link_token_create(request)
    return {"link_token": response['link_token']}

@app.post("/api/portfolio/plaid/exchange")
async def exchange_public_token(data: dict = Body(...)):
    global HACKATHON_ACCESS_TOKEN
    request = ItemPublicTokenExchangeRequest(public_token=data['public_token'])
    response = plaid_client.item_public_token_exchange(request)
    HACKATHON_ACCESS_TOKEN = response['access_token']
    return {"success": True}

@app.post("/api/portfolio/plaid/demo-connect")
async def demo_connect():
    global HACKATHON_ACCESS_TOKEN
    try:
        # 1. Instantly create a fake bank login behind the scenes (First Platypus Bank)
        pt_request = SandboxPublicTokenCreateRequest(
            institution_id="ins_109508",
            initial_products=[Products("transactions"), Products("auth")]
        )
        pt_response = plaid_client.sandbox_public_token_create(pt_request)
        
        # 2. Exchange it for the permanent access token
        exc_request = ItemPublicTokenExchangeRequest(public_token=pt_response['public_token'])
        exc_response = plaid_client.item_public_token_exchange(exc_request)
        
        HACKATHON_ACCESS_TOKEN = exc_response['access_token']
        return {"success": True, "message": "Plaid Sandbox Connected!"}
    except Exception as e:
        print("Plaid Demo Error:", e)
        return {"success": False, "error": str(e)}

@app.get("/api/portfolio")
async def get_portfolio():
    global HACKATHON_ACCESS_TOKEN
    assets = MOCK_ASSETS.copy()
    total = sum(a['value'] for a in assets)

    if HACKATHON_ACCESS_TOKEN:
        try:
            # Fetch Live Plaid Sandbox Data
            request = AccountsBalanceGetRequest(access_token=HACKATHON_ACCESS_TOKEN)
            response = plaid_client.accounts_balance_get(request)
            
            savings_total = 0
            for acc in response['accounts']:
                if acc['subtype'] in [plaid.model.account_subtype.AccountSubtype('checking'), plaid.model.account_subtype.AccountSubtype('savings')]:
                    savings_total += acc['balances']['current'] or 0
            
            # Update Savings Blob with live Plaid data
            for a in assets:
                if a['name'] == 'Savings':
                    a['value'] = savings_total
            
            total = sum(a['value'] for a in assets)
            for a in assets:
                a['pct'] = round((a['value'] / total) * 100) if total > 0 else 0

        except Exception as e:
            print("Plaid Fetch Error:", e)

    # Calculate Health & Add Moods
    portfolio_obj = {"total": total, "assets": assets}
    health = calculate_health_score(portfolio_obj, villain_events_count=0, streak_avg=12)
    wealth_age = calculate_wealth_age(total, 35, health["overall"])

    for a in assets:
        if a['name'] == 'Crypto' and a['pct'] > 30: a['mood'] = 'worried'
        elif a['pct'] > 0: a['mood'] = 'happy'
        else: a['mood'] = 'neutral'

    return {
        "total": total,
        "assets": assets,
        "health": health,
        "wealth_age": wealth_age,
        "history": [{"m": "Jan", "v": 465000}, {"m": "Feb", "v": 480000}, {"m": "Mar", "v": 487500}]
    }

@app.post("/api/simulator/run")
async def simulator_run(data: dict = Body(...)):
    # Simulating simple wealth projection based on your Node.js logic
    wealth = 487500
    monthly = data.get('monthlyContribution', 500)
    years = data.get('timeYears', 5)
    
    projected = round(wealth * (1.08 ** years) + (monthly * 12 * years))
    
    # Trigger OpenAI GenZ Prophecy
    prophecy = await generate_prophecy_text({
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
    return {
        "alerts": [{"id": "crypto_overweight", "message": "your crypto is getting a little too confident bestie", "severity": "high", "emoji": "🪙"}],
        "caughtIn4K": ["you've ordered food delivery 23 times this month. we see you bestie 👀"],
        "history": []
    }