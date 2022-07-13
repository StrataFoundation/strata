use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
  #[msg("Invalid string length, your string was likely too long")]
  InvalidStringLength,

  #[msg("You do not have enough tokens to post here")]
  PermissionDenied,

  #[msg("The string was not alphanumeric")]
  StringNotAlphanumeric,

  #[msg("The sender must either be a delegate or owner wallet")]
  IncorrectSender,

  #[msg("The permission type was invalid")]
  InvalidPermissionType,

  #[msg("The realloc increase was too large")]
  InvalidDataIncrease,
}
