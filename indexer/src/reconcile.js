const cosmos = require("./cosmos");
const evm = require("./evm");
const { db, upsertMany, updateListing } = require("./db");

const POINTER = (process.env.POINTER_CONTRACT_ADDRESS || "").toLowerCase();
const TOTAL_SUPPLY = 990;

const ARWEAVE_GATEWAY = "https://arweave.developerdao.com";

function rewriteGateway(url) {
  if (!url) return url;
  if (url.startsWith("ipfs://")) return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  if (url.startsWith("https://arweave.net/")) return url.replace("https://arweave.net/", `${ARWEAVE_GATEWAY}/`);
  return url;
}

async function fetchMetadataSafe(tokenId) {
  try {
    const info = await cosmos.queryNftInfo(String(tokenId));
    if (info && info.token_uri) {
      const url = rewriteGateway(info.token_uri);
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const meta = await res.json();
        if (meta.image) meta.image = rewriteGateway(meta.image);
        return meta;
      }
    }
  } catch (_) { /* fall through to EVM */ }

  try {
    const meta = await evm.fetchMetadata(tokenId);
    if (meta && meta.image) meta.image = rewriteGateway(meta.image);
    return meta;
  } catch (_) { return null; }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fullReindex() {
  console.log(`[reconcile] Starting full re-index of ${TOTAL_SUPPLY} tokens...`);
  let total = 0;
  const batchSize = 10;

  for (let start = 1; start <= TOTAL_SUPPLY; start += batchSize) {
    const end = Math.min(start + batchSize - 1, TOTAL_SUPPLY);
    const promises = [];

    for (let id = start; id <= end; id++) {
      promises.push(
        reconcileToken(id).catch((e) => {
          console.error(`[reconcile] token ${id} failed:`, e.message);
          return null;
        })
      );
    }

    const batch = (await Promise.all(promises)).filter(Boolean);

    if (batch.length > 0) {
      upsertMany(batch);
      total += batch.length;
    }

    console.log(`[reconcile] Indexed tokens ${start}-${end} (${batch.length}/${end - start + 1} ok)`);
    if (start + batchSize <= TOTAL_SUPPLY) await sleep(500);
  }

  await syncMarketplaceListings();
  console.log(`[reconcile] Finished: ${total} tokens stored`);
  return total;
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
      const candidates = db.prepare(
        "SELECT token_id FROM tokens WHERE LOWER(evm_owner) = ?"
      ).all(evmMarket.toLowerCase());

      let synced = 0;
      for (const { token_id } of candidates) {
        const listing = await evm.queryMarketplaceListing(Number(token_id));
        if (listing) {
          updateListing(token_id, {
            listing_active: 1,
            listing_price_usei: (BigInt(listing.price) / 1_000_000_000_000n).toString(),
            listed_by_cosmos: null,
            listed_by_evm: listing.seller,
            active_contract: "evm",
            listed_at: listing.listedAt,
            marketplace_contract: evmMarket,
          });
          synced++;
        }
      }
      console.log(`[reconcile] Synced ${synced} EVM listings (checked ${candidates.length} candidates)`);
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
