use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount};
use crate::{error::ErrorCode, util::*};

use super::{account::SwapCommonV0, arg::SwapV0Args};
pub struct SwapAmount {
  pub amount: u64,
}

pub fn swap_shared_logic(base: &Box<Account<TokenAccount>>, source: &Box<Account<TokenAccount>>, args: &SwapV0Args) -> Result<SwapAmount> {
  let amount: u64;
  let base = base;
  let source = source;

  require!(
    (args.all.is_some() && args.all == Some(true)) || args.amount.is_some(),
    ErrorCode::InvalidArgs
  );

  if args.all == Some(true)  {
    amount = if source.amount > base.amount { base.amount } else { source.amount };
  } else {
    amount = args.amount.clone().unwrap();

    require!(
      base.amount >= amount,
      ErrorCode::TokenAccountAmountTooLow
    );
  }

  Ok(SwapAmount {
    amount
  })
}