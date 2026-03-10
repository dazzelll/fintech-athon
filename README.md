# 💸 Stack'd

### Project Description:
Investors, especially Gen Z, today struggle with three compounding problems: fragmented assets scattered across accounts and wallets, no standardised way to measure true financial health, and tools that only show the past rather than guiding the future.\
<br>
Stack'd is an integrated **Wealth Wellness Hub** that tackles all three head-on. The Wealth Wallet unifies all assets alongside liabilities into a single consolidated view, giving users a fully honest and real-time picture of their net worth. Every connected asset feeds directly into the Health Score Engine, which computes a dynamic, quantifiable financial wellness rating across Diversification, Liquidity, and Behavioral Resilience.\
<br>
Where existing tools stop at reporting, Stack'd drives action. The Trajectory Engine projects future wealth using live macroeconomic data, while the What-If Simulator lets users stress-test real-life scenarios before committing or to better prepare. When risk is detected, the Villain Arc Advisor delivers immediate, personalised, and data-driven corrective steps.\
<br>
Stack'd is built to change behavior, not just display it. Streaks, Challenges, and Reflections create a daily habit loop that pushes users from passive observation to intentional decision-making. Quarterly Wrapped holds users accountable to their growth over time. These features deliver the engagement-driven, actionable financial wellness platform that modern investors have been missing.\
<br>
(200 words)

---

## 🗂️ Project Structure

```
stackd/
├── backend/          # Python FastAPI server
│   ├── main.py       # All API routes, business logic, scheduler
│   ├── engines.py    # Scoring, trajectory, and AI engine
│   ├── models.py     # SQLAlchemy ORM models
│   ├── database.py   # DB session setup
│   └── requirements.txt
├── my-app/           # TypeScript / React Native (Expo) frontend
├── .env.example      # Environment variable template
└── README.md
```

