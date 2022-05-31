use anchor_lang::prelude::*;
use crate::error::ErrorCode;
use crate::state::*;
use crate::utils::puffed_out_string;

pub const CHAT_SIZE: usize = 1 + // key
  32 + // admin
  32 + // post_permission_mint
  32 + // read_permission_mint
  8 + // post_permission_amount
  8 + // default_read_permission_amount
  1 + // post_permission_action
  33 + // pay_destination
  100 + // name hard 100 bytes limit
  200 + // image hard 200 bytes limit
  200 + // metadata hard 200 bytes limit
  80; // Some padding

#[derive(Accounts)]
#[instruction(args: InitializeChatArgsV0)]
pub struct InitializeChatV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    init,
    payer = payer,
    space = CHAT_SIZE,
    seeds = ["chat".as_bytes(), &puffed_out_string(&args.identifier, 32).as_bytes()],
    bump,
  )]
  pub chat: Box<Account<'info, ChatV0>>,
  pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeChatArgsV0 {
  pub admin: Pubkey,
  pub post_permission_mint: Pubkey,
  pub read_permission_mint: Pubkey, // Not used by program since blockchain is public, enforced by lit protocol
  pub post_permission_amount: u64,
  pub default_read_permission_amount: u64,
  pub post_permission_action: PostAction,
  pub post_pay_destination: Option<Pubkey>,
  pub identifier: String,
  pub name: String,
  pub image_url: String,
  pub metadata_url: String,
}

pub fn handler(
  ctx: Context<InitializeChatV0>,
  args: InitializeChatArgsV0,
) -> Result<()> {
  require!(args.identifier.len() <= 32, ErrorCode::InvalidStringLength);
  require!(args.name.len() <= 100, ErrorCode::InvalidStringLength);
  require!(args.image_url.len() <= 200, ErrorCode::InvalidStringLength);
  require!(args.metadata_url.len() <= 200, ErrorCode::InvalidStringLength);
  require!(args.identifier.chars().all(char::is_alphanumeric), ErrorCode::StringNotAlphanumeric);

  ctx.accounts.chat.admin = args.admin;
  ctx.accounts.chat.post_permission_mint = args.post_permission_mint;
  ctx.accounts.chat.post_permission_amount = args.post_permission_amount;
  ctx.accounts.chat.post_permission_action = args.post_permission_action;
  ctx.accounts.chat.post_pay_destination = args.post_pay_destination;
  ctx.accounts.chat.read_permission_mint = args.read_permission_mint;
  ctx.accounts.chat.default_read_permission_amount = args.default_read_permission_amount;
  ctx.accounts.chat.name = puffed_out_string(&args.name, 100);
  ctx.accounts.chat.identifier = puffed_out_string(&args.identifier, 32);
  ctx.accounts.chat.metadata_url = puffed_out_string(&args.metadata_url, 200);
  ctx.accounts.chat.image_url = puffed_out_string(&args.image_url, 200);
  ctx.accounts.chat.bump = *ctx.bumps.get("chat").unwrap();
  
  Ok(())
}
