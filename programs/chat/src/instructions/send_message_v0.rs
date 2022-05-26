use anchor_lang::prelude::*;
use crate::state::*;
use crate::error::ErrorCode;
use anchor_spl::token::{TokenAccount, Token, Mint};

#[derive(Accounts)]
pub struct SendMessageV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    has_one = post_permission_mint
  )]
  pub chat: Box<Account<'info, ChatV0>>,
  pub sender: Signer<'info>,
  #[account(
    constraint = profile.owner_wallet == sender.key() || profile.delegate_wallet == sender.key()
  )]
  pub profile: Box<Account<'info, ProfileV0>>,
  #[account(
    mut,
    constraint = post_permission_account.mint == post_permission_mint.key(),
    constraint = post_permission_account.owner == profile.owner_wallet
  )]
  pub post_permission_account: Account<'info, TokenAccount>,
  #[account(mut)]
  pub post_permission_mint: Box<Account<'info, Mint>>,
  pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct MessageV0 {
  pub id: String, // uuid
  pub encrypted_symmetric_key: String,
  pub access_control_conditions: String, // encoded json
  pub content: String,
  pub next_id: Option<String>
}

pub fn handler(
  ctx: Context<SendMessageV0>,
  _args: MessageV0,
) -> Result<()> {
  require!(ctx.accounts.post_permission_account.amount >= ctx.accounts.chat.post_permission_amount, ErrorCode::PermissionDenied);

  Ok(())
}
