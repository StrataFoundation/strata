use anchor_lang::prelude::*;

#[accounts]
#[derive(Default)]
pub struct FungibleEntanglerV0 {
  pub base_mint: Pubkey,
  pub target_mint: Pubkey,
  pub base_storage: Pubkey,
  pub target_storage: Pubkey,
  pub go_live_unix_time: i64,
  pub freeze_swap_base_unix_time: Option<i64>,
  pub freeze_swap_target_unix_time: Option<i64>,
  pub created_at_unix_time: i64,

  // Needed to derive the PDA of this instance
  pub index: u16,
  pub bump_seed: u8,
  pub base_storage_bump_seed: u8,
  pub target_storage_bump_seed: u8,
}