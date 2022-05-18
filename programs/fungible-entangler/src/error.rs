use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
  #[msg("Invalid amount")]
  InvalidAmount,
  #[msg("Cannot swap more than the token account currently has")]
  TokenAccountAmountTooLow,
  #[msg("Amount or All must be provided")]
  InvalidArgs,
}
