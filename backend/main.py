import os
import copy
import asyncio
from datetime import datetime
import httpx
from fastapi import FastAPI, Depends, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
import stripe
from pathlib import Path
from dotenv import load_dotenv
import time

# Load .env from backend/ or project root (when running as uvicorn from backend/)
load_dotenv()
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import google.generativeai as genai

from database import engine, get_db, Base
import models
from pydantic import BaseModel
from engines import (
    calculate_health_score,
    calculate_wealth_age,
    generate_prophecy_text,
    generate_gemini_prophecy,
    extract_simulation_parameters,
    generate_villain_roast,
    build_portfolio_trajectory,
    MOCK_HISTORY_SEED,          # ← ADD
    HISTORY_SEEDED_STREAKS,     # ← ADD
)

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
# User-configurable guardrail: max amount they feel okay draining from Savings
MAX_SAVINGS_SPEND = 20000.0
TOTAL_DEBT = 0.0

# --- MOCK FALLBACK DATA ---
MOCK_ASSETS = [
    {"name": "Stocks",               "value": 185000, "pct": 38, "color": "#3b82f6", "emoji": "📈"},
    {"name": "Real Estate & Others", "value": 150000, "pct": 31, "color": "#10b981", "emoji": "🏠"},
    {"name": "Savings",              "value": 75000,  "pct": 15, "color": "#8b5cf6", "emoji": "💰"},
    {"name": "Crypto",               "value": 45000,  "pct": 9,  "color": "#f59e0b", "emoji": "₿"},
    {"name": "Bonds",                "value": 32500,  "pct": 7,  "color": "#ec4899", "emoji": "📜"}
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
    """
    Secret long‑press easter egg on the Stack'd logo.
    When triggered, we flip sabotage mode on. The actual damage applied to the
    portfolio is calculated centrally from MAX_SAVINGS_SPEND.
    """
    global HACKATHON_SABOTAGE_MODE
    HACKATHON_SABOTAGE_MODE = True
    print(f"DEBUG: Sabotage Mode is now {HACKATHON_SABOTAGE_MODE} (max_savings_spend={MAX_SAVINGS_SPEND})")
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
async def get_portfolio(db: Session = Depends(get_db)):
    """Fetches the portfolio and applies any Stripe top-ups"""
    global HACKATHON_TOP_UP_TOTAL
    global HACKATHON_SABOTAGE_MODE

    assets = copy.deepcopy(MOCK_ASSETS)

    # Merge in any manually logged assets from settings
    manual_totals = _manual_asset_totals(db)
    for a in assets:
        extra = manual_totals.get(a["name"])
        if extra:
            try:
                a["value"] += float(extra)
            except (TypeError, ValueError):
                pass

    villain_event_active = HACKATHON_SABOTAGE_MODE

    # Apply any Stripe top-ups first (these are "good" events)
    for a in assets:
        if a["name"] == "Savings":
            a["value"] += HACKATHON_TOP_UP_TOTAL

    # Then, if sabotage is active, drain Savings a bit more than the guardrail
    assets = _apply_sabotage_to_assets(assets)

    total = sum(a["value"] for a in assets)
    for a in assets:
        a["pct"] = round((a["value"] / total) * 100) if total > 0 else 0

    portfolio_obj = {"total": total, "assets": assets}
    # Pass villain_events_count=1 when sabotaged so health score reflects it
    villain_events_count = db.query(models.VillainArcEvent).filter(
    models.VillainArcEvent.user_id.is_(None)
    ).count()
    if HACKATHON_SABOTAGE_MODE:
        villain_events_count += 1
    challenges_completed = (
    db.query(models.Challenge)
    .filter(models.Challenge.completed == True, models.Challenge.user_id.is_(None))
    .count()
    )
    
    # Seed and pull fresh streaks for consistency with trajectory/sandbox
    _seed_streaks_from_history(db)
    streak_rows = db.query(models.Streak).filter(models.Streak.user_id.is_(None)).all()
    streak_avg = (
        sum(s.current_count or 0 for s in streak_rows) / len(streak_rows)
    ) if streak_rows else 0

    health = calculate_health_score(
        portfolio_obj,
        villain_events_count=villain_events_count,
        streak_avg=streak_avg,
        challenges_completed=challenges_completed
    )            

    wealth_age = calculate_wealth_age(total, 35, health["overall"])

    for a in assets:
        if a['name'] == 'Crypto' and a['pct'] > 30:
            a['mood'] = 'worried'
        elif a['pct'] > 0:
            a['mood'] = 'happy'
        else:
            a['mood'] = 'neutral'


    base_history = copy.deepcopy(MOCK_HISTORY_SEED)
    base_history[-1]["v"] = total  # anchor to live total

    # Try to build a 6‑month past+future trajectory; fall back gracefully if anything breaks.
    try:
        trajectory = await build_portfolio_trajectory(
            {"total": total, "assets": assets, "history": base_history, "health": health}
        )
        history = trajectory.get("points", base_history)
    except Exception as e:
        print("Trajectory engine error in /api/portfolio:", repr(e))
        history = base_history
    
    net_total = max(0, total - TOTAL_DEBT)

    return {
        "total": net_total,
        "gross_total": total,
        "debt": TOTAL_DEBT, 
        "assets": assets,
        "health": health,
        "wealth_age": wealth_age,
        "villain_event_active": villain_event_active,
        "history": history,
    }

class SandboxPortfolio(BaseModel):
    total: float
    assets: list
    history: list[dict] | None = None


class SpendThresholdRequest(BaseModel):
    max_savings_spend: float


@app.get("/api/settings/spend-threshold")
async def get_spend_threshold():
    """Return the current Savings overspend guardrail used for the villain arc."""
    return {"max_savings_spend": MAX_SAVINGS_SPEND}


@app.post("/api/settings/spend-threshold")
async def set_spend_threshold(req: SpendThresholdRequest):
    """Update the max amount the user is comfortable draining from Savings."""
    global MAX_SAVINGS_SPEND
    try:
        MAX_SAVINGS_SPEND = max(0.0, float(req.max_savings_spend))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid max_savings_spend")
    print(f"Updated MAX_SAVINGS_SPEND to {MAX_SAVINGS_SPEND}")
    return {"success": True, "max_savings_spend": MAX_SAVINGS_SPEND}

class DebtRequest(BaseModel):
    total_debt: float

@app.get("/api/settings/debt")
async def get_debt():
    return {"total_debt": TOTAL_DEBT}

@app.post("/api/settings/debt")
async def set_debt(req: DebtRequest):
    global TOTAL_DEBT
    TOTAL_DEBT = max(0.0, float(req.total_debt))
    return {"success": True, "total_debt": TOTAL_DEBT}

class ManualAssetCreate(BaseModel):
    category: str
    label: str
    amount: float


@app.post("/api/manual-assets/log")
async def log_manual_asset(entry: ManualAssetCreate, db: Session = Depends(get_db)):
    """
    Create a manual asset log entry (for Real Estate & Others, side hustles, collectibles, etc.).
    For hackathon/demo, we don't attach this to an authenticated user yet.
    """
    log = models.ManualAssetLog(
        user_id=None,
        category=entry.category,
        label=entry.label,
        amount=entry.amount,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {
        "id": log.id,
        "category": log.category,
        "label": log.label,
        "amount": float(log.amount or 0),
        "created_at": log.created_at.isoformat() if log.created_at else None,
    }


@app.get("/api/manual-assets/logs")
async def list_manual_assets(db: Session = Depends(get_db)):
    """
    Return recent manual asset entries, newest first.
    """
    rows = (
        db.query(models.ManualAssetLog)
        .order_by(models.ManualAssetLog.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": r.id,
            "category": r.category,
            "label": r.label,
            "amount": float(r.amount or 0),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


def _manual_asset_totals(db: Session) -> dict[str, float]:
    """
    Aggregate manual asset logs into per-category totals that can be merged
    into the main portfolio (Real Estate & Others, Stocks, Savings, Crypto, Bonds).
    """
    rows = (
        db.query(models.ManualAssetLog.category, sa_func.sum(models.ManualAssetLog.amount))
        .group_by(models.ManualAssetLog.category)
        .all()
    )
    totals: dict[str, float] = {}
    for cat, amt in rows:
        try:
            totals[str(cat)] = float(amt or 0.0)
        except (TypeError, ValueError):
            continue
    return totals


# ---- STREAKS ENGINE ---------------------------------------------------------

STREAK_CONFIG: dict[str, dict] = {
    "daily_savings":   {"name": "Daily Savings",      "emoji": "💰", "goal": 30},
    "investment":      {"name": "Investment Streak",  "emoji": "📈", "goal": 20},
    "positive_pnl":    {"name": "Positive P&L",       "emoji": "💵", "goal": 30},
    "learning":        {"name": "Learning Streak",    "emoji": "📚", "goal": 14},
}


def _ensure_default_streaks(db: Session) -> list[models.Streak]:
    """
    For hackathon/demo, we keep a single anonymous user's streaks.
    Ensure one row per configured streak_type exists.
    """
    existing = {
        s.streak_type: s
        for s in db.query(models.Streak).filter(models.Streak.user_id.is_(None)).all()
    }
    for t in STREAK_CONFIG.keys():
        if t not in existing:
            s = models.Streak(
                user_id=None,
                streak_type=t,
                current_count=0,
                best_count=0,
            )
            db.add(s)
            db.flush()
            existing[t] = s
    db.commit()
    return list(existing.values())

def _seed_streaks_from_history(db: Session):
    """
    Seed non-learning streak counts from HISTORY_SEEDED_STREAKS so they're
    consistent with the trajectory engine's mock data.
    Learning streak is derived from actual reflection logs instead.
    Only seeds rows that are still at 0 (first run / after reset).
    """
    from datetime import date, timedelta

    _ensure_default_streaks(db)
    db.expire_all()
    rows = db.query(models.Streak).filter(models.Streak.user_id.is_(None)).all()
    today = date.today()
    changed = False

    for s in rows:
        seed = HISTORY_SEEDED_STREAKS.get(s.streak_type)
        if seed is not None and (s.current_count or 0) == 0:
            s.current_count = seed
            s.best_count = max(s.best_count or 0, seed)
            # Set to yesterday so the next ping naturally increments
            s.last_updated = today - timedelta(days=1)
            db.add(s)
            changed = True

    if changed:
        db.commit()

@app.get("/api/streaks")
async def get_streaks(db: Session = Depends(get_db)):
    """
    Return the current streaks for the demo user, with labels/emoji/goals.
    """
    db.expire_all()
    _seed_streaks_from_history(db)
    rows = db.query(models.Streak).filter(models.Streak.user_id.is_(None)).all()
    result = []
    for s in rows:
        cfg = STREAK_CONFIG.get(s.streak_type, {"name": s.streak_type, "emoji": "🔥", "goal": 10})
        result.append(
            {
                "id": s.id,
                "type": s.streak_type,
                "name": cfg["name"],
                "emoji": cfg["emoji"],
                "goal": cfg["goal"],
                "current": s.current_count,
                "best": s.best_count,
                "lastUpdated": s.last_updated.isoformat() if s.last_updated else None,
            }
        )
    return result


class StreakPing(BaseModel):
    streak_type: str


@app.post("/api/streaks/ping")
async def ping_streak(req: StreakPing, db: Session = Depends(get_db)):
    """
    Mark today's action for a given streak_type.
    - If last_updated is today: keep current_count as-is (idempotent).
    - If last_updated is yesterday: increment.
    - Otherwise: reset to 1.
    """
    from datetime import date, timedelta

    rows = _ensure_default_streaks(db)
    streak_map = {s.streak_type: s for s in rows}
    s = streak_map.get(req.streak_type)
    if not s:
        raise HTTPException(status_code=404, detail="Unknown streak_type")

    today = date.today()
    if s.last_updated == today:
        # already counted today
        pass
    else:
        if s.last_updated == today - timedelta(days=1):
            s.current_count = (s.current_count or 0) + 1
        else:
            s.current_count = 1
        s.best_count = max(s.best_count or 0, s.current_count)
        s.last_updated = today

    db.add(s)
    db.commit()
    db.refresh(s)

    cfg = STREAK_CONFIG.get(s.streak_type, {"name": s.streak_type, "emoji": "🔥", "goal": 10})
    return {
        "id": s.id,
        "type": s.streak_type,
        "name": cfg["name"],
        "emoji": cfg["emoji"],
        "goal": cfg["goal"],
        "current": s.current_count,
        "best": s.best_count,
        "lastUpdated": s.last_updated.isoformat() if s.last_updated else None,
    }


def _manual_asset_holdings(db: Session, limit: int = 50) -> dict[str, list[dict]]:
    """
    Return per-category "holdings" derived from manual logs so the asset detail
    sheet can show what's inside Real Estate & Others (and any other category).
    """
    rows = (
        db.query(models.ManualAssetLog)
        .order_by(models.ManualAssetLog.created_at.desc())
        .limit(limit)
        .all()
    )
    by_cat: dict[str, list[dict]] = {}
    for r in rows:
        cat = str(getattr(r, "category", "") or "")
        if not cat:
            continue
        by_cat.setdefault(cat, []).append(
            {
                "ticker": "MAN",
                "name": str(getattr(r, "label", "") or "Manual asset"),
                "value": float(getattr(r, "amount", 0) or 0),
                "change": 0,
            }
        )
    return by_cat

def _get_supplemental_assets() -> list[dict]:
    """Optional non-Alpaca wealth (Real Estate, Crypto, Bonds). Set in .env or 0."""
    def _float_env(name: str, default: float = 0.0) -> float:
        try:
            return float(os.getenv(name, str(default)))
        except (TypeError, ValueError):
            return default

    return [
        {"name": "Real Estate & Others", "value": _float_env("SUPPLEMENTAL_REAL_ESTATE", 0), "pct": 0, "color": "#10b981", "emoji": "🏠", "mood": "neutral"},
        {"name": "Crypto",               "value": _float_env("SUPPLEMENTAL_CRYPTO", 0),      "pct": 0, "color": "#f59e0b", "emoji": "₿",  "mood": "neutral"},
        {"name": "Bonds",                "value": _float_env("SUPPLEMENTAL_BONDS", 0),       "pct": 0, "color": "#ec4899", "emoji": "📜", "mood": "neutral"},
    ]


def _apply_sabotage_to_assets(assets: list[dict]) -> list[dict]:
    """
    When sabotage mode is active, simulate a villain‑arc overspend:
    drain more from Savings than the user’s comfort limit.
    """
    global HACKATHON_SABOTAGE_MODE, MAX_SAVINGS_SPEND

    if not HACKATHON_SABOTAGE_MODE:
        return assets

    try:
        savings = next((a for a in assets if a.get("name") == "Savings"), None)
        if not savings:
            return assets

        current_val = float(savings.get("value", 0) or 0)
        if current_val <= 0 or MAX_SAVINGS_SPEND <= 0:
            return assets

        # Overspend slightly beyond the chosen guardrail, but never more than the balance.
        overspend_target = MAX_SAVINGS_SPEND * 1.1
        deduction = min(current_val, overspend_target)
        savings["value"] = max(0.0, current_val - deduction)

        return assets
    except Exception as e:
        print("Sabotage apply error:", repr(e))
        return assets


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

    async with httpx.AsyncClient(base_url=ALPACA_BASE_URL, headers=headers, timeout=10.0) as client:
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

            return SandboxPortfolio(total=total, assets=assets, history=portfolio_history)
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


# 1. ADD 'db: Session = Depends(get_db)' HERE 👇
@app.post("/api/villain/roast")
async def get_villain_data(req: VillainRoastRequest, db: Session = Depends(get_db)):
    global HACKATHON_SABOTAGE_MODE

    # FIX: Return early with empty alerts when sabotage is not active
    if not HACKATHON_SABOTAGE_MODE:
        return {"alerts": [], "caughtIn4K": [], "history": []}

    # 2. PASS 'db' INTO THIS FUNCTION CALL 👇
    portfolio_snapshot = await get_sandbox_portfolio(db)
    assets_for_ai = portfolio_snapshot.get("assets", [])
    dynamic_message, action_steps = await generate_villain_roast(assets_for_ai, req.riskLevel)

    # Alert banner only shows when villain/sabotage mode is active
    alerts = []
    if HACKATHON_SABOTAGE_MODE:
        alerts = [{
            "id": "crypto_overweight",
            "message": dynamic_message,
            "steps": action_steps,
            "severity": "high",
            "emoji": "🚨"
        }]

    return {
        "alerts": alerts,
        "message": dynamic_message,   # ← now always present
        "steps": action_steps,         # ← now always present
        "caughtIn4K": ["you've ordered food delivery 23 times this month. we see you bestie 👀"],
        "history": []
    }


class VillainAdvisorRequest(BaseModel):
    riskLevel: int = 5

_villain_cache: dict = {"data": None, "ts": 0}
_VILLAIN_TTL = 3600 
@app.post("/api/villain/advisor")
async def get_villain_advisor(req: VillainAdvisorRequest, db: Session = Depends(get_db)):
    """
    Always-on portfolio advisor. Unlike /api/villain/roast this does NOT depend
    on sabotage mode being active — it simply reads the current sandbox
    portfolio (mock + Alpaca + manual assets) and returns message + steps.
    """
    global _villain_cache
    if _villain_cache["data"] and (time.time() - _villain_cache["ts"]) < _VILLAIN_TTL:
        return _villain_cache["data"]
    
    snapshot = await get_sandbox_portfolio(db)
    assets_for_ai = snapshot.get("assets", [])
    dynamic_message, action_steps = await generate_villain_roast(assets_for_ai, req.riskLevel)
    result = {
        "message": dynamic_message,
        "steps": action_steps,
    }
    _villain_cache = {"data": result, "ts": time.time()}
    return result

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
async def get_sandbox_portfolio(db: Session = Depends(get_db)):
    """
    Try to build a portfolio from sandbox (Alpaca).
    If anything fails, fall back to the existing mock /api/portfolio logic.
    """
    sandbox = await fetch_alpaca_portfolio()
    if sandbox is None:
        print("Sandbox portfolio: using fallback (Alpaca not available)")
        # Fallback: reuse the existing logic from /api/portfolio
        return await get_portfolio(db) 
    
    # Start from rich mock portfolio so the user always sees a full range of
    # assets, then layer Alpaca sandbox values + manual assets on top.
    alpaca_assets = {a.get("name"): a for a in (sandbox.assets or [])}
    assets = copy.deepcopy(MOCK_ASSETS)

    # 1) Add Alpaca values (typically savings + stocks) on top of mock baseline,
    # and copy rich fields so the asset detail sheet can show live holdings/history.
    for a in assets:
        name = a.get("name")
        base_val = float(a.get("value", 0) or 0.0)
        src = alpaca_assets.get(name)
        if src:
            try:
                a["value"] = base_val + float(src.get("value", 0) or 0)
            except (TypeError, ValueError):
                pass

            # Holdings: include a baseline "Other" item so holdings sum matches value
            if src.get("holdings") is not None:
                holdings = list(src.get("holdings") or [])
                if base_val > 0:
                    holdings = (
                        [{"ticker": "DEMO", "name": "Other holdings", "value": round(base_val, 2), "change": 0}]
                        + holdings
                    )
                a["holdings"] = holdings

            # History: shift Alpaca history up by the baseline so the chart matches totals
            if src.get("history") is not None:
                hist = list(src.get("history") or [])
                if base_val > 0 and hist:
                    shifted = []
                    for p in hist:
                        try:
                            shifted.append({"m": p.get("m"), "v": float(p.get("v", 0) or 0) + base_val})
                        except Exception:
                            continue
                    a["history"] = shifted
                else:
                    a["history"] = hist

            # Copy any simple perf fields when present (best-effort)
            for k in ("day", "week", "month", "year"):
                if k in src and src.get(k) is not None:
                    a[k] = src.get(k)

    # 2) Add manual assets from settings (real estate, side hustles, etc.)
    manual_totals = _manual_asset_totals(db)
    manual_holdings = _manual_asset_holdings(db)
    for a in assets:
        nm = a.get("name")
        extra = manual_totals.get(nm)
        if extra:
            try:
                a["value"] += float(extra)
            except (TypeError, ValueError):
                pass
        mh = manual_holdings.get(nm)
        if mh:
            # If we already have holdings (e.g. from Alpaca), append; otherwise set.
            existing = a.get("holdings")
            if isinstance(existing, list) and existing:
                a["holdings"] = existing + mh
            else:
                a["holdings"] = mh

    # If sabotage mode is active, apply the same overspend damage here so the
    # dashboard blobs and detail views show the villain‑arc version too.
    assets = _apply_sabotage_to_assets(assets)

    total = sum(float(a.get("value", 0) or 0.0) for a in assets)

    # Recompute portfolio % allocations from the latest values
    if total > 0:
        for a in assets:
            try:
                a["pct"] = round((float(a.get("value", 0) or 0.0) / total) * 100)
            except Exception:
                a["pct"] = 0

    portfolio_obj = {"total": max(0, total-TOTAL_DEBT), "assets": assets, "gross_total":total, "debt":TOTAL_DEBT}
    
    # ── DB QUERY FOR REAL STATS ──
    # Anonymous demo user — all records have user_id=None
    villain_count = db.query(models.VillainArcEvent).filter(
        models.VillainArcEvent.user_id.is_(None)
    ).count()
    if HACKATHON_SABOTAGE_MODE:
        villain_count += 1

    challenges_done = db.query(models.Challenge).filter(
        models.Challenge.user_id.is_(None),
        models.Challenge.completed == True
    ).count()

    # Pass the actual DB counts into the engine!
    # Pull fresh streak data after seeding so health score is consistent
    _seed_streaks_from_history(db)
    streak_rows = db.query(models.Streak).filter(models.Streak.user_id.is_(None)).all()
    streak_avg = (
        sum(s.current_count or 0 for s in streak_rows) / len(streak_rows)
        ) if streak_rows else 0

    health = calculate_health_score(
        portfolio_obj,
        villain_events_count=villain_count,
        streak_avg=streak_avg,
        challenges_completed=challenges_done   # ← fixed param name to match engines.py
    )
    
    wealth_age = calculate_wealth_age(total, 35, health["overall"])

    # Ensure moods for blobs
    for a in assets:
        pct = a.get("pct", 0)
        # 1. Dominant Assets (Greater than 25% of portfolio)
        if pct > 30:
            a["mood"] = "happy"
        # 2. At-Risk or Neglected Assets (Less than 10% of portfolio)
        elif pct < 10:
            a["mood"] = "worried"
        # 3. Stable Middle-Class Assets
        else:
            a["mood"] = "neutral"

    # Prefer Alpaca-derived 6M history when present, else fall back to mock.
    # 1. Define the net total first     
    net_total = total - TOTAL_DEBT

    # 2. Use net_total for the mock history
    import copy as _copy
    _base_history = _copy.deepcopy(MOCK_HISTORY_SEED)
    _base_history[-1]["v"] = net_total  # anchor last point to live net worth
    history = sandbox.history or _base_history

    # 3. Ensure the last history point matches net worth
    if history:
        history = history[:-1] + [{"m": history[-1]["m"], "v": net_total}] # ✅ Changed

    # 4. Pass the net_total to the AI trajectory engine
    trajectory = await build_portfolio_trajectory(
        {"total": net_total, "assets": assets, "history": history, "health": health} # ✅ Changed
    )

    return {
        "total": net_total, # ✅ Changed
        "gross_total": total,
        "debt": TOTAL_DEBT,
        "assets": assets,
        "health": health,
        "wealth_age": wealth_age,
        "villain_event_active": False,
        "history": trajectory.get("points", history),
    }

class ReflectionCreate(BaseModel):
    txName: str
    amount: float
    emotion: str
    notes: str

@app.post("/api/reflections")
async def log_reflection(entry: ReflectionCreate, db: Session = Depends(get_db)):
    """Save a new reflection to the database"""
    from datetime import date, timedelta
    print("DEBUG reflection entry:", entry)
    # 1. Save reflection first, commit immediately
    log = models.VillainArcEvent(
        user_id=None,
        description=entry.txName,
        amount=entry.amount,
        emotion=entry.emotion,
        notes=entry.notes,
        event_date=date.today()
    )
    db.add(log)
    try:
        db.commit()
        db.refresh(log)
        print("DEBUG reflection saved, id:", log.id)  # ← confirm save
    except Exception as e:
        print("DEBUG reflection save FAILED:", repr(e))  # ← catch DB error
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save reflection: {repr(e)}")
    

    # 2. Only then handle learning streak in a separate clean operation
    if (entry.emotion or "").strip().lower() == "learning":
        try:
            _ensure_default_streaks(db)
            db.expire_all()
            
            s = db.query(models.Streak).filter(
                models.Streak.streak_type == "learning",
                models.Streak.user_id.is_(None)
            ).first()
            print("DEBUG streak row found:", s)
            if s:
                today = date.today()
                last = s.last_updated
                print("DEBUG today:", today, "last_updated:", last)  # ← what are the dates?
                print("DEBUG current_count before:", s.current_count)  # ← what's the count?
                if last == today:
                    print("DEBUG: already counted today, skipping")
                    pass  # already counted today
                elif last == today - timedelta(days=1):
                    s.current_count = (s.current_count or 0) + 1
                    print("DEBUG: incremented to", s.current_count)
                else:
                    s.current_count = 1
                    print("DEBUG: reset to 1")

                s.best_count = max(s.best_count or 0, s.current_count)
                s.last_updated = today
                db.add(s)
                db.commit()
                db.refresh(s)
                print("DEBUG streak saved, current_count:", s.current_count)  # ← confirm
        except Exception as e:
            print("DEBUG streak FAILED:", repr(e))
            print("Learning streak update error:", repr(e))
            db.rollback()

    return {"status": "success", "id": log.id}

@app.get("/api/reflections")
async def get_reflections(db: Session = Depends(get_db)):
    """Fetch all saved reflections"""
    rows = (
        db.query(models.VillainArcEvent)
        .order_by(models.VillainArcEvent.created_at.desc())
        .limit(50)
        .all()
    )
    print("DEBUG reflections count:", len(rows))  # ← add this
    for r in rows:
        print("DEBUG row:", r.id, r.description, r.emotion)  # ← add this
    # Format them so the frontend can read them easily
    return [
        {
            "id": r.id,
            "tx": r.description,
            "amount": float(r.amount or 0),
            "emotion": r.emotion,
            "notes": r.notes,
            "date": r.event_date.strftime("%b %d") if r.event_date else "Today"
        }
        for r in rows
    ]

class GoalCreate(BaseModel):
    title: str
    target_amount: float
    category: str
    emoji: str = "🎯"

@app.post("/api/goals")
async def create_goal(goal_in: GoalCreate, db: Session = Depends(get_db)):
    """Save a new financial goal to the database"""
    new_goal = models.Goal(
        title=goal_in.title,
        target_amount=goal_in.target_amount,
        category=goal_in.category,
        emoji=goal_in.emoji,
        current_amount=0.0
    )
    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)
    return new_goal

@app.get("/api/goals")
async def get_goals(db: Session = Depends(get_db)):
    """Fetch all saved goals"""
    return db.query(models.Goal).order_by(models.Goal.created_at.desc()).all()