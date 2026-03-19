import { useState } from "react";
import { useToken } from "../hooks/useTokens";
import OwnerBadge from "./OwnerBadge";

function shorten(addr) {
  if (!addr) return "—";
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function formatSei(usei) {
  if (!usei) return "—";
  return (Number(usei) / 1e6).toFixed(2);
}

const FALLBACK_GATEWAY = "https://arweave.net";

function DetailImage({ src, alt, tokenId }) {
  const [failed, setFailed] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const handleError = () => {
    if (!usedFallback && src?.includes("arweave.developerdao.com")) {
      setUsedFallback(true);
      return;
    }
    setFailed(true);
  };

  if (failed || !src) {
    return <div className="w-full h-full flex items-center justify-center text-zinc-600 text-6xl font-bold">#{tokenId}</div>;
  }

  const activeSrc = usedFallback
    ? src.replace("https://arweave.developerdao.com", FALLBACK_GATEWAY)
    : src;

  return <img src={activeSrc} alt={alt} className="w-full h-full object-cover" onError={handleError} />;
}

export default function TokenDetail({ tokenId, onBack, onBuy, onCancel, onListRequest, activeMode, cosmosAddr, evmAddr }) {
  const { token, loading } = useToken(tokenId);

  if (loading) return <div className="text-center py-12 text-zinc-500">Loading...</div>;
  if (!token) return <div className="text-center py-12 text-zinc-500">Token not found</div>;

  const img = token.image ? token.image.replace("ipfs://", "https://ipfs.io/ipfs/") : null;
  const addr = (a) => a?.toLowerCase();
  const isOwner =
    (cosmosAddr && (addr(token.cosmos_owner) === addr(cosmosAddr) || addr(token.listed_by_cosmos) === addr(cosmosAddr))) ||
    (evmAddr && (addr(token.evm_owner) === addr(evmAddr) || addr(token.listed_by_evm) === addr(evmAddr)));

  const attrs = token.attributes ? JSON.parse(token.attributes) : [];

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="text-zinc-400 hover:text-white mb-4 text-sm">← Back to collection</button>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="aspect-square bg-zinc-800 rounded-xl overflow-hidden">
          <DetailImage src={img} alt={token.name} tokenId={token.token_id} />
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{token.name || `Crypto Junkie #${token.token_id}`}</h1>
            <OwnerBadge side={token.canonical_side} />
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Cosmos Owner</span><span className="text-zinc-300 font-mono">{shorten(token.cosmos_owner)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">EVM Owner</span><span className="text-zinc-300 font-mono">{shorten(token.evm_owner)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Status</span><span className="text-zinc-300">{token.evm_is_pointer ? "● Cosmos-native" : "● EVM-claimed"}</span></div>
          </div>

          {token.listing_active ? (
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400 text-sm">Listed Price</span>
                <span className="text-emerald-400 text-xl font-bold">{formatSei(token.listing_price_usei)} SEI</span>
              </div>

              {isOwner ? (
                <button onClick={() => onCancel?.(token.token_id)} className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition">
                  Cancel Listing
                </button>
              ) : activeMode ? (
                <button onClick={() => onBuy?.(token.token_id, token.listing_price_usei)} className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition">
                  Buy with {activeMode === "cosmos" ? "Cosmos" : "EVM"} Wallet
                </button>
              ) : (
                <p className="text-zinc-500 text-sm text-center">Connect a wallet to buy</p>
              )}
            </div>
          ) : (
            <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
              <p className="text-zinc-500 text-sm">Not currently listed</p>
              {isOwner && activeMode ? (
                <button onClick={() => onListRequest?.(token.token_id)} className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition">
                  List for Sale
                </button>
              ) : !activeMode ? (
                <p className="text-zinc-500 text-xs text-center">Connect a wallet to interact</p>
              ) : null}
            </div>
          )}

          {attrs.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Attributes</h3>
              <div className="grid grid-cols-2 gap-2">
                {attrs.map((a, i) => (
                  <div key={i} className="bg-zinc-800 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{a.trait_type}</p>
                    <p className="text-xs text-zinc-200 font-medium">{a.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
