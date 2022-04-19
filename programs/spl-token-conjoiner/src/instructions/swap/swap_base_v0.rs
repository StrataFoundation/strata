use super::{
  account::*,
  arg::SwapArgs  
};
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct SwapBaseV0<'info> {
  pub common: SwapV0<'info>,
}

pub fn handler(ctx: Context<SwapBaseV0>, args: SwapV0Args) -> Result<()> {
  Ok(())
}