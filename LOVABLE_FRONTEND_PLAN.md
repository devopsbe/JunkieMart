# V1 Junkies Marketplace — Lovable Frontend Build Plan

## What This App Is

An NFT marketplace for the **Crypto Junkie SC (CJSC)** V1 collection (990 tokens) on Sei Network. It supports **two wallet modes simultaneously** via **Compass Wallet**: Cosmos mode (sei1... addresses) and EVM mode (0x... addresses). The frontend reads token data from a REST API indexer and lets users browse, buy, list, and cancel NFT listings.

---

## Design Direction

- **Dark theme only** — zinc-950 background, zinc-900 cards, zinc-800 borders
- **Accent colors**: emerald-400/500 for prices and primary actions, purple-400/600 for Cosmos wallet, blue-400/600 for EVM wallet, red-600 for destructive actions
- **Typography**: clean sans-serif, monospace for addresses and prices
- **Layout**: max-w-6xl centered container, responsive grid (2 cols mobile → 5 cols desktop)
- **Vibe**: minimal, crypto-native, like a stripped-down OpenSea/Blur for a single collection

---

## Pages / Views

This is a **single-page app** with two views managed by state (no router needed):

### View 1: Collection Grid (default)

**Header** (sticky top):
- Left: Logo text "V1 Junkies Market" (V1 in emerald-400)
- Right: Two wallet connect buttons side by side — "Connect Compass" (Cosmos) and "Connect Compass EVM"
  - When connected, show shortened address with icon (◈ for Cosmos, Ξ for EVM)
  - Active wallet gets colored background (purple for Cosmos, blue for EVM)
  - Clicking a connected wallet disconnects it

**Stats Bar** (4-column grid below header):
- Supply (total count)
- Listed (count of active listings)
- Floor (lowest listed price in SEI)
- Holders (format: "X CW / Y EVM")

**Filter Bar** (horizontal row):
- Dropdown: "All Sides" / "Cosmos" / "EVM"
- Dropdown: "Token ID" / "Price: Low → High" / "Price: High → Low"
- Checkbox: "Listed only"

**Token Grid** (responsive: 2/3/4/5 columns):
- Each card shows:
  - Square image (or placeholder `#123` in zinc-600 if no image)
  - Token name (e.g. "Crypto Junkie #42")
  - Owner badge: "◈ Cosmos" in purple-400 or "Ξ EVM" in blue-400
  - Shortened owner address in monospace
  - Divider line
  - If listed: price in emerald-400 + "Listed" label
  - If not listed: "Not listed" in zinc-600
- Hover: border lightens, image scales up slightly
- Click: navigates to token detail view
- Loading state: 20 skeleton cards with pulse animation

**Pagination** (bottom center):
- "← Prev" / "Page X of Y" / "Next →"
- Disabled state at boundaries

### View 2: Token Detail

**Back button**: "← Back to collection" at top

**Two-column layout** (stacks on mobile):

Left column:
- Large square image (or placeholder)

Right column:
- Token name (large, bold, white)
- Owner badge (◈ Cosmos or Ξ EVM)
- Info rows:
  - "Cosmos Owner" → shortened sei1... address
  - "EVM Owner" → shortened 0x... address
  - "Status" → "● Cosmos-native" or "● EVM-claimed"
- Listing section (bg-zinc-800/50 rounded box):
  - If listed: show price in emerald-400, plus action button:
    - If connected wallet IS the owner → "Cancel Listing" (red)
    - If connected wallet is NOT the owner → "Buy with Cosmos/EVM Wallet" (emerald)
    - If no wallet connected → "Connect a wallet to buy" (gray text)
  - If not listed: "Not currently listed"
- Attributes grid (2 columns): trait_type label + value for each attribute

### Modal: List NFT

- Dark overlay, centered card
- Title: "List Crypto Junkie #X"
- Price input (number, step 0.01, in SEI)
- Cancel / "List NFT" buttons
- Loading state on submit

---

## Data Model (what the API returns)

### Token object (from `GET /api/tokens` and `GET /api/tokens/:id`)

