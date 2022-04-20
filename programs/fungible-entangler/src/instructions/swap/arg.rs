use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SwapV0Args {
  pub amount: u64,
  pub all: bool, // if true swap all and closes tokenacct
}