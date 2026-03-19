const { CosmWasmClient } = require("@cosmjs/cosmwasm-stargate");

const RPC_TIMEOUT = 15_000;

function withTimeout(promise, ms = RPC_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

let client = null;

async function getClient() {
  if (!client) {
    client = await CosmWasmClient.connect(process.env.COSMOS_RPC_URL);
  }
  return client;
}

async function queryOwnerOf(tokenId) {
  const c = await getClient();
  try {
    const res = await withTimeout(
      c.queryContractSmart(process.env.CW721_CONTRACT, {
        owner_of: { token_id: String(tokenId) },
      })
    );
    return res.owner;
  } catch (e) {
    if (e.message !== "timeout") console.error(`[cosmos] ownerOf(${tokenId}) failed:`, e.message);
    return null;
  }
}

async function queryNftInfo(tokenId) {
  const c = await getClient();
  try {
    const res = await withTimeout(
      c.queryContractSmart(process.env.CW721_CONTRACT, {
        nft_info: { token_id: String(tokenId) },
      })
    );
    return res;
  } catch (e) {
    if (e.message !== "timeout") console.error(`[cosmos] nftInfo(${tokenId}) failed:`, e.message);
    return null;
  }
}

async function queryMarketplaceListings(marketplaceAddr) {
  if (!marketplaceAddr) return [];
  const c = await getClient();
  try {
    const res = await withTimeout(
      c.queryContractSmart(marketplaceAddr, {
        all_listings: { limit: 100 },
      })
    );
    return res.listings || [];
  } catch (e) {
    console.error("[cosmos] marketplace query failed:", e.message);
    return [];
  }
}

module.exports = {
  getClient, queryOwnerOf, queryNftInfo,
  queryMarketplaceListings,
};
