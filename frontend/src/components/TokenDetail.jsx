import { useState } from "react";
import { useToken } from "../hooks/useTokens";

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
    return (
      <div className="w-full h-full flex items-center justify-center font-display text-6xl font-bold" style={{ color: "var(--cjsc-muted)" }}>
        #{tokenId}
      </div>
    );
  }

  const activeSrc = usedFallback
    ? src.replace("https://arweave.developerdao.com", FALLBACK_GATEWAY)
    : src;

  return <img src={activeSrc} alt={alt} className="w-full h-full object-cover" onError={handleError} />;
}

export default function TokenDetail({ tokenId, onBack, onBuy, onCancel, onListRequest, activeMode, cosmosAddr, evmAddr }) {
  const { token, loading } = useToken(tokenId);

  if (loading) return <div className="text-center py-12 font-mono text-sm" style={{ color: "var(--cjsc-muted)" }}>LOADING...</div>;
  if (!token) return <div className="text-center py-12 font-mono text-sm" style={{ color: "var(--cjsc-muted)" }}>TOKEN NOT FOUND</div>;

  const img = token.image ? token.image.replace("ipfs://", "https://ipfs.io/ipfs/") : null;
  const addr = (a) => a?.toLowerCase();
  const isOwner =
    (cosmosAddr && (addr(token.cosmos_owner) === addr(cosmosAddr) || addr(token.listed_by_cosmos) === addr(cosmosAddr))) ||
    (evmAddr && (addr(token.evm_owner) === addr(evmAddr) || addr(token.listed_by_evm) === addr(evmAddr)));

  const displayOwner = token.cosmos_owner || token.evm_owner;
  const attrs = token.attributes ? JSON.parse(token.attributes) : [];

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="font-mono text-xs mb-4 transition hover:opacity-100 opacity-60"
        style={{ color: "var(--cjsc-fg)" }}
      >
        ← BACK
      </button>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="aspect-square rounded overflow-hidden border" style={{ background: "var(--cjsc-bg)", borderColor: "var(--cjsc-border)" }}>
          <DetailImage src={img} alt={token.name} tokenId={token.token_id} />
        </div>

        <div className="space-y-4">
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight" style={{ color: "var(--cjsc-fg)" }}>
            {token.name || `Crypto Junkie #${token.token_id}`}
          </h1>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--cjsc-cyan)" }}>OWNER</span>
              <span className="font-mono text-xs" style={{ color: "var(--cjsc-fg)" }}>{shorten(displayOwner)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--cjsc-cyan)" }}>TOKEN ID</span>
              <span className="font-mono text-xs" style={{ color: "var(--cjsc-fg)" }}>#{token.token_id}</span>
            </div>
          </div>

          {token.listing_active ? (
            <div className="rounded p-4 space-y-3 border" style={{ background: "var(--cjsc-card)", borderColor: "var(--cjsc-border)" }}>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--cjsc-cyan)" }}>PRICE</span>
                <span className="font-display text-xl font-bold" style={{ color: "var(--cjsc-gold)" }}>
                  {formatSei(token.listing_price_usei)} SEI
                </span>
              </div>

              {isOwner ? (
                <button
                  onClick={() => onCancel?.(token.token_id)}
                  className="w-full py-2.5 rounded font-display text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110"
                  style={{ background: "var(--cjsc-orange)" }}
                >
                  CANCEL LISTING
                </button>
              ) : activeMode ? (
                <button
                  onClick={() => onBuy?.(token.token_id, token.listing_price_usei)}
                  className="w-full py-2.5 rounded font-display text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110"
                  style={{ background: "var(--cjsc-red)" }}
                >
                  BUY NOW
                </button>
              ) : (
                <p className="font-mono text-xs text-center" style={{ color: "var(--cjsc-muted)" }}>CONNECT WALLET TO BUY</p>
              )}
            </div>
          ) : (
            <div className="rounded p-4 space-y-3 border" style={{ background: "var(--cjsc-card)", borderColor: "var(--cjsc-border)" }}>
              <p className="font-mono text-xs" style={{ color: "var(--cjsc-muted)" }}>NOT CURRENTLY LISTED</p>
              {isOwner && activeMode ? (
                <button
                  onClick={() => onListRequest?.(token.token_id)}
                  className="w-full py-2.5 rounded font-display text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110"
                  style={{ background: "var(--cjsc-red)" }}
                >
                  LIST FOR SALE
                </button>
              ) : !activeMode ? (
                <p className="font-mono text-[10px] text-center" style={{ color: "var(--cjsc-muted)" }}>CONNECT WALLET TO INTERACT</p>
              ) : null}
            </div>
          )}

          {attrs.length > 0 && (
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--cjsc-cyan)" }}>ATTRIBUTES</h3>
              <div className="grid grid-cols-2 gap-2">
                {attrs.map((a, i) => (
                  <div key={i} className="rounded p-2 text-center border" style={{ background: "var(--cjsc-card)", borderColor: "var(--cjsc-border)" }}>
                    <p className="font-mono text-[9px] uppercase tracking-widest" style={{ color: "var(--cjsc-cyan)" }}>{a.trait_type}</p>
                    <p className="font-body text-xs font-medium" style={{ color: "var(--cjsc-fg)" }}>{a.value}</p>
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
