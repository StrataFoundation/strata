use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};

#[derive(Accounts)]
pub struct SwapV0<'info> {
  pub entangler: Box<Account<'info, FungibleEntanglerV0>>,
}