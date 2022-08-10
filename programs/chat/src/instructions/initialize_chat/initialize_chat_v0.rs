use crate::instructions::initialize_chat::arg::InitializeChatArgsV0;
use crate::state::*;
use crate::{error::ErrorCode, utils::resize_to_fit};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use namespaces::state::Entry;

#[derive(Accounts)]
#[instruction(args: InitializeChatArgsV0)]
pub struct InitializeChatV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    init_if_needed,
    payer = payer,
    space = std::cmp::max(8 + std::mem::size_of::<ChatV0>(), chat.data.borrow_mut().len()),
    seeds = ["identified-chat".as_bytes(), identifier_certificate_mint.key().as_ref()],
    bump,
  )]
  pub chat: Box<Account<'info, ChatV0>>,
  pub namespaces: Box<Account<'info, NamespacesV0>>,
  #[account(
    constraint = entry.mint == identifier_certificate_mint.key(),
    constraint = namespaces.chat_namespace == entry.namespace
  )]
  pub entry: Box<Account<'info, Entry>>,
  pub identifier_certificate_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = owner_wallet.key() == identifier_certificate_mint_account.owner,
    constraint = identifier_certificate_mint_account.mint == identifier_certificate_mint.key(),
    constraint = identifier_certificate_mint_account.amount > 0
  )]
  pub identifier_certificate_mint_account: Box<Account<'info, TokenAccount>>,
  pub owner_wallet: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeChatV0>, args: InitializeChatArgsV0) -> Result<()> {
  require!(args.name.len() <= 100, ErrorCode::InvalidStringLength);
  require!(args.image_url.len() <= 200, ErrorCode::InvalidStringLength);
  require!(
    args.metadata_url.len() <= 200,
    ErrorCode::InvalidStringLength
  );

  ctx.accounts.chat.chat_type = ChatType::Identified;
  ctx.accounts.chat.name = args.name;
  ctx.accounts.chat.post_message_program_id = args.post_message_program_id;
  ctx.accounts.chat.admin = Some(ctx.accounts.owner_wallet.key());
  ctx.accounts.chat.identifier_certificate_mint =
    Some(ctx.accounts.identifier_certificate_mint.key());
  ctx.accounts.chat.metadata_url = args.metadata_url;
  ctx.accounts.chat.image_url = args.image_url;
  ctx.accounts.chat.bump = *ctx.bumps.get("chat").unwrap();

  resize_to_fit(
    &ctx.accounts.payer.to_account_info(),
    &ctx.accounts.system_program.to_account_info(),
    &ctx.accounts.chat,
  )?;

  Ok(())
}
