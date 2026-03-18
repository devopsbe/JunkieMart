const express = require("express");
const cors = require("cors");
const {
  getToken, getTokensByOwner, getAllTokens,
  getListings, getListingByTokenId, getStats,
} = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/tokens", (req, res) => {
  const { listed, side, sort, page = 1, limit = 20 } = req.query;
  const result = getAllTokens({
    listed, side, sort,
    page: parseInt(page), limit: parseInt(limit),
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

module.exports = app;
