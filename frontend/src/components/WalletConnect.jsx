function shorten(addr) {
  if (!addr) return "";
  return addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
}

export default function WalletConnect({ cosmosAddr, evmAddr, activeMode, connectCosmos, connectEvm, disconnect }) {
  return (
    <div className="flex items-center gap-3">
      {cosmosAddr ? (
        <button
          onClick={disconnect}
          className={`px-3 py-1.5 rounded-lg text-sm font-mono transition ${
            activeMode === "cosmos" ? "bg-purple-600 text-white" : "bg-zinc-800 text-zinc-400"
          }`}
        >
          ◈ {shorten(cosmosAddr)}
        </button>
      ) : (
        <button onClick={connectCosmos} className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 hover:bg-purple-600 hover:text-white transition">
          Connect Cosmos
        </button>
      )}

      {evmAddr ? (
        <button
          onClick={disconnect}
          className={`px-3 py-1.5 rounded-lg text-sm font-mono transition ${
            activeMode === "evm" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400"
          }`}
        >
          Ξ {shorten(evmAddr)}
        </button>
      ) : (
        <button onClick={connectEvm} className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 text-zinc-300 hover:bg-blue-600 hover:text-white transition">
          Connect EVM
        </button>
      )}
    </div>
  );
}
