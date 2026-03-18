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
  const [filters, setFilters] = useState({ listed: false, side: "", sort: "token_id", page: 1 });

  const { tokens, total, loading, refetch } = useTokens({
    listed: filters.listed || undefined,
    side: filters.side || undefined,
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
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header wallet={wallet} />
        <main className="max-w-6xl mx-auto px-4 py-6">
          <TokenDetail
            tokenId={selectedToken}
            onBack={() => setSelectedToken(null)}
            onBuy={handleBuy}
            onCancel={handleCancel}
            activeMode={wallet.activeMode}
            cosmosAddr={wallet.cosmosAddr}
            evmAddr={wallet.evmAddr}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header wallet={wallet} />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Supply" value={stats.total_supply} />
            <Stat label="Listed" value={stats.listed} />
            <Stat label="Floor" value={stats.floor_usei ? `${(stats.floor_usei / 1e6).toFixed(2)} SEI` : "—"} />
            <Stat label="Holders" value={`${stats.cosmos_holders} CW / ${stats.evm_holders} EVM`} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filters.side}
            onChange={(e) => setFilters((f) => ({ ...f, side: e.target.value, page: 1 }))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300"
          >
            <option value="">All Sides</option>
            <option value="cosmos">Cosmos</option>
            <option value="evm">EVM</option>
          </select>

          <select
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-300"
          >
            <option value="token_id">Token ID</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>

          <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.listed}
              onChange={(e) => setFilters((f) => ({ ...f, listed: e.target.checked, page: 1 }))}
              className="accent-emerald-500"
            />
            Listed only
          </label>
        </div>

        <TokenGrid tokens={tokens} loading={loading} onSelect={setSelectedToken} />

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-4">
            <button
              disabled={filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 disabled:opacity-30"
            >
              ← Prev
            </button>
            <span className="text-sm text-zinc-500">Page {filters.page} of {totalPages}</span>
            <button
              disabled={filters.page >= totalPages}
              onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              className="px-3 py-1 rounded bg-zinc-800 text-zinc-300 disabled:opacity-30"
            >
              Next →
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
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-emerald-400">V1</span> Junkies Market
        </h1>
        <WalletConnect {...wallet} />
      </div>
    </header>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  );
}
