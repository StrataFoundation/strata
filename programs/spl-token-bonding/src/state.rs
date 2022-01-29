use anchor_lang::prelude::*;

use crate::arg::PiecewiseCurve;

#[account]
#[derive(Default)]
pub struct ProgramStateV0 {
  pub wrapped_sol_mint: Pubkey,
  pub sol_storage: Pubkey,
  pub mint_authority_bump_seed: u8,
  pub sol_storage_bump_seed: u8,
  pub bump_seed: u8,
}

#[account]
#[derive(Default)]
pub struct CurveV0 {
  pub definition: PiecewiseCurve,
}

#[account]
#[derive(Default)]
pub struct TokenBondingV0 {
  pub base_mint: Pubkey,
  pub target_mint: Pubkey,
  pub general_authority: Option<Pubkey>,
  pub reserve_authority: Option<Pubkey>,
  pub curve_authority: Option<Pubkey>,
  pub base_storage: Pubkey,
  pub buy_base_royalties: Pubkey,
  pub buy_target_royalties: Pubkey,
  pub sell_base_royalties: Pubkey,
  pub sell_target_royalties: Pubkey,
  /// Percentage of purchases that go to royalties
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub buy_base_royalty_percentage: u32,
  pub buy_target_royalty_percentage: u32,
  pub sell_base_royalty_percentage: u32,
  pub sell_target_royalty_percentage: u32,
  /// The bonding curve to use
  pub curve: Pubkey,
  pub mint_cap: Option<u64>,
  pub purchase_cap: Option<u64>,
  pub go_live_unix_time: i64,
  pub freeze_buy_unix_time: Option<i64>,
  pub created_at_unix_time: i64,
  pub buy_frozen: bool,
  pub sell_frozen: bool,

  // Needed to derive the PDA of this instance
  pub index: u16,
  pub bump_seed: u8,
  pub base_storage_bump_seed: u8,
  pub target_mint_authority_bump_seed: u8,
  pub base_storage_authority_bump_seed: Option<u8>,

  // Keep track of what the reserves should have if all txns came from bonding
  // This is used for sell frozen bonding curves, where we do not adapt the price based
  // on the actual reserves.
  pub reserve_balance_from_bonding: u64
}
