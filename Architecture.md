# Web3 Fraud Detection — AI-Powered EVM Wallet Scanner

An AI-powered fraud detection platform for EVM wallets. Enter any wallet address, fetch real on-chain transaction data, run machine learning anomaly detection, and get a fraud risk score with detailed behavioral analysis.

---

## Supported Chains

| Chain     | Native Currency | Block Explorer          |
| --------- | --------------- | ----------------------- |
| Ethereum  | ETH             | etherscan.io            |
| Polygon   | MATIC           | polygonscan.com         |
| Arbitrum  | ETH             | arbiscan.io             |
| Optimism  | ETH             | optimistic.etherscan.io |
| BNB Chain | BNB             | bscscan.com             |

---

## Tech Stack

| Layer           | Technology                                       |
| --------------- | ------------------------------------------------ |
| Frontend        | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Charts          | Recharts                                         |
| Blockchain Data | Alchemy SDK                                      |
| Database        | Supabase (PostgreSQL)                            |
| AI Engine       | Python, FastAPI, scikit-learn                    |
| ML Model        | Isolation Forest                                 |

---

## Project Structure

```
web3-fraud-detection/
├── frontend/                        # Next.js 14 application
│   ├── app/
│   │   ├── page.tsx                 # Main dashboard page
│   │   ├── layout.tsx               # Root layout
│   │   ├── globals.css              # Global styles
│   │   ├── api/
│   │   │   └── analyze-wallet/
│   │   │       └── route.ts         # POST /api/analyze-wallet
│   │   └── components/
│   │       ├── WalletScanner.tsx    # Address input + chain selector
│   │       ├── RiskScoreCard.tsx    # Risk score gauge + metrics
│   │       ├── TransactionTable.tsx # Paginated transaction history
│   │       └── Charts.tsx           # Recharts analytics panels
│   └── lib/
│       ├── alchemy.ts               # Alchemy SDK — fetch txs + balance
│       ├── supabase.ts              # Supabase read/write helpers
│       └── types.ts                 # TypeScript types + chain configs
├── ai-service/                      # Python FastAPI microservice
│   ├── main.py                      # FastAPI server + /analyze endpoint
│   ├── model.py                     # Isolation Forest + risk scoring
│   ├── features.py                  # Feature extraction from tx data
│   └── requirements.txt             # Python dependencies
└── supabase-schema.sql              # Database schema + indexes
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- [Alchemy](https://www.alchemy.com) account — free tier works
- [Supabase](https://supabase.com) project — free tier works

---

### Step 1 — Database Setup

1. Go to your Supabase project → **SQL Editor**
2. Paste the entire contents of `supabase-schema.sql` and click **Run**
3. This creates 3 tables: `wallets`, `transactions`, `fraud_scores`

---

### Step 2 — Environment Variables

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
PYTHON_AI_SERVICE_URL=http://localhost:8000
```

---

### Step 3 — Start the AI Service

```bash
cd ai-service
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Verify it's running:

```bash
curl http://localhost:8000/health
# {"status":"ok","model":"IsolationForest","version":"1.0.0"}
```

> First run trains and saves the Isolation Forest model (`isolation_forest.pkl` + `scaler.pkl`). Subsequent starts load from cache and are instant.

---

### Step 4 — Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### Step 5 — Scan a Wallet

1. Select a chain from the dropdown
2. Paste any EVM wallet address (`0x...`)
3. Click **Scan Wallet**
4. Wait 10–30 seconds for data fetch + AI analysis
5. View risk score, balance, behavioral metrics, charts, and transaction history

---

## How It Works — Request Flow

```
Browser
  └── POST /api/analyze-wallet  { wallet_address, chain }
        ├── Alchemy API          fetch up to 1000 real transactions + wallet balance
        ├── Supabase             store transactions + dedup by tx_hash
        ├── Python /analyze      feature extraction → Isolation Forest → risk score
        └── Supabase             store fraud score + features
              └── Response       risk score, transactions, features → Dashboard
