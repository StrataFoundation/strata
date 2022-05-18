use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SwapV0Args {
  pub amount: Option<u64>,
  pub all: Option<bool>, // if true swap all and closes tokenacct
}
