use crate::error::ErrorCode;
use crate::instructions::send_message::message::*;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use mpl_token_metadata::state::Metadata;
use std::convert::*;
use std::str::FromStr;

#[derive(Accounts)]
pub struct SendTokenMessageV0<'info> {
  pub chat: Box<Account<'info, ChatV0>>,
  #[account(
    has_one = chat
  )]
  pub chat_permissions: Box<Account<'info, ChatPermissionsV0>>,
  pub signer: Signer<'info>, // Wallet signing for this transaction, may be the same as sender. May be a delegate
  #[account(
    mut,
    constraint = post_permission_account.mint == post_permission_mint.key(),
  )]
  pub post_permission_account: Account<'info, TokenAccount>,
  #[account(mut)]
  pub post_permission_mint: Box<Account<'info, Mint>>,
  pub token_program: Program<'info, Token>,
}

pub fn assert_valid_metadata(
  metadata_info: &AccountInfo,
  mint: Pubkey,
) -> core::result::Result<Metadata, ProgramError> {
  let metadata_program = Pubkey::from_str("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s").unwrap();

  // 1 verify the owner of the account is metaplex's metadata program
  assert_eq!(metadata_info.owner, &metadata_program);

  // 2 verify the PDA seeds match
  let seed = &[
    b"metadata".as_ref(),
    metadata_program.as_ref(),
    mint.as_ref(),
  ];

  let (metadata_addr, _bump) = Pubkey::find_program_address(seed, &metadata_program);
  assert_eq!(metadata_addr, metadata_info.key());

  Metadata::from_account_info(metadata_info)
}

pub fn assert_meets_permissions(ctx: &Context<SendTokenMessageV0>) -> Result<()> {
  let remaining_accs = &mut ctx.remaining_accounts.iter();

  // attempt to verify the token holding
  if ctx.accounts.chat_permissions.post_permission_key == ctx.accounts.post_permission_mint.key()
    && ctx.accounts.post_permission_account.amount
      >= ctx.accounts.chat_permissions.post_permission_amount
  {
    return Ok(());
  }

  // 1 optional account is expected, a metadata account
  let metadata_info = next_account_info(remaining_accs)?;

  let metadata = assert_valid_metadata(metadata_info, ctx.accounts.post_permission_mint.key())?;
  let collection = metadata.collection.unwrap();
  if ctx.accounts.chat_permissions.post_permission_key == collection.key && collection.verified {
    return Ok(());
  }

  Err(error!(ErrorCode::PermissionDenied))
}

pub fn handler(ctx: Context<SendTokenMessageV0>, message: MessagePartV0) -> Result<()> {
  assert_meets_permissions(&ctx)?;

  let rm_acc_length = ctx.remaining_accounts.len();
  let has_delegate = match ctx.accounts.chat_permissions.post_permission_type {
    PermissionType::Token => rm_acc_length == 1,
    PermissionType::NFT => rm_acc_length == 2,
    _ => return Err(error!(ErrorCode::InvalidPermissionType)),
  };
  let mut sender = ctx.accounts.signer.key();
  if has_delegate {
    let rm_acc_length = &ctx.remaining_accounts.len();
    let delegate_acc = &ctx.remaining_accounts[rm_acc_length - 1]; // delegate wallet is always the last optional account
    let delegate: Account<DelegateWalletV0> = Account::try_from(delegate_acc)?;
    if delegate.delegate_wallet != ctx.accounts.signer.key() {
      return Err(error!(ErrorCode::IncorrectSender));
    }

    if !(ctx.accounts.post_permission_account.owner == ctx.accounts.signer.key()
      || ctx.accounts.post_permission_account.owner == delegate.owner_wallet.key())
    {
      return Err(error!(ErrorCode::PermissionDenied));
    }
    sender = delegate.owner_wallet;
  }

  emit!(MessagePartEventV0 {
    chat: ctx.accounts.chat.key(),
    sender,
    signer: ctx.accounts.signer.key(),
    message
  });

  Ok(())
}
