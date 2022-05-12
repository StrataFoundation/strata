use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
  #[msg("An account was provided that did not have the correct mint")]
  InvalidMint
}