```json
{
  "token_id": "42",
  "cosmos_owner": "sei1abc...xyz",
  "evm_owner": "0xABC...123",
  "canonical_side": "cosmos",
  "evm_is_pointer": 1,
  "name": "Crypto Junkie #42",
  "description": "...",
  "image": "ipfs://Qm...",
  "attributes": "[{\"trait_type\":\"Background\",\"value\":\"Blue\"}]",
  "listing_active": 0,
  "listing_price_usei": null,
  "listed_by_cosmos": null,
  "listed_by_evm": null,
  "active_contract": null,
  "listed_at": null,
  "marketplace_contract": null,
  "indexed_at": 1710700000000
}
```

Key notes:
- `image` may be `ipfs://...` — convert to `https://ipfs.io/ipfs/...` for display
- `attributes` is a JSON string — parse it to get `[{ trait_type, value }]`
- `listing_active` is 0 or 1 (integer, not boolean)
- `listing_price_usei` is in micro-SEI — divide by 1,000,000 to display in SEI
- `canonical_side` is "cosmos" or "evm"
- `evm_is_pointer` is 1 if token lives on Cosmos side, 0 if claimed on EVM

### GET /api/tokens response

```json
{
  "tokens": [ ...array of token objects... ],
  "total": 990,
  "page": 1,
  "limit": 20
}
```

Query params: `?listed=true&side=cosmos&sort=price_asc&page=1&limit=20`

### GET /api/stats response

```json
{
  "total_supply": 990,
  "listed": 5,
  "floor_usei": 10000000,
  "cosmos_holders": 2,
  "evm_holders": 10
}
```

### GET /api/listings response

```json
{
  "listings": [ ...array of token objects where listing_active=1... ]
}
```

---

## API Endpoints (backend already built, just consume these)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tokens?listed=true&side=cosmos&sort=price_asc&page=1&limit=20` | Paginated token list with filters |
| GET | `/api/tokens/:id` | Single token by ID |
| GET | `/api/tokens/owner/:address` | All tokens owned by an address |
| GET | `/api/listings` | All active listings |
| GET | `/api/listings/:token_id` | Single listing by token ID |
| GET | `/api/stats` | Collection stats |
| GET | `/api/health` | Health check |

The API base URL should be configurable via environment variable `VITE_API_URL` (default: empty string, meaning same-origin with `/api` prefix).

---

## Wallet Integration (Compass Wallet for Sei)

