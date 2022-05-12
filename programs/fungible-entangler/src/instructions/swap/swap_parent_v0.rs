use super::{
  account::*,
  arg::SwapV0Args
};
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct SwapParentV0<'info> {
  pub common: SwapV0<'info>,
}

pub fn handler(ctx: Context<SwapParentV0>, args: SwapV0Args) -> Result<()> {

  Ok(())
}