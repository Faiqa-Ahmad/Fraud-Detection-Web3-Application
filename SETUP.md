# Sentinel3 local setup

## What you need

You do **not** need to download Ethereum or run a blockchain node. Sentinel3 reads live blockchain data through Alchemy's hosted RPC/API. It returns an explicit error if a live dependency is unavailable and never substitutes generated data.

Install:

1. Node.js 20 LTS or newer
2. Python 3.10 or newer (needed only for the AI microservice)
3. MetaMask browser extension (optional, for the Connect Wallet demonstration)

Create free cloud accounts when enabling live data:

- Alchemy: blockchain RPC and wallet data
- PostgreSQL: scan history, transactions, scores, and watchlists

## Run the production stack

Install Docker Desktop, copy `.env.example` to `.env`, add an Alchemy API key and a strong PostgreSQL password, then run:

```powershell
docker compose up --build
```

This starts PostgreSQL 16, the Python AI service, and Next.js. Database data persists in the `postgres_data` Docker volume.

## Run services manually

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Live scans require Alchemy, PostgreSQL, and the Python AI service.

Copy `frontend/.env.example` to `frontend/.env.local` and provide the server-side keys. Never commit `.env.local`.

```powershell
cd ai-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

When running PostgreSQL outside Docker, run `supabase-schema.sql` against the database before scanning.

## How blockchain is used

The browser wallet handles user consent and signing. The Next.js server uses an Alchemy RPC connection to query public EVM-chain data. No private key is sent to this application. The Python service converts normalized transaction history into behavioral features and calculates an anomaly score. PostgreSQL stores scans, transactions, scores, and watchlists; it is not the blockchain itself.
