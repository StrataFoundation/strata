use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct FungibleParentEntanglerV0 {
  pub parent_mint: Pubkey,
  pub parent_storage: Pubkey,
  pub go_live_unix_time: i64,
  pub freeze_swap_unix_time: Option<i64>,
  pub created_at_unix_time: i64,
  pub num_children: u32,
  pub authority: Option<Pubkey>,

  pub dynamic_seed: Vec<u8>,
  pub bump_seed: u8,
  pub storage_bump_seed: u8,
}

#[account]
#[derive(Default)]
pub struct FungibleChildEntanglerV0 {
  pub parent_entangler: Pubkey,
  pub child_mint: Pubkey,
  pub child_storage: Pubkey,
  pub go_live_unix_time: i64,
  pub freeze_swap_unix_time: Option<i64>,
  pub created_at_unix_time: i64,

  pub bump_seed: u8,
  pub storage_bump_seed: u8,
}
