use super::arg::SwapV0Args;
use crate::error::ErrorCode;
use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

pub struct SwapAmount {
  pub amount: u64,
}

pub fn swap_shared_logic(
  base: &Account<TokenAccount>,
  source: &Account<TokenAccount>,
  args: &SwapV0Args,
) -> Result<SwapAmount> {
  let amount: u64;
  let base = base;
  let source = source;

  require!(
    (args.all.is_some() && args.all == Some(true)) || args.amount.is_some(),
    ErrorCode::InvalidArgs
  );

  if args.all == Some(true) {
    amount = if source.amount > base.amount {
      base.amount
    } else {
      source.amount
    };
  } else {
    amount = args.amount.unwrap();

    require!(base.amount >= amount, ErrorCode::TokenAccountAmountTooLow);
  }

  Ok(SwapAmount { amount })
}
