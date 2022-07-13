use crate::state::*;
use crate::utils::resize_to_fit;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(args: InitializeChatPermissionsArgsV0)]
pub struct InitializeChatPermissionsV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    constraint = chat.admin.unwrap() == admin.key()
  )]
  pub chat: Box<Account<'info, ChatV0>>,
  #[account(
    init_if_needed,
    payer = payer,
    space = std::cmp::max(8 + std::mem::size_of::<ChatV0>(), chat_permissions.data.borrow_mut().len()),
    seeds = ["permissions".as_bytes(), chat.key().as_ref()],
    bump,
  )]
  pub chat_permissions: Box<Account<'info, ChatPermissionsV0>>,
  pub admin: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeChatPermissionsArgsV0 {
  pub post_permission_key: Pubkey,
  pub read_permission_key: Pubkey,
  pub post_permission_amount: u64,
  pub default_read_permission_amount: u64,
  pub post_permission_action: PostAction,
  pub post_permission_type: PermissionType,
  pub read_permission_type: PermissionType,
  pub post_pay_destination: Option<Pubkey>,
}

pub fn handler(
  ctx: Context<InitializeChatPermissionsV0>,
  args: InitializeChatPermissionsArgsV0,
) -> Result<()> {
  ctx.accounts.chat_permissions.post_permission_key = args.post_permission_key;
  ctx.accounts.chat_permissions.post_permission_amount = args.post_permission_amount;
  ctx.accounts.chat_permissions.post_permission_action = args.post_permission_action;
  ctx.accounts.chat_permissions.post_pay_destination = args.post_pay_destination;
  ctx.accounts.chat_permissions.read_permission_key = args.read_permission_key;
  ctx.accounts.chat_permissions.default_read_permission_amount =
    args.default_read_permission_amount;
  ctx.accounts.chat_permissions.bump = *ctx.bumps.get("chat_permissions").unwrap();
  ctx.accounts.chat_permissions.post_permission_type = args.post_permission_type;
  ctx.accounts.chat_permissions.read_permission_type = args.read_permission_type;
  ctx.accounts.chat_permissions.chat = ctx.accounts.chat.key();

  resize_to_fit(
    &ctx.accounts.payer.to_account_info(),
    &ctx.accounts.system_program.to_account_info(),
    &ctx.accounts.chat_permissions,
  )?;

  Ok(())
}
