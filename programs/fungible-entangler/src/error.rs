use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
  #[msg("Invalid amount")]
  InvalidAmount,
  #[msg("Invalid Authority")]
  InvalidAuthority,
  #[msg("Cannot swap more than the token account currently has")]
  TokenAccountAmountTooLow,
  #[msg("Amount or All must be provided")]
  InvalidArgs,
  #[msg("This parent entangler is not live yet")]
  ParentNotLiveYet,
  #[msg("This child entangler is not live yet")]
  ChildNotLiveYet,
  #[msg("Swap is frozen on the parent entangler, swapping not allowed")]
  ParentSwapFrozen,
  #[msg("Swap is frozen on the child entangler, swapping not allowed")]
  ChildSwapFrozen,
  #[msg("This entangler has no authority on it")]
  NoAuthority,
}
