# V1 Junkies Marketplace

Dual-path NFT marketplace for the **Crypto Junkie SC (CJSC)** V1 collection on Sei Network. Supports both CosmWasm (Cosmos) and EVM wallets simultaneously.

## Architecture

```
indexer/       → Node.js unified indexer (Cosmos + EVM RPC → SQLite → REST API)
contracts/
  cosmwasm/    → Rust CosmWasm marketplace contract
  evm/         → Solidity EVM marketplace contract (Hardhat)
frontend/      → React + Vite + TailwindCSS marketplace UI
```

## Quick Start

### 1. Indexer

```bash
cd indexer
cp .env.example .env    # edit with your RPC URLs + contract addresses
npm install
npm start               # runs on http://localhost:3001
```

**Render:** The indexer pins **Node 20.x** (`package.json` `engines`) so `better-sqlite3` native binaries match the runtime. If you still see `NODE_MODULE_VERSION` / `better_sqlite3.node` errors after changing Node version, use **Dashboard → your service → Clear build cache & deploy**.

### 2. EVM Contract (compile + test)

```bash
cd contracts/evm
npm install
npx hardhat compile
npx hardhat test
```

Deploy to testnet:
```bash
DEPLOYER_PRIVATE_KEY=0x... npx hardhat run scripts/deploy.js --network seiTestnet
```

### 3. CosmWasm Contract

Requires Rust + `wasm32-unknown-unknown` target:
```bash
cd contracts/cosmwasm
cargo build --target wasm32-unknown-unknown --release
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev             # runs on http://localhost:5173, proxies /api to indexer
```

## Contract Addresses

| Label | Address |
|---|---|
| CW-721 Original | `sei13g0nupntdq7fp09z8gc6s42g4qjduh9aw64mp5z7hf5hzmlvdmrqf4hay9` |
| ERC-721 Pointer | `0x9c979cD31D0C7b5764876cB4175484fe1206f091` |
| Total Supply | 990 |

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/tokens` | All tokens (paginated, filterable) |
| `GET /api/tokens/:id` | Single token detail |
| `GET /api/tokens/owner/:address` | Tokens by owner (cosmos or evm) |
| `GET /api/listings` | Active listings |
| `GET /api/stats` | Collection stats |
| `GET /api/health` | Indexer health |

## Tech Stack

- **Indexer**: Node.js, Express, better-sqlite3, @cosmjs/cosmwasm-stargate, ethers v6
- **CosmWasm**: Rust, cosmwasm-std, cw-storage-plus
- **EVM**: Solidity 0.8.27, OpenZeppelin v5, Hardhat
- **Frontend**: React 18, Vite, TailwindCSS v4
