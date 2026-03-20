import { useState, useEffect, useCallback, useRef } from "react";

export function useWallet() {
  const [cosmosAddr, setCosmosAddr] = useState(null);
  const [evmAddr, setEvmAddr] = useState(null);
  const [activeMode, setActiveMode] = useState(null);
  const cosmosRef = useRef(null);
  cosmosRef.current = cosmosAddr;

  /** One click: unified Sei / Compass — Cosmos + EVM session together */
  const connectWallet = useCallback(async () => {
    if (!window.compass && !window.compassEvm) {
      alert("Please install Compass wallet for Sei");
      return;
    }
    let cosmos = null;
    let evm = null;
    if (window.compass) {
      try {
        await window.compass.enable("pacific-1");
        const offlineSigner = await window.compass.getOfflineSignerAuto("pacific-1");
        const accounts = await offlineSigner.getAccounts();
        if (accounts.length > 0) cosmos = accounts[0].address;
      } catch (e) {
        console.error("Cosmos connect failed:", e);
      }
    }
    if (window.compassEvm) {
      try {
        const accounts = await window.compassEvm.request({ method: "eth_requestAccounts" });
        if (accounts.length > 0) evm = accounts[0];
      } catch (e) {
        console.error("EVM connect failed:", e);
      }
    }
    setCosmosAddr(cosmos);
    setEvmAddr(evm);
    if (cosmos) setActiveMode("cosmos");
    else if (evm) setActiveMode("evm");
    else setActiveMode(null);
  }, []);

  const disconnect = useCallback(() => {
    setCosmosAddr(null);
    setEvmAddr(null);
    setActiveMode(null);
  }, []);

  useEffect(() => {
    if (!window.compassEvm?.on) return;
    const handler = (accounts) => {
      if (accounts.length === 0) {
        setEvmAddr(null);
        setActiveMode((m) => (m === "evm" ? (cosmosRef.current ? "cosmos" : null) : m));
      } else {
        setEvmAddr(accounts[0]);
      }
    };
    window.compassEvm.on("accountsChanged", handler);
    return () => window.compassEvm.removeListener?.("accountsChanged", handler);
  }, []);

  return { cosmosAddr, evmAddr, activeMode, setActiveMode, connectWallet, disconnect };
}
