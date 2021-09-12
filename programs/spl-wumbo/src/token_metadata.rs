use anchor_lang::prelude::{ProgramError, Pubkey};
use anchor_lang::{Accounts, CpiContext};
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
