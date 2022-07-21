use crate::error::ErrorCode;
use crate::instructions::send_message::message::*;
use crate::state::*;
use anchor_lang::prelude::*;
use spl_token::native_mint;
use std::convert::*;

#[derive(Accounts)]
pub struct SendNativeMessageV0<'info> {
  pub chat: Box<Account<'info, ChatV0>>,
  #[account(
    has_one = chat,
    constraint = chat_permissions.post_permission_key == native_mint::id()
  )]
  pub chat_permissions: Box<Account<'info, ChatPermissionsV0>>,
  /// CHECK: Either delegate wallet passed into additional accounts or this is a signer
  #[account(
    constraint = **sender.lamports.borrow() >= chat_permissions.post_permission_amount
  )]
  pub sender: UncheckedAccount<'info>,
  pub signer: Signer<'info>, // Wallet signing for this transaction, may be the same as sender. May be a delegate
}

pub fn handler(ctx: Context<SendNativeMessageV0>, message: MessagePartV0) -> Result<()> {
  let rm_acc_length = ctx.remaining_accounts.len();
  let has_delegate = match ctx.accounts.chat_permissions.post_permission_type {
    PermissionType::Native => rm_acc_length == 1,
    _ => return Err(error!(ErrorCode::InvalidPermissionType)),
  };
  if has_delegate {
    let rm_acc_length = &ctx.remaining_accounts.len();
    let delegate_acc = &ctx.remaining_accounts[rm_acc_length - 1]; // delegate wallet is always the last optional account
    let delegate: Account<DelegateWalletV0> = Account::try_from(delegate_acc)?;
    if delegate.delegate_wallet != ctx.accounts.signer.key()
      || delegate.owner_wallet != ctx.accounts.sender.key()
    {
      return Err(error!(ErrorCode::IncorrectSender));
    }
  } else if ctx.accounts.signer.key() != ctx.accounts.sender.key() {
    return Err(error!(ErrorCode::IncorrectSender));
  }

  emit!(MessagePartEventV0 {
    chat: ctx.accounts.chat.key(),
    sender: ctx.accounts.sender.key(),
    signer: ctx.accounts.signer.key(),
    message
  });

  Ok(())
}
