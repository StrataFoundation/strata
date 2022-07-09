use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct SwapCommonV0<'info> {
  #[account(mut,
    has_one = parent_storage
  )]
  pub parent_entangler: Box<Account<'info, FungibleParentEntanglerV0>>,
  #[account(mut)]
  pub parent_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut,
    has_one = parent_entangler,
    has_one = child_storage
  )]
  pub child_entangler: Box<Account<'info, FungibleChildEntanglerV0>>,
  #[account(mut)]
  pub child_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub source: Box<Account<'info, TokenAccount>>,
  pub source_authority: Signer<'info>,
  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,

  pub token_program: Program<'info, Token>,
  pub clock: Sysvar<'info, Clock>,
}
