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
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-4">List Crypto Junkie #{tokenId}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 block mb-1">Price (SEI)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="10.00"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading || !price} className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50 transition">
              {loading ? "Listing..." : "List NFT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
