use super::{
  account::*,
  arg::SwapV0Args  
};
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct SwapChildV0<'info> {
  pub common: SwapV0<'info>,
  #[account(mut)]
  pub source: Box<Account<'info, TokenAccount>>,
  pub source_authority: Signer<'info>,
}

pub fn handler(ctx: Context<SwapChildV0>, args: SwapV0Args) -> Result<()> {
  // TODO
  Ok(())
}