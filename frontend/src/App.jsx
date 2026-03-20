import { useState } from "react";
import { useTokens, useStats } from "./hooks/useTokens";
import { useWallet } from "./hooks/useWallet";
import { useMarketplace } from "./hooks/useMarketplace";
import WalletConnect from "./components/WalletConnect";
import TokenGrid from "./components/TokenGrid";
import TokenDetail from "./components/TokenDetail";
import ListingModal from "./components/ListingModal";

export default function App() {
  const wallet = useWallet();
  const { listNft, buyNft, cancelListing } = useMarketplace(wallet);
  const stats = useStats();

  const [selectedToken, setSelectedToken] = useState(null);
  const [listingToken, setListingToken] = useState(null);
  const [filters, setFilters] = useState({ listed: false, sort: "token_id", page: 1 });

  const { tokens, total, loading, refetch } = useTokens({
    listed: filters.listed || undefined,
    sort: filters.sort,
    page: filters.page,
    limit: 20,
  });

  const totalPages = Math.ceil(total / 20);

  const handleBuy = async (tokenId, priceUsei) => {
    try {
      await buyNft(tokenId, priceUsei);
      alert("Purchase successful!");
      refetch();
      setSelectedToken(null);
    } catch (e) {
      alert("Purchase failed: " + e.message);
    }
  };

  const handleCancel = async (tokenId) => {
    try {
      await cancelListing(tokenId);
      alert("Listing cancelled!");
      refetch();
      setSelectedToken(null);
    } catch (e) {
      alert("Cancel failed: " + e.message);
    }
  };

  const handleList = async (tokenId, priceUsei) => {
    await listNft(tokenId, priceUsei);
    refetch();
  };

  if (selectedToken) {
    return (
      <div className="min-h-screen" style={{ background: "var(--cjsc-bg)" }}>
        <Header wallet={wallet} />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <TokenDetail
            tokenId={selectedToken}
            onBack={() => setSelectedToken(null)}
            onBuy={handleBuy}
            onCancel={handleCancel}
            onListRequest={(id) => setListingToken(id)}
            activeMode={wallet.activeMode}
            cosmosAddr={wallet.cosmosAddr}
            evmAddr={wallet.evmAddr}
          />
        </main>
        {listingToken && (
          <ListingModal tokenId={listingToken} onList={handleList} onClose={() => setListingToken(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--cjsc-bg)" }}>
      <Header wallet={wallet} />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="SUPPLY" value={stats.total_supply} />
            <Stat label="LISTED" value={stats.listed} color="var(--cjsc-green)" />
            <Stat label="FLOOR" value={stats.floor_usei ? `${(stats.floor_usei / 1e6).toFixed(2)} SEI` : "—"} color="var(--cjsc-gold)" />
            <Stat label="HOLDERS" value={stats.unique_holders ?? "—"} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))}
            className="font-mono text-xs px-3 py-1.5 rounded border outline-none"
            style={{ background: "var(--cjsc-card)", borderColor: "var(--cjsc-border)", color: "var(--cjsc-fg)" }}
          >
            <option value="token_id">TOKEN ID</option>
            <option value="price_asc">PRICE: LOW → HIGH</option>
            <option value="price_desc">PRICE: HIGH → LOW</option>
          </select>

          <label className="flex items-center gap-2 text-xs font-mono cursor-pointer" style={{ color: "var(--cjsc-muted)" }}>
            <input
              type="checkbox"
              checked={filters.listed}
              onChange={(e) => setFilters((f) => ({ ...f, listed: e.target.checked, page: 1 }))}
              style={{ accentColor: "var(--cjsc-red)" }}
            />
            LISTED ONLY
          </label>
        </div>

        <TokenGrid tokens={tokens} loading={loading} onSelect={setSelectedToken} />

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-4">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="font-mono text-xs px-4 py-1.5 rounded border transition disabled:opacity-20"
              style={{ background: "var(--cjsc-card)", borderColor: "var(--cjsc-border)", color: "var(--cjsc-fg)" }}
            >
              ← PREV
            </button>
            <span className="text-xs font-mono" style={{ color: "var(--cjsc-muted)" }}>
              {filters.page} / {totalPages}
            </span>
            <button
              disabled={filters.page >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="font-mono text-xs px-4 py-1.5 rounded border transition disabled:opacity-20"
              style={{ background: "var(--cjsc-card)", borderColor: "var(--cjsc-border)", color: "var(--cjsc-fg)" }}
            >
              NEXT →
            </button>
          </div>
        )}
      </main>

      {listingToken && (
        <ListingModal tokenId={listingToken} onList={handleList} onClose={() => setListingToken(null)} />
      )}
    </div>
  );
}

function Header({ wallet }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-sm border-b" style={{ background: "var(--cjsc-bg)", borderColor: "var(--cjsc-border)" }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-tight uppercase" style={{ color: "var(--cjsc-red)" }}>CJSC</span>
          <span className="font-mono text-xs" style={{ color: "var(--cjsc-muted)" }}>//</span>
          <span className="font-display text-sm font-medium tracking-wider uppercase" style={{ color: "var(--cjsc-fg)" }}>JUNKIEMART</span>
        </div>
        <WalletConnect {...wallet} />
      </div>
    </header>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded border p-3" style={{ background: "var(--cjsc-card)", borderColor: "var(--cjsc-border)" }}>
      <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "var(--cjsc-cyan)" }}>{label}</p>
      <p className="font-display text-lg font-bold" style={{ color: color || "var(--cjsc-fg)" }}>{value}</p>
    </div>
  );
}
