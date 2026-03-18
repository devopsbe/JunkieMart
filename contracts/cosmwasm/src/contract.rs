use cosmwasm_std::{
    entry_point, to_json_binary, Addr, BankMsg, Binary, Coin, CosmosMsg, Deps, DepsMut, Env,
    MessageInfo, Order, Response, StdResult, Uint128, WasmMsg,
};
use serde::{Deserialize, Serialize};

use crate::error::ContractError;
use crate::msg::*;
use crate::state::*;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum Cw721ExecuteMsg {
    TransferNft { recipient: String, token_id: String },
}

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let config = Config {
        cw721_contract: deps.api.addr_validate(&msg.cw721_contract)?,
        admin: info.sender,
        paused: false,
        fee_bps: msg.fee_bps,
        fee_recipient: deps.api.addr_validate(&msg.fee_recipient)?,
    };
    CONFIG.save(deps.storage, &config)?;
    Ok(Response::new().add_attribute("action", "instantiate"))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::ListNft { token_id, price } => exec_list(deps, env, info, token_id, price),
        ExecuteMsg::BuyNft { token_id } => exec_buy(deps, env, info, token_id),
        ExecuteMsg::CancelListing { token_id } => exec_cancel(deps, info, token_id),
        ExecuteMsg::UpdatePrice { token_id, new_price } => exec_update_price(deps, info, token_id, new_price),
        ExecuteMsg::SetPaused { paused } => exec_set_paused(deps, info, paused),
    }
}

fn exec_list(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    token_id: String,
    price: Uint128,
) -> Result<Response, ContractError> {
    let config = CONFIG.load(deps.storage)?;
    if config.paused {
        return Err(ContractError::Paused {});
    }
    if price.is_zero() {
        return Err(ContractError::ZeroPrice {});
    }
    if LISTINGS.has(deps.storage, &token_id) {
        return Err(ContractError::AlreadyListed {});
    }

    let transfer_msg = WasmMsg::Execute {
        contract_addr: config.cw721_contract.to_string(),
        msg: to_json_binary(&Cw721ExecuteMsg::TransferNft {
            recipient: env.contract.address.to_string(),
            token_id: token_id.clone(),
        })?,
        funds: vec![],
    };

    let listing = Listing {
        token_id: token_id.clone(),
        seller: info.sender.clone(),
        price,
        listed_at: env.block.time.seconds(),
    };
    LISTINGS.save(deps.storage, &token_id, &listing)?;

    Ok(Response::new()
        .add_message(transfer_msg)
        .add_attribute("action", "list_nft")
        .add_attribute("token_id", token_id)
        .add_attribute("price", price)
        .add_attribute("seller", info.sender))
}

fn exec_buy(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    token_id: String,
) -> Result<Response, ContractError> {
    let listing = LISTINGS
        .may_load(deps.storage, &token_id)?
        .ok_or(ContractError::NotListed {})?;

    let config = CONFIG.load(deps.storage)?;

    let sent = info
        .funds
        .iter()
        .find(|c| c.denom == "usei")
        .map(|c| c.amount)
        .unwrap_or(Uint128::zero());

    if sent != listing.price {
        return Err(ContractError::WrongAmount {});
    }

    LISTINGS.remove(deps.storage, &token_id);

    let fee = listing.price.multiply_ratio(config.fee_bps, 10_000u64);
    let seller_amount = listing.price - fee;

    let transfer_nft = WasmMsg::Execute {
        contract_addr: config.cw721_contract.to_string(),
        msg: to_json_binary(&Cw721ExecuteMsg::TransferNft {
            recipient: info.sender.to_string(),
            token_id: token_id.clone(),
        })?,
        funds: vec![],
    };

    let mut msgs: Vec<CosmosMsg> = vec![transfer_nft.into()];

    msgs.push(
        BankMsg::Send {
            to_address: listing.seller.to_string(),
            amount: vec![Coin::new(seller_amount.u128(), "usei")],
        }
        .into(),
    );

    if !fee.is_zero() {
        msgs.push(
            BankMsg::Send {
                to_address: config.fee_recipient.to_string(),
                amount: vec![Coin::new(fee.u128(), "usei")],
            }
            .into(),
        );
    }

    Ok(Response::new()
        .add_messages(msgs)
        .add_attribute("action", "buy_nft")
        .add_attribute("token_id", token_id)
        .add_attribute("buyer", info.sender)
        .add_attribute("price", listing.price))
}

fn exec_cancel(
    deps: DepsMut,
    info: MessageInfo,
    token_id: String,
) -> Result<Response, ContractError> {
    let listing = LISTINGS
        .may_load(deps.storage, &token_id)?
        .ok_or(ContractError::NotListed {})?;

    if listing.seller != info.sender {
        return Err(ContractError::Unauthorized {});
    }

    let config = CONFIG.load(deps.storage)?;
    LISTINGS.remove(deps.storage, &token_id);

    let transfer_nft = WasmMsg::Execute {
        contract_addr: config.cw721_contract.to_string(),
        msg: to_json_binary(&Cw721ExecuteMsg::TransferNft {
            recipient: info.sender.to_string(),
            token_id: token_id.clone(),
        })?,
        funds: vec![],
    };

    Ok(Response::new()
        .add_message(transfer_nft)
        .add_attribute("action", "cancel_listing")
        .add_attribute("token_id", token_id))
}

fn exec_update_price(
    deps: DepsMut,
    info: MessageInfo,
    token_id: String,
    new_price: Uint128,
) -> Result<Response, ContractError> {
    if new_price.is_zero() {
        return Err(ContractError::ZeroPrice {});
    }

    let mut listing = LISTINGS
        .may_load(deps.storage, &token_id)?
        .ok_or(ContractError::NotListed {})?;

    if listing.seller != info.sender {
        return Err(ContractError::Unauthorized {});
    }

    listing.price = new_price;
    LISTINGS.save(deps.storage, &token_id, &listing)?;

    Ok(Response::new()
        .add_attribute("action", "update_price")
        .add_attribute("token_id", token_id)
        .add_attribute("new_price", new_price))
}

fn exec_set_paused(
    deps: DepsMut,
    info: MessageInfo,
    paused: bool,
) -> Result<Response, ContractError> {
    let mut config = CONFIG.load(deps.storage)?;
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }
    config.paused = paused;
    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("action", "set_paused")
        .add_attribute("paused", paused.to_string()))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Listing { token_id } => {
            let listing = LISTINGS.may_load(deps.storage, &token_id)?;
            to_json_binary(&ListingResponse { listing })
        }
        QueryMsg::AllListings { start_after, limit } => {
            let limit = limit.unwrap_or(30).min(100) as usize;
            let start = start_after.as_deref().map(cosmwasm_std::Bound::exclusive);
            let listings: Vec<Listing> = LISTINGS
                .range(deps.storage, start, None, Order::Ascending)
                .take(limit)
                .map(|item| item.map(|(_, v)| v))
                .collect::<StdResult<_>>()?;
            to_json_binary(&AllListingsResponse { listings })
        }
        QueryMsg::ListingsByOwner { owner } => {
            let owner_addr = deps.api.addr_validate(&owner)?;
            let listings: Vec<Listing> = LISTINGS
                .range(deps.storage, None, None, Order::Ascending)
                .filter_map(|item| {
                    item.ok().and_then(|(_, v)| {
                        if v.seller == owner_addr { Some(v) } else { None }
                    })
                })
                .collect();
            to_json_binary(&AllListingsResponse { listings })
        }
        QueryMsg::Config {} => {
            let config = CONFIG.load(deps.storage)?;
            to_json_binary(&ConfigResponse { config })
        }
    }
}
