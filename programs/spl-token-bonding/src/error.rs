use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
  #[msg("Target mint must have an authority")]
  NoMintAuthority,

  #[msg("Target mint must have an authority that is a pda of this program")]
  InvalidMintAuthority,

  #[msg("Invalid base storage authority pda or seed did not match canonical seed for base storage authority")]
  InvalidBaseStorageAuthority,

  #[msg("Token bonding does not have an authority")]
  NoAuthority,

  #[msg("Error in precise number arithmetic")]
  ArithmeticError,

  #[msg("Buy price was higher than the maximum buy price. Try increasing max_price or slippage configuration")]
  PriceTooHigh,

  #[msg("Sell price was lower than the minimum sell price. Try decreasing min_price or increasing slippage configuration")]
  PriceTooLow,

  #[msg("Cannot sell more than the target mint currently has in supply")]
  MintSupplyTooLow,

  #[msg("Sell is not enabled on this bonding curve")]
  SellDisabled,

  #[msg("This bonding curve is not live yet")]
  NotLiveYet,

  #[msg("Passed the mint cap")]
  PassedMintCap,

  #[msg("Cannot purchase that many tokens because of purchase cap")]
  OverPurchaseCap,

  #[msg("Buy is frozen on this bonding curve, purchases not allowed")]
  BuyFrozen,

  #[msg("Use token bonding wrapped sol via buy_wrapped_sol, sell_wrapped_sol commands. We may one day provide liquid staking rewards on this stored sol.")]
  WrappedSolNotAllowed,

  #[msg("The provided curve is invalid")]
  InvalidCurve,

  #[msg("An account was provided that did not have the correct mint")]
  InvalidMint,

  #[msg("Ignoring external changes is only supported on v1 of buy and sell endpoints. Please upgrade your client")]
  IgnoreExternalV1Only,

  #[msg("Cannot pad token bonding without ignoring external reserve and supply changes. This is an advanced feature, incorrect use could lead to insufficient resreves to cover sells")]
  InvalidPad,
}
