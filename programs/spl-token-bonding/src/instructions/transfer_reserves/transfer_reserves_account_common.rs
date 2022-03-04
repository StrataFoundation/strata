// File has weird name because https://github.com/project-serum/anchor/issues/1499
// TODO: Rename to account.rs
use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct TransferReservesV0Common<'info> {
  #[account(
    mut,
    constraint = token_bonding.reserve_authority.ok_or(error!(ErrorCode::NoAuthority))? == reserve_authority.key(),
    has_one = base_mint,
    has_one = base_storage
  )]
  pub token_bonding: Account<'info, TokenBondingV0>,
  pub reserve_authority: Signer<'info>,
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
}
