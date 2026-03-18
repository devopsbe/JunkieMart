import TokenCard from "./TokenCard";

export default function TokenGrid({ tokens, loading, onSelect }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden animate-pulse">
            <div className="aspect-square bg-zinc-800" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tokens || tokens.length === 0) {
    return <p className="text-center text-zinc-500 py-12">No tokens found</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {tokens.map((t) => (
        <TokenCard key={t.token_id} token={t} onSelect={onSelect} />
      ))}
    </div>
  );
}
