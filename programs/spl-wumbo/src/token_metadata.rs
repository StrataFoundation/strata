use anchor_lang::prelude::{AnchorSerialize, AnchorDeserialize, ProgramError, ProgramResult, Pubkey};
use anchor_lang::{Accounts, CpiContext, solana_program};
use anchor_lang::solana_program::account_info::AccountInfo;
use spl_token_metadata::state::Data;
use spl_token_metadata::utils::try_from_slice_checked;
use std::io::Write;
use std::ops::Deref;

pub use spl_token_metadata::ID;

#[derive(Clone)]
pub struct Metadata(spl_token_metadata::state::Metadata);

impl Deref for Metadata {
  type Target = spl_token_metadata::state::Metadata;

  fn deref(&self) -> &Self::Target {
      &self.0
  }
}

impl anchor_lang::AccountDeserialize for Metadata {
  fn try_deserialize(buf: &mut &[u8]) -> Result<Self, ProgramError> {
      Metadata::try_deserialize_unchecked(buf)
  }

  fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self, ProgramError> {
    try_from_slice_checked(buf, spl_token_metadata::state::Key::MetadataV1, spl_token_metadata::state::MAX_METADATA_LEN).map(Metadata)
  }
}

impl anchor_lang::AccountSerialize for Metadata {
  fn try_serialize<W: Write>(&self, _writer: &mut W) -> Result<(), ProgramError> {
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
  pub token_metadata: AccountInfo<'info>,
  pub update_authority: AccountInfo<'info>,
}

pub fn update_metadata_account<'a, 'b, 'c, 'info>(
  ctx: CpiContext<'a, 'b, 'c, 'info, UpdateMetadataAccount<'info>>,
  args: UpdateMetadataAccountArgs,
) -> ProgramResult {
  let ix = spl_token_metadata::instruction::update_metadata_accounts(
    spl_token_metadata::ID,
    *ctx.accounts.token_metadata.key,
    *ctx.accounts.update_authority.key,
    None,
    Some(Data {
      name: args.name,
      symbol: args.symbol,
      uri: args.uri,
      seller_fee_basis_points: 0,
      creators: None
    }),
    None
  );

  solana_program::program::invoke_signed(
      &ix,
      &[
        ctx.accounts.token_metadata.clone(),
        ctx.accounts.update_authority.clone(),
        ctx.program.clone()
      ],
      ctx.signer_seeds,
  )
}
