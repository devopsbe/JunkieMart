import { useState } from "react";

export default function ListingModal({ tokenId, onList, onClose }) {
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!price || Number(price) <= 0) return;

    setLoading(true);
    try {
      const usei = String(Math.floor(Number(price) * 1e6));
      await onList(tokenId, usei);
      onClose();
    } catch (err) {
      console.error("Listing failed:", err);
      alert("Listing failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="rounded p-6 w-full max-w-sm border"
        style={{ background: "var(--cjsc-card)", borderColor: "var(--cjsc-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-bold uppercase tracking-tight mb-4" style={{ color: "var(--cjsc-fg)" }}>
          List Crypto Junkie #{tokenId}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-widest block mb-1" style={{ color: "var(--cjsc-cyan)" }}>
              PRICE (SEI)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="10.00"
              className="w-full rounded px-3 py-2 font-mono text-sm border outline-none transition"
              style={{
                background: "var(--cjsc-bg)",
                borderColor: "var(--cjsc-border)",
                color: "var(--cjsc-fg)",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--cjsc-red)"}
              onBlur={(e) => e.target.style.borderColor = "var(--cjsc-border)"}
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded font-display text-sm font-medium uppercase tracking-wider transition border"
              style={{ background: "var(--cjsc-bg)", borderColor: "var(--cjsc-border)", color: "var(--cjsc-fg)" }}
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading || !price}
              className="flex-1 py-2 rounded font-display text-sm font-bold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-40"
              style={{ background: "var(--cjsc-red)" }}
            >
              {loading ? "LISTING..." : "LIST NFT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
