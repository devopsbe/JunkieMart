import TokenCard from "./TokenCard";

export default function TokenGrid({ tokens, loading, onSelect }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="rounded overflow-hidden animate-pulse border" style={{ background: "var(--cjsc-card)", borderColor: "var(--cjsc-border)" }}>
            <div className="aspect-square" style={{ background: "var(--cjsc-bg)" }} />
            <div className="p-3 space-y-2">
              <div className="h-4 rounded w-3/4" style={{ background: "var(--cjsc-border)" }} />
              <div className="h-3 rounded w-1/2" style={{ background: "var(--cjsc-border)" }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!tokens || tokens.length === 0) {
    return <p className="text-center font-mono text-sm py-12" style={{ color: "var(--cjsc-muted)" }}>NO TOKENS FOUND</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {tokens.map((t) => (
        <TokenCard key={t.token_id} token={t} onSelect={onSelect} />
      ))}
    </div>
  );
}
