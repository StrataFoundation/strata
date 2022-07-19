use crate::{
  error::ErrorCode,
  state::{ChatType, ChatV0},
  utils::resize_to_fit,
};
use anchor_lang::prelude::*;

use crate::instructions::initialize_chat::arg::InitializeChatArgsV0;

#[derive(Accounts)]
#[instruction(args: InitializeChatArgsV0)]
pub struct InitializeUnidentifiedChatV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  /// CHECK: This is a create or update
  #[account(
    init,
    payer = payer,
    space = std::cmp::max(8 + std::mem::size_of::<ChatV0>(), chat.data.borrow_mut().len()),
  )]
  pub chat: Box<Account<'info, ChatV0>>,
  pub system_program: Program<'info, System>,
}

pub fn handler(
  ctx: Context<InitializeUnidentifiedChatV0>,
  args: InitializeChatArgsV0,
  admin: Option<Pubkey>,
) -> Result<()> {
  require!(args.name.len() <= 100, ErrorCode::InvalidStringLength);
  require!(args.image_url.len() <= 200, ErrorCode::InvalidStringLength);
  require!(
    args.metadata_url.len() <= 200,
    ErrorCode::InvalidStringLength
  );

  ctx.accounts.chat.chat_type = ChatType::Unidentified;
  ctx.accounts.chat.name = args.name;
  ctx.accounts.chat.post_message_program_id = args.post_message_program_id;
  ctx.accounts.chat.admin = admin;
  ctx.accounts.chat.metadata_url = args.metadata_url;
  ctx.accounts.chat.image_url = args.image_url;
  ctx.accounts.chat.bump = 0;

  resize_to_fit(
    &ctx.accounts.payer.to_account_info(),
    &ctx.accounts.system_program.to_account_info(),
    &ctx.accounts.chat,
  )?;

  Ok(())
}
