import { useCallback } from "react";

const CW_MARKETPLACE = import.meta.env.VITE_COSMWASM_MARKETPLACE || "";
const EVM_MARKETPLACE = import.meta.env.VITE_EVM_MARKETPLACE || "";
const CW721_CONTRACT = import.meta.env.VITE_CW721_CONTRACT || "";

const EVM_MARKET_ABI = [
  "function listNFT(uint256 tokenId, uint256 price) external",
  "function buyNFT(uint256 tokenId) external payable",
  "function cancelListing(uint256 tokenId) external",
  "function updatePrice(uint256 tokenId, uint256 newPrice) external",
];

export function useMarketplace({ activeMode, cosmosAddr, evmAddr }) {
  const listNft = useCallback(async (tokenId, priceUsei) => {
    if (activeMode === "cosmos") {
      return cosmosListNft(tokenId, priceUsei, cosmosAddr);
    } else if (activeMode === "evm") {
      return evmListNft(tokenId, priceUsei);
    }
    throw new Error("No wallet connected");
  }, [activeMode, cosmosAddr, evmAddr]);

  const buyNft = useCallback(async (tokenId, priceUsei) => {
    if (activeMode === "cosmos") {
      return cosmosBuyNft(tokenId, priceUsei, cosmosAddr);
    } else if (activeMode === "evm") {
      return evmBuyNft(tokenId, priceUsei);
    }
    throw new Error("No wallet connected");
  }, [activeMode, cosmosAddr, evmAddr]);

  const cancelListing = useCallback(async (tokenId) => {
    if (activeMode === "cosmos") {
      return cosmosCancelListing(tokenId, cosmosAddr);
    } else if (activeMode === "evm") {
      return evmCancelListing(tokenId);
    }
    throw new Error("No wallet connected");
  }, [activeMode, cosmosAddr, evmAddr]);

  return { listNft, buyNft, cancelListing };
}

async function cosmosListNft(tokenId, priceUsei, sender) {
  const { SigningCosmWasmClient } = await import("@cosmjs/cosmwasm-stargate");
  const offlineSigner = await window.compass.getOfflineSignerAuto("pacific-1");
  const client = await SigningCosmWasmClient.connectWithSigner(
    "https://rpc.sei-apis.com", offlineSigner
  );

  await client.execute(sender, CW721_CONTRACT, {
    approve: { spender: CW_MARKETPLACE, token_id: tokenId },
  }, "auto");

  return client.execute(sender, CW_MARKETPLACE, {
    list_nft: { token_id: tokenId, price: priceUsei },
  }, "auto");
}

async function cosmosBuyNft(tokenId, priceUsei, sender) {
  const { SigningCosmWasmClient } = await import("@cosmjs/cosmwasm-stargate");
  const offlineSigner = await window.compass.getOfflineSignerAuto("pacific-1");
  const client = await SigningCosmWasmClient.connectWithSigner(
    "https://rpc.sei-apis.com", offlineSigner
  );

  return client.execute(sender, CW_MARKETPLACE, {
    buy_nft: { token_id: tokenId },
  }, "auto", undefined, [{ denom: "usei", amount: priceUsei }]);
}

async function cosmosCancelListing(tokenId, sender) {
  const { SigningCosmWasmClient } = await import("@cosmjs/cosmwasm-stargate");
  const offlineSigner = await window.compass.getOfflineSignerAuto("pacific-1");
  const client = await SigningCosmWasmClient.connectWithSigner(
    "https://rpc.sei-apis.com", offlineSigner
  );

  return client.execute(sender, CW_MARKETPLACE, {
    cancel_listing: { token_id: tokenId },
  }, "auto");
}

async function evmListNft(tokenId, priceUsei) {
  const { BrowserProvider, Contract, parseEther } = await import("ethers");
  const provider = new BrowserProvider(window.compassEvm);
  const signer = await provider.getSigner();

  const nft = new Contract(
    import.meta.env.VITE_ERC721_POINTER,
    ["function setApprovalForAll(address operator, bool approved) external"],
    signer
  );
  await (await nft.setApprovalForAll(EVM_MARKETPLACE, true)).wait();

  const market = new Contract(EVM_MARKETPLACE, EVM_MARKET_ABI, signer);
  const priceWei = parseEther((Number(priceUsei) / 1e6).toString());
  return (await market.listNFT(tokenId, priceWei)).wait();
}

async function evmBuyNft(tokenId, priceUsei) {
  const { BrowserProvider, Contract, parseEther } = await import("ethers");
  const provider = new BrowserProvider(window.compassEvm);
  const signer = await provider.getSigner();
  const market = new Contract(EVM_MARKETPLACE, EVM_MARKET_ABI, signer);
  const priceWei = parseEther((Number(priceUsei) / 1e6).toString());
  return (await market.buyNFT(tokenId, { value: priceWei })).wait();
}

async function evmCancelListing(tokenId) {
  const { BrowserProvider, Contract } = await import("ethers");
  const provider = new BrowserProvider(window.compassEvm);
  const signer = await provider.getSigner();
  const market = new Contract(EVM_MARKETPLACE, EVM_MARKET_ABI, signer);
  return (await market.cancelListing(tokenId)).wait();
}
