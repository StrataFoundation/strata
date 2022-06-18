use crate::error::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use std::convert::*;

#[derive(Accounts)]
pub struct SendTokenMessageV0<'info> {
  #[account(
    constraint = chat.post_permission_mint_or_collection == post_permission_mint.key()
  )]
  pub chat: Box<Account<'info, ChatV0>>,
  pub sender: Signer<'info>,
  pub profile: Box<Account<'info, ProfileV0>>,
  #[account(
    mut,
    constraint = post_permission_account.mint == post_permission_mint.key(),
    constraint = post_permission_account.owner == profile.owner_wallet
  )]
  pub post_permission_account: Account<'info, TokenAccount>,
  #[account(mut)]
  pub post_permission_mint: Box<Account<'info, Mint>>,
  pub identifier_certificate_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = identifier_certificate_mint_account.amount >= 1,
    constraint = profile.owner_wallet == identifier_certificate_mint_account.owner,
    constraint = identifier_certificate_mint_account.mint == identifier_certificate_mint.key(),
    constraint = identifier_certificate_mint_account.amount > 0
  )]
  pub identifier_certificate_mint_account: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct MessagePartV0 {
  pub id: String, // uuid v4
  // Content can be too large for a single tx... Indicate the total parts and the current part.
  pub total_parts: u16,
  pub current_part: u16,
  pub read_permission_amount: u64,
  pub encrypted_symmetric_key: String,
  pub content: String,
}

pub fn handler(ctx: Context<SendTokenMessageV0>, _args: MessagePartV0) -> Result<()> {
  require!(
    ctx.accounts.post_permission_account.amount >= ctx.accounts.chat.post_permission_amount,
    ErrorCode::PermissionDenied
  );

  if ctx.accounts.profile.owner_wallet != ctx.accounts.sender.key() {
    let delegate_acc = &ctx.remaining_accounts[0];
    let delegate: Account<DelegateWalletV0> = Account::try_from(delegate_acc)?;
    if delegate.delegate_wallet != ctx.accounts.sender.key() {
      return Err(error!(ErrorCode::IncorrectSender));
    }
  }

  Ok(())
}
