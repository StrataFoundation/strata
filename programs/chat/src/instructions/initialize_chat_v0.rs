use crate::error::ErrorCode;
use crate::state::*;
use crate::utils::puffed_out_string;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use namespaces::state::Entry;

#[derive(Accounts)]
#[instruction(args: InitializeChatArgsV0)]
pub struct InitializeChatV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    init,
    payer = payer,
    space = CHAT_SIZE,
    seeds = ["chat".as_bytes(), identifier_certificate_mint.key().as_ref()],
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeChatArgsV0 {
  pub post_permission_mint_or_collection: Pubkey,
  pub read_permission_mint_or_collection: Pubkey,
  pub post_permission_amount: u64,
  pub default_read_permission_amount: u64,
  pub post_permission_action: PostAction,
  pub post_pay_destination: Option<Pubkey>,
  pub name: String,
  pub image_url: String,
  pub metadata_url: String,
}

pub fn handler(ctx: Context<InitializeChatV0>, args: InitializeChatArgsV0) -> Result<()> {
  require!(args.name.len() <= 100, ErrorCode::InvalidStringLength);
  require!(args.image_url.len() <= 200, ErrorCode::InvalidStringLength);
  require!(
    args.metadata_url.len() <= 200,
    ErrorCode::InvalidStringLength
  );
  // require!(args.identifier.chars().all(char::is_alphanumeric), ErrorCode::StringNotAlphanumeric);

  ctx.accounts.chat.post_permission_mint_or_collection = args.post_permission_mint_or_collection;
  ctx.accounts.chat.post_permission_amount = args.post_permission_amount;
  ctx.accounts.chat.post_permission_action = args.post_permission_action;
  ctx.accounts.chat.post_pay_destination = args.post_pay_destination;
  ctx.accounts.chat.read_permission_mint_or_collection = args.read_permission_mint_or_collection;
  ctx.accounts.chat.default_read_permission_amount = args.default_read_permission_amount;
  ctx.accounts.chat.name = puffed_out_string(&args.name, 100);
  ctx.accounts.chat.identifier_certificate_mint = ctx.accounts.identifier_certificate_mint.key();
  ctx.accounts.chat.metadata_url = puffed_out_string(&args.metadata_url, 200);
  ctx.accounts.chat.image_url = puffed_out_string(&args.image_url, 200);
  ctx.accounts.chat.bump = *ctx.bumps.get("chat").unwrap();

  Ok(())
}