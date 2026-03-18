import { useState, useEffect, useCallback } from "react";

export function useWallet() {
  const [cosmosAddr, setCosmosAddr] = useState(null);
  const [evmAddr, setEvmAddr] = useState(null);
  const [activeMode, setActiveMode] = useState(null);

  const connectCosmos = useCallback(async () => {
    if (!window.compass) {
      alert("Please install Compass wallet for Sei");
      return;
    }
    try {
      await window.compass.enable("pacific-1");
      const offlineSigner = await window.compass.getOfflineSignerAuto("pacific-1");
      const accounts = await offlineSigner.getAccounts();
      if (accounts.length > 0) {
        setCosmosAddr(accounts[0].address);
        setActiveMode("cosmos");
      }
    } catch (e) {
      console.error("Cosmos connect failed:", e);
    }
  }, []);

  const connectEvm = useCallback(async () => {
    if (!window.compassEvm) {
      alert("Please install Compass wallet for Sei");
      return;
    }
    try {
      const accounts = await window.compassEvm.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        setEvmAddr(accounts[0]);
        setActiveMode("evm");
      }
    } catch (e) {
      console.error("EVM connect failed:", e);
    }
  }, []);

  const disconnect = useCallback(() => {
    setCosmosAddr(null);
    setEvmAddr(null);
    setActiveMode(null);
  }, []);

  useEffect(() => {
    if (window.compassEvm) {
      window.compassEvm.on?.("accountsChanged", (accounts) => {
        if (accounts.length === 0) {
          setEvmAddr(null);
          if (activeMode === "evm") setActiveMode(cosmosAddr ? "cosmos" : null);
        } else {
          setEvmAddr(accounts[0]);
        }
      });
    }
  }, [activeMode, cosmosAddr]);

  return { cosmosAddr, evmAddr, activeMode, connectCosmos, connectEvm, disconnect };
}
