# Sentinel3

Sentinel3 is a real-data Web3 security dashboard for EVM wallets and contracts. It combines Alchemy blockchain data, CoinGecko pricing, an Isolation Forest risk model, PostgreSQL persistence, and an EIP-1193 browser wallet connection.

## Features

- Multi-chain analysis for Ethereum, Polygon, Arbitrum, Optimism, and BNB Chain
- Native and ERC-20 balances with available USD pricing
- Incoming and outgoing transaction analysis with AI risk scoring
- Contract bytecode detection
- NFT ownership and metadata
- ERC-20 allowance discovery and wallet-signed revocation
- Wallet-signature authentication with one-time nonces and HTTP-only sessions
- Per-account private PostgreSQL watchlists and shared scan history
- Docker-based local production stack
- API rate limiting, security headers, and an unprivileged frontend container

## Start the application

Create a root `.env` containing `ALCHEMY_API_KEY` and `POSTGRES_PASSWORD`. A single multi-network Alchemy key can be used when it has access to every selected network. Otherwise set `ALCHEMY_ETHEREUM_API_KEY`, `ALCHEMY_POLYGON_API_KEY`, `ALCHEMY_ARBITRUM_API_KEY`, `ALCHEMY_OPTIMISM_API_KEY`, and `ALCHEMY_BNB_API_KEY` individually. The live status indicator shows which configured networks are actually reachable. Then run:

```powershell
docker compose up -d --build
```

Open `http://localhost:3000`.

Use `docker compose ps` to check service health and `docker compose down` to stop the stack. Database records remain in the Docker volume.

## How to use it

1. Open **Scanner**, enter any public EVM address, choose its network, and run the analysis.
2. Open **Portfolio** to see live native/ERC-20 balances and available USD values.
3. Open **NFTs** to inspect owned collectibles and their explorer pages.
4. Open **Contracts** to check whether an address contains deployed bytecode.
5. Open **Approvals** to find active ERC-20 allowances. Connect the same wallet, review the spender, and click **Revoke** only when you intend to submit an on-chain transaction.
6. Click **Sign in with wallet** and approve the free message signature. Then use **Watchlist** to privately label addresses for later review.
7. Use **Scan history** to review AI assessments saved in PostgreSQL and reopen an address.

Public address analysis is read-only and requires no wallet connection. Wallet sign-in asks for a message signature, proves account ownership, and never exposes the private key or costs gas. Only the approval-revocation flow requests an on-chain transaction and may cost network gas.

## Production deployment

Run the stack behind an HTTPS reverse proxy and keep `.env` out of source control. Use unique, high-entropy PostgreSQL credentials, restrict database/network access, configure Alchemy keys for every network you want enabled, and add automated PostgreSQL backups and external monitoring. The bundled rate limiter protects a single frontend instance; replace it with a shared Redis-backed limiter before horizontally scaling the frontend.

## Architecture

- `frontend`: Next.js application and server-side blockchain APIs
- `ai-service`: FastAPI behavioral feature extraction and Isolation Forest scoring
- `postgres`: wallets, transactions, fraud scores, watchlists, and scan history
- Alchemy: hosted EVM RPC, transfers, token balances, metadata, and NFTs
- CoinGecko: available market prices

This application provides risk indicators, not financial advice or a guarantee that an address is safe.
