// File has weird name because https://github.com/project-serum/anchor/issues/1499
// TODO: Rename to arg.rs
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TransferReservesV0Args {
  pub amount: u64,
}
