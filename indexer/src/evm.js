const { ethers } = require("ethers");

const RPC_TIMEOUT = 15_000;

function withTimeout(promise, ms = RPC_TIMEOUT) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

const ERC721_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
];

const MARKETPLACE_ABI = [
  "function listings(uint256) view returns (address seller, uint256 price, uint256 listedAt)",
  "event Listed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event Sold(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price)",
  "event Cancelled(uint256 indexed tokenId, address indexed seller)",
  "event PriceUpdated(uint256 indexed tokenId, uint256 newPrice)",
];

let provider = null;

function getProvider() {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(process.env.EVM_RPC_URL);
  }
  return provider;
}

function resetProvider() {
  provider = null;
}

function getNftContract() {
  return new ethers.Contract(process.env.ERC721_POINTER, ERC721_ABI, getProvider());
}

function getMarketContract() {
  if (!process.env.EVM_MARKETPLACE) return null;
  return new ethers.Contract(process.env.EVM_MARKETPLACE, MARKETPLACE_ABI, getProvider());
}

async function queryOwnerOf(tokenId) {
  try {
    const nft = getNftContract();
    return await withTimeout(nft.ownerOf(tokenId));
  } catch (e) {
    if (e.message !== "timeout") console.error(`[evm] ownerOf(${tokenId}) failed:`, e.message);
    if (e.code === "NETWORK_ERROR" || e.message === "timeout") resetProvider();
    return null;
  }
}

async function queryTokenURI(tokenId) {
  try {
    const nft = getNftContract();
    return await withTimeout(nft.tokenURI(tokenId));
  } catch (e) {
    if (e.message !== "timeout") console.error(`[evm] tokenURI(${tokenId}) failed:`, e.message);
    return null;
  }
}

async function fetchMetadata(tokenId) {
  const uri = await queryTokenURI(tokenId);
  if (!uri) return null;

  let url = uri;
  if (uri.startsWith("ipfs://")) {
    url = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`[evm] metadata fetch for ${tokenId} failed:`, e.message);
    return null;
  }
}

async function queryMarketplaceListing(tokenId) {
  const market = getMarketContract();
  if (!market) return null;
  try {
    const [seller, price, listedAt] = await market.listings(tokenId);
    if (seller === ethers.ZeroAddress) return null;
    return { seller, price: price.toString(), listedAt: Number(listedAt) };
  } catch (e) {
    return null;
  }
}

async function getRecentMarketEvents(fromBlock = "latest") {
  const market = getMarketContract();
  if (!market) return [];
  try {
    const [listed, sold, cancelled, priceUpdated] = await Promise.all([
      market.queryFilter("Listed", fromBlock, "latest"),
      market.queryFilter("Sold", fromBlock, "latest"),
      market.queryFilter("Cancelled", fromBlock, "latest"),
      market.queryFilter("PriceUpdated", fromBlock, "latest"),
    ]);
    return [...listed, ...sold, ...cancelled, ...priceUpdated]
      .sort((a, b) => (a.blockNumber - b.blockNumber) || (a.index - b.index));
  } catch (e) {
    console.error("[evm] marketplace event query failed:", e.message);
    if (e.code === "NETWORK_ERROR" || e.message === "timeout") resetProvider();
    return [];
  }
}

async function getBlockNumber() {
  return getProvider().getBlockNumber();
}

module.exports = {
  getProvider, resetProvider, getNftContract, getMarketContract,
  queryOwnerOf, queryTokenURI, fetchMetadata,
  queryMarketplaceListing, getRecentMarketEvents, getBlockNumber,
  MARKETPLACE_ABI,
};
