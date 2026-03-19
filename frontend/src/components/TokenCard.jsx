import { useState } from "react";
import OwnerBadge from "./OwnerBadge";

function shorten(addr) {
  if (!addr) return "—";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatSei(usei) {
  if (!usei) return null;
  return (Number(usei) / 1e6).toFixed(2);
}

const FALLBACK_GATEWAY = "https://arweave.net";

function NftImage({ src, alt, tokenId, className }) {
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
    return <span className="text-zinc-600 text-4xl font-bold">#{tokenId}</span>;
  }

  const activeSrc = usedFallback
    ? src.replace("https://arweave.developerdao.com", FALLBACK_GATEWAY)
    : src;

  return <img src={activeSrc} alt={alt} className={className} loading="lazy" onError={handleError} />;
}

export default function TokenCard({ token, onSelect }) {
  const owner = token.canonical_side === "cosmos" ? token.cosmos_owner : token.evm_owner;
  const img = token.image
    ? token.image.replace("ipfs://", "https://ipfs.io/ipfs/")
    : null;

  return (
    <div
      onClick={() => onSelect?.(token.token_id)}
      className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden cursor-pointer hover:border-zinc-600 transition group"
    >
      <div className="aspect-square bg-zinc-800 flex items-center justify-center overflow-hidden">
        <NftImage src={img} alt={token.name} tokenId={token.token_id} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100 truncate">
            {token.name || `Crypto Junkie #${token.token_id}`}
          </h3>
          <OwnerBadge side={token.canonical_side} />
        </div>

        <p className="text-xs text-zinc-500 font-mono truncate">
          {shorten(owner)}
        </p>

        {token.listing_active ? (
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
            <span className="text-emerald-400 text-sm font-semibold">{formatSei(token.listing_price_usei)} SEI</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Listed</span>
          </div>
        ) : (
          <div className="pt-1 border-t border-zinc-800">
            <span className="text-zinc-600 text-xs">Not listed</span>
          </div>
        )}
      </div>
    </div>
  );
}
