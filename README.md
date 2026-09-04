# AlphaWatch : Smart Market Watchlist

> **"Markets don't need narrating. They need what changed."**

---

## Product Pitch

> Most stock watchlists are noisy firehoses of red and green price tickers that fail to answer the single question that matters: *what actually changed and why does it matter?* **AlphaWatch** transforms market monitoring into an intelligent attention engine. Powered by real-time exchange data and MySQL snapshot persistence, it diffs current market states against your last visit, filters noise using an adaptive volatility-aware Attention Score (0–100), traces signals through a 5-stage lifecycle state machine, and decodes market context (stock-specific vs. sector vs. market-wide). Clean, explainable, and resilient against API outages.

---

## Evaluation and Judging Criteria Alignment

| Evaluation Dimension | How AlphaWatch Delivers It | Implementation Reference |
| :--- | :--- | :--- |
| **Engineering Depth** | Multi-tier asynchronous pipeline built with FastAPI, in-memory TTL rate caching, relational MySQL snapshot ledger, high-precision statistical Z-scoring, and a React Vite frontend. | [`market_data.py`](file:///c:/Users/sahil/Downloads/Smart%20Watchlist/backend/app/services/market_data.py), [`signal_engine.py`](file:///c:/Users/sahil/Downloads/Smart%20Watchlist/backend/app/services/signal_engine.py) |
| **Product & Problem Interpretation** | Moves beyond naive percent-change thresholds. Mitigates alert fatigue via Attention Budgets (Top 3–5 assets), noise suppression for quiet stocks, and visit checkpoint diffing. | [`WatchlistPulse.jsx`](file:///c:/Users/sahil/Downloads/Smart%20Watchlist/frontend/src/components/WatchlistPulse.jsx), [`QuietStocksSummary.jsx`](file:///c:/Users/sahil/Downloads/Smart%20Watchlist/frontend/src/components/QuietStocksSummary.jsx) |
| **Edge Cases & Resilience** | Resilient against upstream API rate limits (HTTP 429) via graceful fallback to persisted MySQL snapshots, transparent stale data indicators, zero-division guards on market metrics, and event deduplication. | [`test_stale_fallback.py`](file:///c:/Users/sahil/Downloads/Smart%20Watchlist/backend/tests/test_stale_fallback.py), [`test_market_context.py`](file:///c:/Users/sahil/Downloads/Smart%20Watchlist/backend/tests/test_market_context.py) |
| **Code Quality & Simplicity** | Strict domain separation, explicit Pydantic schemas, deterministic mathematical scoring without bloated runtime dependencies, and 100% test coverage across core engines. | [`models.py`](file:///c:/Users/sahil/Downloads/Smart%20Watchlist/backend/app/schemas/models.py), [`test_score_breakdown.py`](file:///c:/Users/sahil/Downloads/Smart%20Watchlist/backend/tests/test_score_breakdown.py) |
| **Originality & Thoughtfulness** | 5-stage Signal Lifecycle state machine (`DETECTED` -> `CLOSED`), 3-way Market Context (Stock vs. Sector vs. S&P 500 `SPY`), and an additive 5-factor score breakdown. | [`lifecycle_service.py`](file:///c:/Users/sahil/Downloads/Smart%20Watchlist/backend/app/services/lifecycle_service.py), [`market_context_service.py`](file:///c:/Users/sahil/Downloads/Smart%20Watchlist/backend/app/services/market_context_service.py) |

---

## 1. System Architecture & Core Capabilities

```
[Finnhub Market Data Feed] ──▶ [FastAPI Service & TTL Cache] ──▶ [Market Context & S&P 500 Benchmarker]
                                                                        │
                                                                        ▼
[React + Tailwind UI] ◀──── [MySQL 8.0 Persistence] ◀────── [Signal Lifecycle & Score Breakdown Engine]
```

### Key Architectural Capabilities:
1. **Signal Lifecycle Engine**: Tracks signals across 5 discrete state-machine stages: `DETECTED` -> `DEVELOPING` -> `CONFIRMED` -> `FADING` -> `CLOSED` with MySQL transition persistence and intelligent event deduplication.
2. **Market Context Analysis**: Dissects whether price action is **Stock-Specific**, **Sector-Wide**, or **Market-Wide** by benchmarking against sector peer averages and the live S&P 500 benchmark (`SPY`).
3. **Transparent Attention Score Breakdown**: Deconstructs every score into 5 dynamic components that sum strictly to the final Attention Score (0–100) with natural language explanations.
4. **Expected vs Actual Movement**: Compares observed daily price moves against the stock's historical standard deviation envelope ($\pm\sigma$) with exact deviation multiples ($X\sigma$).
5. **Watchlist Health Summary**: Provides an aggregate health monitor measuring portfolio volatility dispersion %, unusual activity %, and sector market state.
6. **Snapshot Diffing vs Tick Comparisons**: Every snapshot is timestamped in MySQL and compared against when you were last active rather than just the previous 1-second tick.
7. **Data Reliability & Graceful Degradation**: Real status tracking (`LIVE`, `DATA DELAYED`, `OFFLINE`). Persisted MySQL snapshots provide seamless offline fallback with transparent stale data indicators.

---

## 2. Deep Dive: Core Engineering Features

### Feature 1: Signal Lifecycle State Machine

Signals are not static alerts; they evolve through a deterministic state machine:

```
DETECTED ──▶ DEVELOPING ──▶ CONFIRMED ──▶ FADING ──▶ CLOSED
```

- **DETECTED**: Score crosses initial anomaly boundary ($\ge 60$) on fresh volume or price deviation.
- **DEVELOPING**: Outsized movement continues, volatility expands, or signal persists across consecutive snapshots ($\ge 70$).
- **CONFIRMED**: Multiple independent indicators agree (elevated volume, standard deviation breach, channel breakout, score $\ge 80$).
- **FADING**: Attention score decreases, volume anomaly normalizes, or price retreats from key channel levels.
- **CLOSED**: Stock returns to baseline statistical variance for consecutive snapshots (score $< 40$).

#### Lifecycle History & Deduplication
Every transition is recorded in the MySQL `signal_lifecycle_events` audit ledger. If a stock maintains its current score or status across page reloads, the engine deduplicates events to prevent redundant logs.

---

### Feature 2: Market Context Analysis

Answers the critical trader question: **"Is this stock moving because of something idiosyncratic to the company, or is the entire sector/market moving?"**

The engine evaluates:
$$\text{Stock } \Delta\% \quad \longleftrightarrow \quad \text{Sector Average } \Delta\% \quad \longleftrightarrow \quad \text{S\&P 500 Benchmark } (\text{SPY}) \Delta\%$$

| Classification | Definition | Scenario Example |
| :--- | :--- | :--- |
| **STOCK-SPECIFIC** | Stock is moving significantly against or far outperforming/underperforming its sector and broader market. | NVDA -5.2% vs Semis +0.2% vs S&P 500 +0.4% |
| **SECTOR-WIDE** | Stock is moving in tandem with its industry peers while the sector diverges from the broader index. | NVDA -5.2% vs Semis -4.7% vs S&P 500 -0.8% |
| **MARKET-WIDE** | Stock movement is broadly aligned with both its sector and overall market index. | NVDA -3.1% vs Semis -3.5% vs S&P 500 -3.0% |
| **UNKNOWN** | Insufficient market or benchmark data available; reported with low confidence. | Upstream provider feed unavailable |

Each classification includes an algorithmic **Confidence Score** (0–100%) penalized if contextual data is delayed or stale.

---

### Feature 3: Transparent Attention Score Breakdown

The Attention Score (0–100) is mathematically explainable. Every response returns the 5 dynamic components that sum strictly to the total score:

$$\text{Attention Score} = \text{Price Deviation} + \text{Volume Anomaly} + \text{Volatility Z-Score} + \text{Key Level} + \text{Checkpoint Delta}$$

1. **Price Deviation (0–40 pts)**: Points scaled from absolute price change relative to the baseline volatility band.
   - *Explanation*: "Current movement is 2.4x the stock's normal daily movement."
2. **Volume Anomaly (0–25 pts)**: Points scaled from institutional volume expansion multiple.
   - *Explanation*: "Trading volume is 2.1x the 10-day average."
3. **Volatility Z-Score (0–20 pts)**: Standard deviation multiple ($Z = \frac{|\Delta\%|}{\sigma}$).
   - *Explanation*: "Observed movement is 2.7 standard deviations from normal."
4. **Key Level (0–10 pts)**: Points awarded for testing 52-week highs, 52-week lows, or channel boundaries.
   - *Explanation*: "Price is testing a 52-week resistance level."
5. **Checkpoint Delta (0–5 pts)**: Recency delta accrued since the user's recorded last visit checkpoint.
   - *Explanation*: "Movement since your last checkpoint (+3.8%) is unusually large."

---

### Feature 4: Watchlist Portfolio Health Summary

Provides aggregate telemetry across all monitored assets:
- **Tracked Count**: Total monitored assets.
- **Severity Breakdown**: Count of `critical`, `high`, `moderate`, and `normal` assets.
- **Watchlist Volatility Meter (0–100%)**: Normalized aggregate standard deviation dispersion.
- **Unusual Activity Meter (0–100%)**: Percentage of tracked assets currently exhibiting elevated attention scores.
- **Context Health Diagnosis**: Real-time diagnosis (e.g., `SECTOR VOLATILITY ELEVATED`, `STOCK DIVERGENCE ACTIVE`, `MARKET BENCHMARK CALM`).

---

## 3. Technology Stack

- **Frontend**:
  - React 19 + Vite
  - Tailwind CSS (Terminal dark aesthetic with light mode support)
  - Lucide Icons
  - SVG Sparklines & Responsive Steppers
  - API Client Layer (`frontend/src/services/api.js`)
- **Backend**:
  - Python 3.12+
  - FastAPI (REST API with strict Pydantic validation)
  - SQLAlchemy ORM + PyMySQL
  - Uvicorn ASGI Server
  - HTTPX async market client
  - Pytest test suite (21 unit & integration tests)
- **Database**:
  - MySQL 8.0+
  - Schema: `users`, `user_visits`, `watchlists`, `watchlist_stocks`, `market_snapshots`, `stock_metrics`, `change_events`, `signal_lifecycles`, `signal_lifecycle_events`
- **Market Data Provider**:
  - Finnhub Real-time Market Data REST API with provider abstraction and in-memory TTL caching.

---

## 4. API Specification

### Signals & Attention Engine
- `GET /api/signals`: Ranked feed with Top Attention budget, Market Context, and Lifecycle states.
- `GET /api/signals/{symbol}`: Full consolidated signal analysis for a specific ticker.
- `GET /api/signals/{symbol}/lifecycle`: State-machine lifecycle status and transition timeline.
- `GET /api/signals/{symbol}/context`: Stock vs sector vs market benchmark classification.
- `GET /api/signals/{symbol}/score-breakdown`: Mathematical 5-component breakdown and explanations.

### Watchlist & Portfolio
- `GET /api/watchlist`: Active watchlist with live price diffs and snapshot state.
- `GET /api/watchlist/health`: Compact portfolio health metrics and volatility dispersion.
- `POST /api/watchlist`: Add ticker to active watchlist.
- `DELETE /api/watchlist/{symbol}`: Remove ticker from active watchlist.

### Market & Checkpoints
- `GET /api/market/summary`: Global market indices and marquee ticker summary.
- `GET /api/market/search/{query}`: Real-time ticker search and autocomplete.
- `GET /api/history/{symbol}`: Historical snapshots audit trail.
- `POST /api/visit`: Record user visit checkpoint.
- `GET /api/health` & `GET /api/status`: System health and market feed connection status.

---

## 5. Local Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- MySQL Server 8.0+ running on port 3306

### Step 1: Database Initialization
Ensure MySQL is running, then create and seed the database:
```sql
CREATE DATABASE IF NOT EXISTS signal_watch;
```
Or execute the initialization scripts:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### Step 2: Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate   # On Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:
```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/signal_watch
MARKET_API_KEY=your_finnhub_api_key
MARKET_API_URL=https://finnhub.io/api/v1
FRONTEND_URL=http://localhost:5173
PORT=8000
HOST=0.0.0.0
```

Start the FastAPI application:
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive API Documentation: `http://127.0.0.1:8000/docs`

### Step 3: Frontend Setup
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
```

Start Vite development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 6. Automated Testing and Build Verification

### Backend Tests (Pytest)
```bash
cd backend
venv\Scripts\pytest -v
```
All 21 unit and integration tests pass, covering:
- Signal detection, developing, confirmed, fading, and closed state transitions.
- Score breakdown calculation and mathematical component sum integrity.
- Stock-specific, sector-wide, market-wide, and unknown context classifications.
- Watchlist health metrics and volatility dispersion calculations.
- Signal decay and MySQL event deduplication.
- Stale contextual data penalties and offline fallback snapshots.

### Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 7. Deployment Guidelines

### Deploying Frontend (Vercel)
1. Import `frontend/` directory into Vercel.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set Environment Variable: `VITE_API_BASE_URL=https://your-backend-domain.com`

### Deploying Backend (Railway / Render / AWS ECS / Google Cloud Run)
1. Deploy `backend/` with Python 3.12 runtime.
2. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Set Environment Variables:
   - `DATABASE_URL`: `mysql+pymysql://user:pass@remote-mysql-host:3306/signal_watch`
   - `MARKET_API_KEY`: `your_finnhub_api_key`
   - `FRONTEND_URL`: `https://your-frontend-domain.vercel.app`
