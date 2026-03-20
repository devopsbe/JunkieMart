import { useState } from "react";

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
    return (
      <span className="font-display text-3xl font-bold" style={{ color: "var(--cjsc-muted)" }}>
        #{tokenId}
      </span>
    );
  }

  const activeSrc = usedFallback
    ? src.replace("https://arweave.developerdao.com", FALLBACK_GATEWAY)
    : src;

  return <img src={activeSrc} alt={alt} className={className} loading="lazy" onError={handleError} />;
}

export default function TokenCard({ token, onSelect }) {
  const img = token.image
    ? token.image.replace("ipfs://", "https://ipfs.io/ipfs/")
    : null;

  return (
    <div
      onClick={() => onSelect?.(token.token_id)}
      className="rounded overflow-hidden cursor-pointer transition-all duration-200 border group hover:shadow-[0_0_20px_rgba(232,19,54,0.15)]"
      style={{ background: "var(--cjsc-card)", borderColor: "var(--cjsc-border)" }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--cjsc-red)"}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--cjsc-border)"}
    >
      <div className="aspect-square flex items-center justify-center overflow-hidden" style={{ background: "var(--cjsc-bg)" }}>
        <NftImage src={img} alt={token.name} tokenId={token.token_id} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>

      <div className="p-3 space-y-1.5">
        <h3 className="font-body text-sm font-semibold truncate" style={{ color: "var(--cjsc-fg)" }}>
          {token.name || `Crypto Junkie #${token.token_id}`}
        </h3>

        {token.listing_active ? (
          <div className="flex items-center justify-between pt-1.5 border-t" style={{ borderColor: "var(--cjsc-border)" }}>
            <span className="font-mono text-sm font-medium" style={{ color: "var(--cjsc-gold)" }}>
              {formatSei(token.listing_price_usei)} SEI
            </span>
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "var(--cjsc-green)" }}>
              LISTED
            </span>
          </div>
        ) : (
          <div className="pt-1.5 border-t" style={{ borderColor: "var(--cjsc-border)" }}>
            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "var(--cjsc-muted)" }}>
              NOT LISTED
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
