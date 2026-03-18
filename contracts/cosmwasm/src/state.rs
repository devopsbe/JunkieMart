use cosmwasm_std::{Addr, Uint128};
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub cw721_contract: Addr,
    pub admin: Addr,
    pub paused: bool,
    pub fee_bps: u64,
    pub fee_recipient: Addr,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Listing {
    pub token_id: String,
    pub seller: Addr,
    pub price: Uint128,
    pub listed_at: u64,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const LISTINGS: Map<&str, Listing> = Map::new("listings");
