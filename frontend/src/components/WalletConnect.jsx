function shorten(addr) {
  if (!addr) return "";
  return addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
}

export default function WalletConnect({ cosmosAddr, evmAddr, activeMode, setActiveMode, connectWallet, disconnect }) {
  const connected = Boolean(cosmosAddr || evmAddr);

  if (!connected) {
    return (
      <button
        type="button"
        onClick={connectWallet}
        className="px-4 py-1.5 rounded text-xs font-display font-bold uppercase tracking-wider text-white transition hover:brightness-110"
        style={{ background: "var(--cjsc-red)" }}
      >
        Connect
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex rounded overflow-hidden border" style={{ borderColor: "var(--cjsc-border)" }}>
        {cosmosAddr && (
          <button
            type="button"
            onClick={() => setActiveMode("cosmos")}
            title="Cosmos path (listings / buys on CW)"
            className={`px-2.5 py-1.5 text-xs font-mono transition ${evmAddr ? "border-r" : ""}`}
            style={{
              background: activeMode === "cosmos" ? "var(--cjsc-red)" : "var(--cjsc-card)",
              borderColor: "var(--cjsc-border)",
              color: activeMode === "cosmos" ? "#fff" : "var(--cjsc-muted)",
            }}
          >
            ◈ {shorten(cosmosAddr)}
          </button>
        )}
        {evmAddr && (
          <button
            type="button"
            onClick={() => setActiveMode("evm")}
            title="EVM path (listings / buys on EVM)"
            className="px-2.5 py-1.5 text-xs font-mono transition"
            style={{
              background: activeMode === "evm" ? "var(--cjsc-cyan)" : "var(--cjsc-card)",
              color: activeMode === "evm" ? "var(--cjsc-bg)" : "var(--cjsc-muted)",
            }}
          >
            Ξ {shorten(evmAddr)}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={disconnect}
        className="px-2 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider border transition hover:opacity-90"
        style={{ background: "var(--cjsc-card)", borderColor: "var(--cjsc-border)", color: "var(--cjsc-muted)" }}
        title="Disconnect"
      >
        Out
      </button>
    </div>
  );
}
