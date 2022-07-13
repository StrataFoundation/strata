use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseChatV0<'info> {
  /// CHECK: Just used for sol refund
  #[account(mut)]
  pub refund: UncheckedAccount<'info>,
  #[account(
    mut,
    close = refund
  )]
  pub chat: Box<Account<'info, ChatV0>>,
  #[account(
    constraint = chat.admin.unwrap() == admin.key()
  )]
  pub admin: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn handler(_: Context<CloseChatV0>) -> Result<()> {
  Ok(())
}
