use crate::instructions::initialize_chat::arg::InitializeChatArgsV0;
/**
 * The holder of the chat certificate is able to claim admin over the chat
 */
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

#[derive(Accounts)]
#[instruction(args: InitializeChatArgsV0)]
pub struct ClaimAdminV0<'info> {
  pub chat: Box<Account<'info, ChatV0>>,
  #[account(
    constraint = owner_wallet.key() == identifier_certificate_mint_account.owner,
    constraint = identifier_certificate_mint_account.mint == chat.identifier_certificate_mint.unwrap().key(),
    constraint = identifier_certificate_mint_account.amount > 0
  )]
  pub identifier_certificate_mint_account: Box<Account<'info, TokenAccount>>,
  pub owner_wallet: Signer<'info>,
}

pub fn handler(ctx: Context<ClaimAdminV0>) -> Result<()> {
  ctx.accounts.chat.admin = Some(ctx.accounts.owner_wallet.key());

  Ok(())
}
