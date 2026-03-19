require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const app = require("./api");
const { fullReindex, quickSync } = require("./reconcile");

const PORT = process.env.PORT || 3001;
const FAST_POLL_MS = parseInt(process.env.FAST_POLL_MS) || 15000;
const SLOW_POLL_MS = parseInt(process.env.POLL_INTERVAL_MS) || 600000;

async function startPolling() {
  console.log("[indexer] Running initial full re-index...");
  try {
    const count = await fullReindex();
    console.log(`[indexer] Initial index complete: ${count} tokens`);
  } catch (e) {
    console.error("[indexer] Initial index failed:", e.message);
  }

  console.log(`[indexer] Fast sync every ${FAST_POLL_MS / 1000}s, full reindex every ${SLOW_POLL_MS / 1000}s`);

  setInterval(async () => {
    try { await quickSync(); }
    catch (e) { console.error("[indexer] Quick sync failed:", e.message); }
  }, FAST_POLL_MS);

  setInterval(async () => {
    try { await fullReindex(); }
    catch (e) { console.error("[indexer] Full reindex failed:", e.message); }
  }, SLOW_POLL_MS);
}

app.listen(PORT, () => {
  console.log(`[indexer] API server running on http://localhost:${PORT}`);
  startPolling();
});
