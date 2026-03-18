const cosmos = require("./cosmos");
const evm = require("./evm");
const { upsertMany, updateListing } = require("./db");

const POINTER = (process.env.POINTER_CONTRACT_ADDRESS || "").toLowerCase();
const TOTAL_SUPPLY = 990;

async function fetchMetadataSafe(tokenId) {
  try {
    const info = await cosmos.queryNftInfo(String(tokenId));
    if (info && info.token_uri) {
      let url = info.token_uri;
      if (url.startsWith("ipfs://")) url = url.replace("ipfs://", "https://ipfs.io/ipfs/");
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) return await res.json();
    }
  } catch (_) { /* fall through to EVM */ }

  return await evm.fetchMetadata(tokenId);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fullReindex() {
  console.log(`[reconcile] Starting full re-index of ${TOTAL_SUPPLY} tokens...`);
  const records = [];
  const batchSize = 10;

  for (let start = 1; start <= TOTAL_SUPPLY; start += batchSize) {
    const end = Math.min(start + batchSize - 1, TOTAL_SUPPLY);
    const promises = [];

    for (let id = start; id <= end; id++) {
      promises.push(reconcileToken(id));
    }

    const batch = await Promise.allSettled(promises);
    for (const result of batch) {
      if (result.status === "fulfilled" && result.value) {
        records.push(result.value);
      }
    }

    console.log(`[reconcile] Indexed tokens ${start}-${end}`);
    if (start + batchSize <= TOTAL_SUPPLY) await sleep(500);
  }

  if (records.length > 0) {
    upsertMany(records);
    console.log(`[reconcile] Stored ${records.length} token records`);
  }

  await syncMarketplaceListings();
  return records.length;
}

async function syncMarketplaceListings() {
  const cwMarket = process.env.COSMWASM_MARKETPLACE;
  if (cwMarket) {
    try {
      const listings = await cosmos.queryMarketplaceListings(cwMarket);
      for (const l of listings) {
        updateListing(l.token_id, {
          listing_active: 1,
          listing_price_usei: l.price,
          listed_by_cosmos: l.seller,
          listed_by_evm: null,
          active_contract: "cosmwasm",
          listed_at: l.listed_at || null,
          marketplace_contract: cwMarket,
        });
      }
      console.log(`[reconcile] Synced ${listings.length} CosmWasm listings`);
    } catch (e) {
      console.error("[reconcile] CosmWasm listing sync failed:", e.message);
    }
  }

  const evmMarket = process.env.EVM_MARKETPLACE;
  if (evmMarket) {
    try {
      for (let id = 1; id <= TOTAL_SUPPLY; id++) {
        const listing = await evm.queryMarketplaceListing(id);
        if (listing) {
          updateListing(String(id), {
            listing_active: 1,
            listing_price_usei: listing.price,
            listed_by_cosmos: null,
            listed_by_evm: listing.seller,
            active_contract: "evm",
            listed_at: listing.listedAt,
            marketplace_contract: evmMarket,
          });
        }
      }
      console.log("[reconcile] Synced EVM marketplace listings");
    } catch (e) {
      console.error("[reconcile] EVM listing sync failed:", e.message);
    }
  }
}

async function reconcileToken(tokenId) {
  const id = String(tokenId);

  const [cosmosOwner, evmOwner] = await Promise.all([
    cosmos.queryOwnerOf(id),
    evm.queryOwnerOf(tokenId),
  ]);

  const evmIsPointer = evmOwner ? evmOwner.toLowerCase() === POINTER : false;
  const canonicalSide = evmIsPointer || !evmOwner ? "cosmos" : "evm";

  let metadata = null;
  try {
    metadata = await fetchMetadataSafe(tokenId);
  } catch (_) {}

  return {
    token_id: id,
    cosmos_owner: cosmosOwner || null,
    evm_owner: evmOwner || null,
    canonical_side: canonicalSide,
    evm_is_pointer: evmIsPointer ? 1 : 0,
    name: metadata?.name || `Crypto Junkie #${id}`,
    description: metadata?.description || null,
    image: metadata?.image || null,
    attributes: metadata?.attributes ? JSON.stringify(metadata.attributes) : null,
    listing_active: 0,
    listing_price_usei: null,
    listed_by_cosmos: null,
    listed_by_evm: null,
    active_contract: null,
    listed_at: null,
    marketplace_contract: null,
    last_cosmos_tx: null,
    last_evm_tx: null,
    last_block: null,
    last_timestamp: null,
    indexed_at: Date.now(),
  };
}

module.exports = { fullReindex, reconcileToken, syncMarketplaceListings, TOTAL_SUPPLY };
