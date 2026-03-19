const express = require("express");
const cors = require("cors");
const {
  getToken, getTokensByOwner, getAllTokens,
  getListings, getListingByTokenId, getStats,
} = require("./db");
const { quickSync } = require("./reconcile");

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean);
if (ALLOWED_ORIGINS.length === 0) {
  ALLOWED_ORIGINS.push(
    "https://junkiemart.xyz",
    "https://www.junkiemart.xyz",
    "https://jumkiemart.lovable.app",
    "http://localhost:5173"
  );
}

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

app.get("/api/tokens", (req, res) => {
  const { listed, side, sort, page = 1, limit = 20 } = req.query;
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 20));
  const result = getAllTokens({
    listed, side, sort,
    page: safePage, limit: safeLimit,
  });
  res.json(result);
});

app.get("/api/tokens/:id", (req, res) => {
  const token = getToken(req.params.id);
  if (!token) return res.status(404).json({ error: "Token not found" });
  res.json(token);
});

app.get("/api/tokens/owner/:address", (req, res) => {
  const tokens = getTokensByOwner(req.params.address);
  res.json({ tokens, count: tokens.length });
});

app.get("/api/listings", (_req, res) => {
  res.json({ listings: getListings() });
});

app.get("/api/listings/:token_id", (req, res) => {
  const listing = getListingByTokenId(req.params.token_id);
  if (!listing) return res.status(404).json({ error: "No active listing" });
  res.json(listing);
});

app.get("/api/stats", (_req, res) => {
  res.json(getStats());
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

let lastSyncAt = 0;
app.post("/api/sync", async (_req, res) => {
  if (Date.now() - lastSyncAt < 3000) {
    return res.json({ status: "debounced", changes: 0 });
  }
  lastSyncAt = Date.now();
  try {
    const changes = await quickSync();
    res.json({ status: "ok", changes });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});

module.exports = app;
