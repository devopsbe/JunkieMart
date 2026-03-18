const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = process.env.DB_PATH || "./indexer.db";
const db = new Database(path.resolve(__dirname, "..", DB_PATH));

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS tokens (
    token_id        TEXT PRIMARY KEY,
    cosmos_owner    TEXT,
    evm_owner       TEXT,
    canonical_side  TEXT CHECK(canonical_side IN ('cosmos','evm')),
    evm_is_pointer  INTEGER DEFAULT 0,
    name            TEXT,
    description     TEXT,
    image           TEXT,
    attributes      TEXT,
    listing_active      INTEGER DEFAULT 0,
    listing_price_usei  TEXT,
    listed_by_cosmos    TEXT,
    listed_by_evm       TEXT,
    active_contract     TEXT CHECK(active_contract IN ('cosmwasm','evm',NULL)),
    listed_at           INTEGER,
    marketplace_contract TEXT,
    last_cosmos_tx  TEXT,
    last_evm_tx     TEXT,
    last_block      INTEGER,
    last_timestamp  INTEGER,
    indexed_at      INTEGER
  );
`);

const upsertToken = db.prepare(`
  INSERT INTO tokens (
    token_id, cosmos_owner, evm_owner, canonical_side, evm_is_pointer,
    name, description, image, attributes,
    listing_active, listing_price_usei, listed_by_cosmos, listed_by_evm,
    active_contract, listed_at, marketplace_contract,
    last_cosmos_tx, last_evm_tx, last_block, last_timestamp, indexed_at
  ) VALUES (
    @token_id, @cosmos_owner, @evm_owner, @canonical_side, @evm_is_pointer,
    @name, @description, @image, @attributes,
    @listing_active, @listing_price_usei, @listed_by_cosmos, @listed_by_evm,
    @active_contract, @listed_at, @marketplace_contract,
    @last_cosmos_tx, @last_evm_tx, @last_block, @last_timestamp, @indexed_at
  ) ON CONFLICT(token_id) DO UPDATE SET
    cosmos_owner=excluded.cosmos_owner, evm_owner=excluded.evm_owner,
    canonical_side=excluded.canonical_side, evm_is_pointer=excluded.evm_is_pointer,
    name=excluded.name, description=excluded.description, image=excluded.image,
    attributes=excluded.attributes,
    last_cosmos_tx=excluded.last_cosmos_tx, last_evm_tx=excluded.last_evm_tx,
    last_block=excluded.last_block, last_timestamp=excluded.last_timestamp,
    indexed_at=excluded.indexed_at
`);

const upsertMany = db.transaction((records) => {
  for (const r of records) upsertToken.run(r);
});

function updateListing(tokenId, listing) {
  db.prepare(`
    UPDATE tokens SET
      listing_active=@listing_active, listing_price_usei=@listing_price_usei,
      listed_by_cosmos=@listed_by_cosmos, listed_by_evm=@listed_by_evm,
      active_contract=@active_contract, listed_at=@listed_at,
      marketplace_contract=@marketplace_contract, indexed_at=@indexed_at
    WHERE token_id=@token_id
  `).run({ token_id: tokenId, ...listing, indexed_at: Date.now() });
}

function getToken(id) {
  return db.prepare("SELECT * FROM tokens WHERE token_id = ?").get(id);
}

function getTokensByOwner(address) {
  const addr = address.toLowerCase();
  return db.prepare(
    "SELECT * FROM tokens WHERE LOWER(cosmos_owner)=? OR LOWER(evm_owner)=? OR LOWER(listed_by_cosmos)=? OR LOWER(listed_by_evm)=?"
  ).all(addr, addr, addr, addr);
}

function getAllTokens({ listed, side, sort, page = 1, limit = 20 }) {
  let where = [];
  if (listed === "true") where.push("listing_active = 1");
  if (side === "cosmos" || side === "evm") where.push(`canonical_side = '${side}'`);

  const whereClause = where.length ? "WHERE " + where.join(" AND ") : "";

  let orderBy = "ORDER BY CAST(token_id AS INTEGER) ASC";
  if (sort === "price_asc") orderBy = "ORDER BY CAST(listing_price_usei AS INTEGER) ASC";
  if (sort === "price_desc") orderBy = "ORDER BY CAST(listing_price_usei AS INTEGER) DESC";

  const offset = (page - 1) * limit;
  const rows = db.prepare(
    `SELECT * FROM tokens ${whereClause} ${orderBy} LIMIT ? OFFSET ?`
  ).all(limit, offset);

  const total = db.prepare(
    `SELECT COUNT(*) as count FROM tokens ${whereClause}`
  ).get().count;

  return { tokens: rows, total, page, limit };
}

function getListings() {
  return db.prepare("SELECT * FROM tokens WHERE listing_active = 1 ORDER BY listed_at DESC").all();
}

function getListingByTokenId(tokenId) {
  return db.prepare("SELECT * FROM tokens WHERE token_id = ? AND listing_active = 1").get(tokenId);
}

function getStats() {
  const total = db.prepare("SELECT COUNT(*) as count FROM tokens").get().count;
  const listed = db.prepare("SELECT COUNT(*) as count FROM tokens WHERE listing_active = 1").get().count;

  const floor = db.prepare(
    "SELECT MIN(CAST(listing_price_usei AS INTEGER)) as floor FROM tokens WHERE listing_active = 1"
  ).get().floor;

  const cosmosHolders = db.prepare(
    "SELECT COUNT(DISTINCT cosmos_owner) as count FROM tokens WHERE cosmos_owner IS NOT NULL"
  ).get().count;
  const evmHolders = db.prepare(
    "SELECT COUNT(DISTINCT evm_owner) as count FROM tokens WHERE evm_owner IS NOT NULL AND evm_is_pointer = 0"
  ).get().count;

  return { total_supply: total, listed, floor_usei: floor, cosmos_holders: cosmosHolders, evm_holders: evmHolders };
}

module.exports = {
  db, upsertToken, upsertMany, updateListing,
  getToken, getTokensByOwner, getAllTokens,
  getListings, getListingByTokenId, getStats,
};
