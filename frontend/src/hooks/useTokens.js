import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

export function useTokens({ listed, side, sort, page = 1, limit = 20 } = {}) {
  const [data, setData] = useState({ tokens: [], total: 0, page: 1, limit: 20 });
  const [loading, setLoading] = useState(true);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (listed) params.set("listed", "true");
    if (side) params.set("side", side);
    if (sort) params.set("sort", sort);
    params.set("page", page);
    params.set("limit", limit);

    try {
      const res = await fetch(`${API}/tokens?${params}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error("Failed to fetch tokens:", e);
    } finally {
      setLoading(false);
    }
  }, [listed, side, sort, page, limit]);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  return { ...data, loading, refetch: fetchTokens };
}

export function useToken(id) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${API}/tokens/${id}`)
      .then((r) => r.json())
      .then(setToken)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  return { token, loading };
}

export function useStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API}/stats`)
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  return stats;
}
