use anchor_lang::prelude::{ProgramError, Pubkey};
use anchor_lang::solana_program::program_pack::Pack;
use anchor_lang::{Accounts, CpiContext};
use std::io::Write;
use std::ops::Deref;

pub use spl_name_service::ID;

#[derive(Clone)]
pub struct NameRecordHeader(spl_name_service::state::NameRecordHeader);

impl Deref for NameRecordHeader {
  type Target = spl_name_service::state::NameRecordHeader;

  fn deref(&self) -> &Self::Target {
      &self.0
  }
}

impl anchor_lang::AccountDeserialize for NameRecordHeader {
  fn try_deserialize(buf: &mut &[u8]) -> Result<Self, ProgramError> {
      NameRecordHeader::try_deserialize_unchecked(buf)
  }

  fn try_deserialize_unchecked(buf: &mut &[u8]) -> Result<Self, ProgramError> {
    spl_name_service::state::NameRecordHeader::unpack_from_slice(buf).map(NameRecordHeader)
  }
}

impl anchor_lang::AccountSerialize for NameRecordHeader {
  fn try_serialize<W: Write>(&self, _writer: &mut W) -> Result<(), ProgramError> {
      // no-op
      Ok(())
  }
}

impl anchor_lang::Owner for NameRecordHeader {
  fn owner() -> Pubkey {
      ID
  }
}
