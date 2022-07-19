use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseChatPermissionsV0<'info> {
  /// CHECK: Just get the refunded sol
  #[account(mut)]
  pub refund: UncheckedAccount<'info>,
  #[account(
    constraint = chat.admin.unwrap() == admin.key()
  )]
  pub chat: Box<Account<'info, ChatV0>>,
  #[account(
    mut,
    close = refund,
    has_one = chat
  )]
  pub chat_permissions: Box<Account<'info, ChatPermissionsV0>>,
  pub admin: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn handler(_: Context<CloseChatPermissionsV0>) -> Result<()> {
  Ok(())
}
