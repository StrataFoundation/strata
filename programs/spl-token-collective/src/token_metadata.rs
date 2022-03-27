use anchor_lang::prelude::*;
use anchor_lang::solana_program::account_info::AccountInfo;
use anchor_lang::{context::CpiContext, solana_program, Accounts};
use mpl_token_metadata::state::DataV2;
use mpl_token_metadata::utils::try_from_slice_checked;
use std::io::Write;
use std::ops::Deref;

pub use mpl_token_metadata::ID;

#[derive(Clone)]
pub struct Metadata(mpl_token_metadata::state::Metadata);

impl Deref for Metadata {
  type Target = mpl_token_metadata::state::Metadata;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl anchor_lang::AccountDeserialize for Metadata {
  fn try_deserialize(buf: &mut &[u8]) -> Result<Self> {
    Metadata::try_deserialize_unchecked(buf)
  }

  fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self> {
    try_from_slice_checked(
      buf,
      mpl_token_metadata::state::Key::MetadataV1,
      mpl_token_metadata::state::MAX_METADATA_LEN,
    )
    .map(Metadata)
    .map_err(|e| e.into())
  }
}

impl anchor_lang::AccountSerialize for Metadata {
  fn try_serialize<W: Write>(&self, _writer: &mut W) -> Result<()> {
    // no-op
    Ok(())
  }
}

impl anchor_lang::Owner for Metadata {
  fn owner() -> Pubkey {
    ID
  }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateMetadataAccountArgs {
  /// The name of the asset
  pub name: String,
  /// The symbol for the asset
  pub symbol: String,
  /// URI pointing to JSON representing the asset
  pub uri: String,
}

#[derive(Accounts)]
pub struct UpdateMetadataAccount<'info> {
  /// CHECK: Checked with cpi
  pub token_metadata: AccountInfo<'info>,
  /// CHECK: Checked with cpi
  pub update_authority: AccountInfo<'info>,
  /// CHECK: Checked with cpi
  pub new_update_authority: AccountInfo<'info>,
}

pub fn update_metadata_account_v2<'a, 'b, 'c, 'info>(
  ctx: CpiContext<'a, 'b, 'c, 'info, UpdateMetadataAccount<'info>>,
  args: UpdateMetadataAccountArgs,
) -> Result<()> {
  let ix = mpl_token_metadata::instruction::update_metadata_accounts_v2(
    mpl_token_metadata::ID,
    *ctx.accounts.token_metadata.key,
    *ctx.accounts.update_authority.key,
    Some(*ctx.accounts.new_update_authority.key),
    Some(DataV2 {
      name: args.name,
      symbol: args.symbol,
      uri: args.uri,
      seller_fee_basis_points: 0,
      creators: None,
      collection: None,
      uses: None,
    }),
    None,
    None,
  );

  solana_program::program::invoke_signed(
    &ix,
    &[
      ctx.accounts.token_metadata.clone(),
      ctx.accounts.update_authority.clone(),
      ctx.program.clone(),
    ],
    ctx.signer_seeds,
  )
  .map_err(|e| e.into())
}
