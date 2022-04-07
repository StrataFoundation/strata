use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
  #[msg("Provided account does not have an authority")]
  NoAuthority,

  #[msg("The bump provided did not match the canonical bump")]
  InvalidBump,

  #[msg("Invalid authority passed")]
  InvalidAuthority,

  #[msg("Bonding curve had invalid settings to join this collective")]
  InvalidTokenBondingSettings,

  #[msg("Bonding curve had invalid royalties accounts to join this collective")]
  InvalidTokenBondingRoyalties,

  #[msg("Unclaimed token had invalid metadata settings to join this collective")]
  InvalidTokenMetadataSettings,

  #[msg("Incorrect owner on account")]
  IncorrectOwner,

  #[msg("Token is not on a bonding curve")]
  NoBonding,

  #[msg("Invalid collective")]
  InvalidCollective,

  #[msg("Invalid name authority passed")]
  InvalidNameAuthority,

  #[msg(
    "Unclaimed tokens cannot have a go live date in the future. They must be immediately live."
  )]
  UnclaimedNotLive,

  #[msg("Invalid go live date for prelaunch")]
  InvalidGoLive,

  #[msg("Account discriminator mismatch")]
  AccountDiscriminatorMismatch,
}
