use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Marketplace is paused")]
    Paused {},

    #[error("Token not listed")]
    NotListed {},

    #[error("Token already listed")]
    AlreadyListed {},

    #[error("Insufficient funds")]
    InsufficientFunds {},

    #[error("Wrong amount sent")]
    WrongAmount {},

    #[error("Price must be greater than zero")]
    ZeroPrice {},

    #[error("Fee basis points too high (max 1000)")]
    FeeTooHigh {},

    #[error("Must send exactly one coin of denom usei")]
    InvalidFunds {},
}
