// File has weird name because https://github.com/project-serum/anchor/issues/1499
// TODO: Rename to account.rs
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct SellCommonV0<'info> {
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint,
    has_one = base_storage,
    has_one = curve,
    has_one = sell_base_royalties,
    has_one = sell_target_royalties,
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub curve: Box<Account<'info, CurveV0>>,
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  /// CHECK: Token account could have been closed. Royalties are not sent if the account has been closed, but we also don't want to fail to parse here
  pub sell_base_royalties: AccountInfo<'info>,
  #[account(mut)]
  pub source: Box<Account<'info, TokenAccount>>,
  pub source_authority: Signer<'info>,
  #[account(mut)]
  /// CHECK: Token account could have been closed. Royalties are not sent if the account has been closed, but we also don't want to fail to parse here
  pub sell_target_royalties: AccountInfo<'info>,
  pub token_program: Program<'info, Token>,
  pub clock: Sysvar<'info, Clock>,
}
