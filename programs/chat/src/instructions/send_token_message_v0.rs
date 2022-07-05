use crate::error::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};
use mpl_token_metadata::state::Metadata;
use std::convert::*;
use std::str::FromStr;

#[derive(Accounts)]
pub struct SendTokenMessageV0<'info> {
  pub chat: Box<Account<'info, ChatV0>>,
  /// CHECK: Either delegate wallet passed into additional accounts or this is a signer
  pub sender: UncheckedAccount<'info>,
  pub signer: Signer<'info>, // Wallet signing for this transaction, may be the same as sender. May be a delegate
  #[account(
    mut,
    constraint = post_permission_account.mint == post_permission_mint.key(),
    // constraint = post_permission_account.owner == profile.owner_wallet
  )]
  pub post_permission_account: Account<'info, TokenAccount>,
  #[account(mut)]
  pub post_permission_mint: Box<Account<'info, Mint>>,
  pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum MessageType {
  Text,
  Html,
  Gify,
  Image,
  React, // An emoji react to another message
}

impl Default for MessageType {
  fn default() -> Self {
    MessageType::Text
  }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct MessagePartV0 {
  pub id: String, // uuid v4
  // Content can be too large for a single tx... Indicate the total parts and the current part.
  pub total_parts: u16,
  pub current_part: u16,
  pub read_permission_amount: u64,
  pub encrypted_symmetric_key: String,
  pub content: String,
  pub condition_version: u8,
  pub message_type: MessageType,
  pub reference_message_id: Option<String>,
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
  if ctx.accounts.chat.post_permission_key == ctx.accounts.post_permission_mint.key()
    && ctx.accounts.post_permission_account.amount >= ctx.accounts.chat.post_permission_amount
  {
    return Ok(());
  }

  // 1 optional account is expected, a metadata account
  let metadata_info = next_account_info(remaining_accs)?;

  let metadata = assert_valid_metadata(metadata_info, ctx.accounts.post_permission_mint.key())?;
  let collection = metadata.collection.unwrap();
  if ctx.accounts.chat.post_permission_key == collection.key && collection.verified {
    return Ok(());
  }

  Err(error!(ErrorCode::PermissionDenied))
}

pub fn handler(ctx: Context<SendTokenMessageV0>, _args: MessagePartV0) -> Result<()> {
  assert_meets_permissions(&ctx)?;

  let rm_acc_length = ctx.remaining_accounts.len();
  let has_delegate = match ctx.accounts.chat.post_permission_type {
    PermissionType::Token => rm_acc_length == 1,
    PermissionType::NFT => rm_acc_length == 2,
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

  Ok(())
}