---
## 🛠️ Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | TypeScript, React Native (Expo), CSS        |
| Backend    | Python, FastAPI, APScheduler                |
| Database   | SQLite via SQLAlchemy                       |
| AI         | Google Gemini 2.5 Flash                     |
| Payments   | Stripe Checkout (SGD)                       |
| Trading    | Alpaca Markets (paper trading)              |
| Macro Data | FRED API (Fed Funds, DGS10, CPI)            |
| Property   | URA Data Service (Singapore rental medians) |
| Crypto     | CoinGecko API                               |
| Stocks     | Alpha Vantage API                           |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` before running anything.

```bash
cp .env.example .env
```

### ❗ Required

| Variable                 | Description                        | Where to get it                                                            |
|--------------------------|------------------------------------|----------------------------------------------------------------------------|
| `STRIPE_SECRET_KEY`      | Stripe secret key (`sk_...`)       | [Stripe Dashboard](https://dashboard.stripe.com/) → Developers → API Keys |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_...`)  | Same as above                                                              |
| `GEMINI_API_KEY`         | Google Gemini API key              | [Google AI Studio](https://aistudio.google.com/app/apikey)                |
| `ALPACA_API_KEY_ID`      | Alpaca trading API key             | [Alpaca Markets](https://app.alpaca.markets/) → API Keys                  |
| `ALPACA_API_SECRET_KEY`  | Alpaca trading secret key          | Same as above                                                              |

### ✅ Optional (graceful fallbacks available)

| Variable               | Description                          | Where to get it                                                           |
|------------------------|--------------------------------------|---------------------------------------------------------------------------|
| `COINGECKO_API_KEY`    | Live crypto prices in SGD            | [CoinGecko](https://www.coingecko.com/en/api) — free tier available       |
| `ALPHAVANTAGE_API_KEY` | Live stock prices                    | [Alpha Vantage](https://www.alphavantage.co/support/#api-key) — free tier |
| `FRED_API_KEY`         | Macro data (Fed Funds, DGS10, CPI)   | [FRED API](https://fred.stlouisfed.org/docs/api/api_key.html) — free      |
| `URA_ACCESS_KEY`       | Singapore residential rental medians | [URA Data Service](https://www.ura.gov.sg/maps/api/)                      |

### ⚙️ Auto-configured

| Variable          | Default                                            |
|-------------------|----------------------------------------------------|
| `DATABASE_URL`    | `sqlite:///./fintech.db` (created automatically)   |
| `ALPACA_BASE_URL` | `https://paper-api.alpaca.markets` (paper trading) |

> ⚠️ Never commit your `.env` file. It is already in `.gitignore`.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Python](https://www.python.org/) v3.9+
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### 1. Clone

```bash
git clone https://github.com/dazzelll/stackd.git
cd stackd
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
# API at http://localhost:8000
```

### 3. Frontend

```bash
cd my-app
npm install
npm run dev
# App at http://localhost:3000
```

### 4. Android Virtual Device OR Web

Ensure [Android Studio](https://developer.android.com/studio) is installed with an emulator configured, then:\
Device: Android Verion 15 'Vanilla Ice Cream'
```bash
# Terminal 1
cd backend
uvicorn main:app --reload

# Terminal 2 (if AVD)
cd my-app
npx expo start
# Press 'a' to open on the Android emulator
# Terminal 2 (if Web)
cd my-app
npx expo start --web
```

> If the backend is unreachable on the emulator, replace `localhost` with `10.0.2.2` in API calls — Android maps this to your machine's localhost.

---


## ✨ Features

### 📊 Portfolio Dashboard

Merges three data sources into one live snapshot: a seeded 6-month mock history baseline, live Alpaca paper trading data (stocks + cash), and manually logged assets from the settings screen. The displayed total is always gross value minus user-defined debt. Each asset is mood-tagged — `happy` (>30%), `worried` (<10%), or `neutral`. Tracked classes: Stocks, Real Estate & Others, Savings, Crypto, Bonds.

### 🏥 Wealth Health Score

Calculated across four dimensions in `engines.py`:

- **Diversification (35%)** — Herfindahl-Hirschman Index penalises over-concentration in any single asset class.
- **Liquidity (30%)** — weighted by liquidation speed (Savings = 1.0, Stocks = 0.7, Crypto = 0.5, Bonds = 0.4, Real Estate = 0.05). Score peaks at a 0.5–0.7 weighted average; too liquid or too illiquid both get penalised.
- **Behavioural Resilience (25%)** — starts at 50. Penalised −10 per regret reflection (cap −50); boosted by streak average (+2/day), completed challenges (+5 each), and learning reflections (+5 each).
- **Crypto Penalty** — every % of crypto above 30% directly reduces the overall score.

**Formula:** `(diversification × 0.35) + (liquidity × 0.30) + (resilience × 0.25) + max(0, 10 − crypto_penalty)`

### 👴 Wealth Age

Maps total portfolio value to an age benchmark ($15k = 25, $1.3M = 60) then shifts it ±5 years based on health score. A high score makes your wealth "younger"; a low score ages it.

### 📈 Portfolio Trajectory Engine

A macro-aware forecasting engine (`build_portfolio_trajectory()` in `engines.py`) that projects 6 months forward:

1. Pulls live Fed Funds rate, DGS10 yield, and CPI from FRED, plus Singapore rental medians from URA — falls back to sensible hardcoded defaults if APIs are unconfigured.
2. Derives per-class monthly base returns from macro data (e.g. rising yields reduce stocks and crypto; rising URA trend boosts real estate).
3. Applies a crypto/stock lead-lag correlation and a small health-score alpha tilt (±0.05%/month).
4. Weights returns by portfolio allocation, projects 6 months forward with ±1.5% random monthly noise for realism. Returns past + future series and historical/projected annual growth rates.
5. Results cached 1 hour per portfolio total. A full Gemini-powered shock bias layer (`_compute_shock_biases_gemini`) is implemented but disabled by default to preserve API quota.

### 🤖 AI Financial Advisor

Sends the current portfolio to **Gemini 2.5 Flash** and returns a one-sentence snarky diagnosis of the biggest problem plus 2–3 concrete, number-specific action steps tailored to the user's risk tolerance (1–10). Available at `/api/villain/advisor` at all times. Results cached 1 hour.

### 🚨 Villain Arc / Sabotage Mode

A hidden easter egg triggered by long-pressing the Stack'd logo. When active, it drains 110% of the user's configured `MAX_SAVINGS_SPEND` guardrail from their Savings balance, adds a villain event penalty to Behavioural Resilience, and triggers the **Villain Roast** — an AI-generated alert banner with emergency recovery steps. The guardrail amount is user-configurable from the settings screen.

### 🔮 Scenario Simulator

The user types a free-text scenario (e.g. "I get fired and lose my $10k/month salary for 3 months"). Gemini extracts structured simulation parameters (timeframe, monthly contribution, income gap, burn rate), a deterministic compound growth loop runs (2% return for crisis scenarios, 8% otherwise), and Gemini generates a supportive Gen-Z prophecy with actionable advice. Returns a `softLifeScore` (projected wealth as % of $1M, capped at 100).

### 🌟 Oracle Prophecy / Manifestation Board

The user sets a risk tolerance (1–10) and describes their goals. Gemini returns a 3–4 sentence mystical prophecy — fortune cookie meets hype friend meets financial advisor — ending with one specific actionable command calibrated to their exact risk level.

### 💳 Stripe Portfolio Top-Up

A real Stripe Checkout flow (SGD $500). On payment confirmation, $500 is added to the global Savings balance for the demo session.

### 📝 Reflections Journal

Users log transactions with a `regret` or `learning` emotion tag and free-text notes. Regret entries penalise Behavioural Resilience (−10 each, cap −50). Learning entries boost it (+5 each, cap +25) and auto-increment the Learning Streak — idempotently once per day.

### 🔥 Streaks

Four daily streaks: 💰 Daily Savings (goal: 30 days), 📈 Investment (goal: 20 days), 💵 Positive P&L (goal: 30 days), 📚 Learning (goal: 14 days). The first three are seeded from the mock 6-month history on first run; Learning is driven exclusively by real reflection logs. All streaks are idempotent per day.

### 🎯 Goals & 🏆 Challenges

Users create financial goals (title, target amount, category, emoji) and claim completed challenges (e.g. "No-spend week"). Each unique challenge claim contributes +5 to Behavioural Resilience (cap +25). Both are persisted to SQLite.

### ⚙️ Settings

Manual asset logging lets users add wealth outside Alpaca (real estate, side hustles, collectibles) which is merged into the main portfolio automatically. Users can also set total debt (deducted from all net worth figures) and configure the `MAX_SAVINGS_SPEND` guardrail for the villain arc.

### 📡 Live Prices & API Health

Crypto prices (BTC, ETH, SOL in SGD) fetched from CoinGecko, cached 5 minutes. Stock prices (AAPL, MSFT, TSLA) from Alpha Vantage with rate-limit-safe delays between requests. Both fall back to hardcoded values gracefully. Health-check endpoints at `/api/alpaca/status`, `/api/coingecko/status`, and `/api/gemini/status`.

---

## 👤 Authors

**Dazzel** — [github.com/dazzelll](https://github.com/dazzelll)
<br>
**Zhi Ling** - [github.com/zhilingggg](https://github.com/zhilingggg)
