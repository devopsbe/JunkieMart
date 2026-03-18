require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const app = require("./api");
const { fullReindex } = require("./reconcile");

const PORT = process.env.PORT || 3001;
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS) || 300000;

async function startPolling() {
  console.log("[indexer] Running initial full re-index...");
  try {
    const count = await fullReindex();
    console.log(`[indexer] Initial index complete: ${count} tokens`);
  } catch (e) {
    console.error("[indexer] Initial index failed:", e.message);
  }

  setInterval(async () => {
    try {
      await fullReindex();
    } catch (e) {
      console.error("[indexer] Poll cycle failed:", e.message);
    }
  }, POLL_INTERVAL);
}

app.listen(PORT, () => {
  console.log(`[indexer] API server running on http://localhost:${PORT}`);
  startPolling();
});