All wallet interaction uses **Compass Wallet** (https://compasswallet.io). Compass exposes two window objects — one for Cosmos, one for EVM. Both are from the same browser extension.

### Compass — Cosmos side (`window.compass`)
- Check for `window.compass` (injected by Compass extension)
- Call `window.compass.enable("pacific-1")` to request permission
- Get signer via `await window.compass.getOfflineSignerAuto("pacific-1")` (use `getOfflineSignerAuto`, NOT `getOfflineSigner` — required for Ledger compatibility)
- Get address from `signer.getAccounts()` → `accounts[0].address` (sei1... format)
- For transactions: dynamically import `@cosmjs/cosmwasm-stargate`, create `SigningCosmWasmClient.connectWithSigner("https://rpc.sei-apis.com", signer)`

### Compass — EVM side (`window.compassEvm`)
- Check for `window.compassEvm` (EIP-1193 provider injected by Compass)
- Call `window.compassEvm.request({ method: "eth_requestAccounts" })` to connect
- Listen for `accountsChanged` events on `window.compassEvm`
- For transactions: dynamically import `ethers`, create `new BrowserProvider(window.compassEvm)`

**IMPORTANT:** Do NOT use `window.keplr` or `window.ethereum`. Use `window.compass` and `window.compassEvm` exclusively.

### State
- `cosmosAddr`: string | null
- `evmAddr`: string | null
- `activeMode`: "cosmos" | "evm" | null (whichever was connected last)

---

## Marketplace Transaction Flows

All transactions route through the connected Compass wallet mode. For Cosmos transactions, get the signer via `await window.compass.getOfflineSignerAuto("pacific-1")`. For EVM transactions, create `new BrowserProvider(window.compassEvm)`. Contract addresses come from env vars:
- `VITE_CW721_CONTRACT` = `sei13g0nupntdq7fp09z8gc6s42g4qjduh9aw64mp5z7hf5hzmlvdmrqf4hay9`
- `VITE_ERC721_POINTER` = `0x9c979cD31D0C7b5764876cB4175484fe1206f091`
- `VITE_COSMWASM_MARKETPLACE` = (set after deploy)
- `VITE_EVM_MARKETPLACE` = (set after deploy)

### List NFT (Cosmos path)
1. `approve` on CW-721 contract (spender = marketplace address, token_id = token)
2. `list_nft` on CosmWasm marketplace (token_id, price in usei)

### List NFT (EVM path)
1. `setApprovalForAll` on ERC-721 pointer (operator = marketplace address)
2. `listNFT(tokenId, priceInWei)` on EVM marketplace

### Buy NFT (Cosmos path)
- `buy_nft` on CosmWasm marketplace with funds `[{ denom: "usei", amount: priceUsei }]`

### Buy NFT (EVM path)
- `buyNFT(tokenId)` on EVM marketplace with `{ value: priceInWei }`

### Cancel Listing (Cosmos path)
- `cancel_listing` on CosmWasm marketplace

### Cancel Listing (EVM path)
- `cancelListing(tokenId)` on EVM marketplace

### EVM Marketplace ABI (human-readable)
```
function listNFT(uint256 tokenId, uint256 price) external
function buyNFT(uint256 tokenId) external payable
function cancelListing(uint256 tokenId) external
function updatePrice(uint256 tokenId, uint256 newPrice) external
```

### Price conversion
- API returns prices in **usei** (micro-SEI, 1 SEI = 1,000,000 usei)
- Display to user in SEI (divide by 1e6)
- User inputs price in SEI, convert to usei for Cosmos (`Math.floor(price * 1e6)`) or wei for EVM (`parseEther(price)`)

---

## Component Tree

```
App
├── Header
│   ├── Logo ("V1 Junkies Market")
│   └── WalletConnect
│       ├── CompassCosmosButton (connect/disconnect via window.compass)
│       └── CompassEvmButton (connect/disconnect via window.compassEvm)
├── StatsBar (Supply, Listed, Floor, Holders)
├── FilterBar (side dropdown, sort dropdown, listed checkbox)
├── TokenGrid
│   └── TokenCard (x20 per page)
│       └── OwnerBadge
├── Pagination
├── TokenDetail (shown instead of grid when token selected)
│   └── OwnerBadge
└── ListingModal (overlay)
```

---

## Tech Stack for Lovable

- React 18 (Lovable default)
- TailwindCSS (Lovable default)
- No router needed — use useState to toggle between grid and detail views
- Compass Wallet (`window.compass` for Cosmos, `window.compassEvm` for EVM)
- `@cosmjs/cosmwasm-stargate` — dynamic import only when Cosmos transactions happen
- `ethers` v6 — dynamic import only when EVM transactions happen
- No React Query needed — simple useState + useEffect + fetch is fine

---

## Environment Variables

```
VITE_API_URL=                  # empty = same origin, or http://localhost:3001 for dev
VITE_CW721_CONTRACT=sei13g0nupntdq7fp09z8gc6s42g4qjduh9aw64mp5z7hf5hzmlvdmrqf4hay9
VITE_ERC721_POINTER=0x9c979cD31D0C7b5764876cB4175484fe1206f091
VITE_COSMWASM_MARKETPLACE=
VITE_EVM_MARKETPLACE=
```

---

## Summary of What to Build

1. A dark-themed single-page NFT marketplace
2. Dual wallet connect via Compass Wallet (Cosmos + EVM) in the header
3. Stats bar showing collection metrics from `/api/stats`
4. Filterable, sortable, paginated grid of 990 NFT cards from `/api/tokens`
5. Token detail view with ownership info, buy/cancel actions, and attributes
6. Listing modal for setting a price and listing an NFT
7. All blockchain transactions routed through the connected wallet type (Cosmos or EVM)
8. IPFS image handling (convert `ipfs://` to `https://ipfs.io/ipfs/`)
9. Skeleton loading states for the grid
10. Responsive layout (mobile to desktop)
