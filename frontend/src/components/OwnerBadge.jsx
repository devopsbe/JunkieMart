export default function OwnerBadge({ side }) {
  if (side === "cosmos") {
    return <span title="Cosmos-native" className="inline-flex items-center gap-1 text-xs font-medium text-purple-400">◈ Cosmos</span>;
  }
  return <span title="EVM-claimed" className="inline-flex items-center gap-1 text-xs font-medium text-blue-400">Ξ EVM</span>;
}