```

---

## How Risk Assessment Works

### Step 1 — Fetch Real Blockchain Data

The system fetches up to **1000 real transactions** per wallet from Alchemy — both outgoing and incoming — across the selected chain. No mock or dummy data is used.

### Step 2 — Feature Extraction

18 behavioral features are extracted from the raw transaction list:

| Feature                      | Description                                          |
| ---------------------------- | ---------------------------------------------------- |
| `transaction_count`          | Total number of transactions                         |
| `transaction_frequency`      | Transactions per day                                 |
| `avg_transfer_value`         | Average native value per transaction                 |
| `max_transfer_value`         | Largest single transfer                              |
| `min_transfer_value`         | Smallest single transfer                             |
| `unique_wallet_interactions` | Number of distinct addresses interacted with         |
| `contract_interaction_ratio` | Percentage of transactions that are contract calls   |
| `token_transfer_count`       | Total ERC20/ERC721/ERC1155 transfers                 |
| `gas_spike_count`            | Transactions with gas > mean + 3 standard deviations |
| `avg_gas`                    | Average gas limit across all transactions            |
| `max_gas`                    | Peak gas in any single transaction                   |
| `active_days`                | Days between first and last transaction              |
| `outgoing_count`             | Transactions sent from the wallet                    |
| `incoming_count`             | Transactions received by the wallet                  |
| `self_transfer_count`        | Transactions where sender == receiver                |
| `unique_tokens`              | Number of distinct token contracts used              |
| `time_between_tx_avg`        | Average seconds between consecutive transactions     |
| `time_between_tx_std`        | Standard deviation of time between transactions      |

### Step 3 — Isolation Forest ML Model

The model is trained on 5000 synthetic wallets (90% normal behavior, 10% anomalous behavior) and uses scikit-learn's `IsolationForest` with:

- `n_estimators`: 200 trees
- `contamination`: 0.1 (10% expected anomaly rate)
- `StandardScaler` normalization before scoring

The model outputs a raw **anomaly score** (range approximately `-0.5` to `0`). More negative = more anomalous = higher fraud risk.

This score is normalized to a **0–100 base risk score**.

### Step 4 — Heuristic Boosters

On top of the ML score, rule-based boosters are applied for known fraud patterns:

| Fraud Pattern                                    | Risk Boost | Risk Factor Label                                 |
| ------------------------------------------------ | ---------- | ------------------------------------------------- |
| Transaction frequency > 100/day                  | +15        | Extremely high transaction frequency              |
| 50+ transactions to fewer than 3 unique wallets  | +20        | Concentrated wallet interactions                  |
| 95%+ contract calls with zero incoming transfers | +10        | All activity is contract calls with zero incoming |
| 20+ self-transfers                               | +10        | Suspicious self-transfer count                    |
| 10+ gas spikes                                   | +8         | Repeated gas spikes detected                      |
| Average transfer value > 50 ETH                  | +12        | Abnormally large average transfer value           |
| 100+ transactions in ≤ 2 days                    | +15        | Burst pattern — high activity in very few days    |
| Average time between transactions < 10 seconds   | +12        | Automated/bot behavior                            |

**Final score** = `min(100, ML_base_score + boosters)`

### Step 5 — Risk Level Classification

| Score Range | Risk Level | Meaning                                   |
| ----------- | ---------- | ----------------------------------------- |
| 0 – 24      | LOW        | Normal wallet behavior                    |
| 25 – 49     | MEDIUM     | Some unusual patterns detected            |
| 50 – 74     | HIGH       | Significant anomalies, review recommended |
| 75 – 100    | CRITICAL   | Strong fraud indicators detected          |

### Model Confidence

Confidence is based on the amount of transaction data available:

| Transactions Available | Confidence |
| ---------------------- | ---------- |
| 0                      | 0%         |
| 1 – 9                  | 30%        |
| 10 – 49                | 60%        |
| 50 – 199               | 80%        |
| 200+                   | 95%        |

---

## Dashboard Features

### Risk Score Card

- SVG gauge showing 0–100 risk score with color coding
- Real-time wallet balance (ETH/MATIC/BNB depending on chain)
- Behavioral metrics grid
- Detected risk factors list
- Raw anomaly score from Isolation Forest
- Clickable wallet address → block explorer

### Transaction History

- Paginated table (25 per page) with filter by type: All / Contract / Token / Native
- Clickable tx hash → block explorer transaction page
- Clickable From/To addresses → block explorer address page
- Correct explorer per chain (Etherscan, Polygonscan, Arbiscan, etc.)

### Analytics Charts

- **Transaction Frequency** — daily activity over last 60 days (area chart)
- **Value Distribution** — ETH/token value bucketed histogram (bar chart)
- **Transaction Type Breakdown** — Contract / Token / Native split (pie chart)
- **Gas Usage** — gas across last 100 transactions (area chart)

---

## Database Schema

### `wallets`

| Column     | Type        | Description                |
| ---------- | ----------- | -------------------------- |
| id         | uuid        | Primary key                |
| address    | text        | Wallet address (lowercase) |
| risk_score | numeric     | Latest risk score (0–100)  |
| created_at | timestamptz | First scan time            |
| updated_at | timestamptz | Last scan time             |

### `transactions`

| Column                  | Type    | Description               |
| ----------------------- | ------- | ------------------------- |
| id                      | uuid    | Primary key               |
| wallet_address          | text    | Scanned wallet            |
| tx_hash                 | text    | Transaction hash (unique) |
| from_address            | text    | Sender address            |
| to_address              | text    | Receiver address          |
| value                   | text    | Raw value string          |
| value_eth               | numeric | Value in native currency  |
| gas                     | integer | Gas limit                 |
| gas_price               | text    | Gas price in wei          |
| timestamp               | bigint  | Unix timestamp            |
| block_number            | bigint  | Block number              |
| is_contract_interaction | boolean | True if contract call     |
| token_symbol            | text    | ERC20/721 token symbol    |
| token_value             | text    | Token transfer amount     |
| chain                   | text    | Chain ID                  |

### `fraud_scores`

| Column        | Type        | Description                    |
| ------------- | ----------- | ------------------------------ |
| id            | uuid        | Primary key                    |
| wallet        | text        | Wallet address                 |
| risk_score    | numeric     | 0–100 risk score               |
| anomaly_score | numeric     | Raw Isolation Forest score     |
| risk_level    | text        | LOW / MEDIUM / HIGH / CRITICAL |
| risk_factors  | text[]      | List of detected risk factors  |
| confidence    | numeric     | Model confidence 0–1           |
| features      | jsonb       | All 18 extracted features      |
| chain         | text        | Chain ID                       |
| analyzed_at   | timestamptz | Analysis timestamp             |

---

## API Reference

### `POST /api/analyze-wallet`

**Request:**

```json
{
  "wallet_address": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045",
  "chain": "ethereum"
}
```

**Supported chains:** `ethereum`, `polygon`, `arbitrum`, `optimism`, `bnb`

**Response:**

```json
{
  "wallet_address": "0x...",
  "chain": "ethereum",
  "wallet_balance": 1.234567,
  "tx_count": 842,
  "fraud_score": {
    "risk_score": 23.5,
    "anomaly_score": -0.123456,
    "risk_level": "LOW",
    "risk_factors": ["No significant anomalies detected"],
    "confidence": 0.95
  },
  "features": { ... },
  "transactions": [ ... ],
  "analyzed_at": "2026-03-14T10:00:00.000Z"
}
```

**Rate limit:** 10 requests per minute per IP

---

### `POST /analyze` (Python AI Service)

**Request:**

```json
{
  "wallet_address": "0x...",
  "transactions": [
    {
      "tx_hash": "0x...",
      "from_address": "0x...",
      "to_address": "0x...",
      "value_eth": 0.5,
      "gas": 21000,
      "timestamp": 1700000000,
      "is_contract_interaction": false,
      "token_symbol": null,
      "token_value": null
    }
  ]
}
```

**Response:**

```json
{
  "wallet_address": "0x...",
  "fraud_score": {
    "risk_score": 23.5,
    "anomaly_score": -0.123456,
    "risk_level": "LOW",
    "risk_factors": ["No significant anomalies detected"],
    "confidence": 0.95
  },
  "features": { ... },
  "analyzed_at": 1700000000.0
}
```

**Rate limit:** 30 requests per minute per IP

---

## Ports

| Service           | Port |
| ----------------- | ---- |
| Next.js frontend  | 3000 |
| Python AI service | 8000 |

---

## Troubleshooting

| Error                            | Fix                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `AI service unavailable`         | Make sure `python main.py` is running in `ai-service/`                                                              |
| `Blockchain data fetch failed`   | Check `NEXT_PUBLIC_ALCHEMY_API_KEY` is valid and has access to the selected chain                                   |
| Supabase numeric overflow        | Already handled — large token values are clamped automatically                                                      |
| `Invalid EVM address`            | Address must be `0x` followed by exactly 40 hex characters                                                          |
| Empty result (0 transactions)    | Wallet has no on-chain activity on the selected chain                                                               |
| `zsh: command not found: python` | Use `python3` on macOS. Install via `brew install python3`                                                          |
| `zsh: command not found: brew`   | Install Homebrew: `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` |
