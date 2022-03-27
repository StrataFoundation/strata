use anchor_lang::prelude::*;

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

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum PrimitiveCurve {
  // All u128s are fixed precision decimal with 12 decimal places. So 1 would be 1_000_000_000_000. 1.5 is 1_500_000_000_000

  // c(x^(pow/frac)) + b.
  // Constant product = pow = 1, frac = 1, b = 0
  // Fixed price = pow = 0, frac = 1, c = 0, b = price
  ExponentialCurveV0 {
    c: u128, // Constant multiplied by the curve formula. Used to set initial price, but gets cancelled out as more is injected into the reserves
    b: u128, // Constant added to the curve formula. Used to set initial price, but gets cancelled out as more is injected into the reserves
    pow: u8,
    frac: u8,
  },
  // c(x^(k_0 - ((k_0 - k_1) ((t_0 - t) / i)^d)
  // t_0 = go live date
  // t = current time
  // i = interval
  // (t_0 - t) / i <= 1
  TimeDecayExponentialCurveV0 {
    c: u128,
    k1: u128,
    k0: u128,
    interval: u32,
    d: u128,
  },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum PiecewiseCurve {
  TimeV0 { curves: Vec<TimeCurveV0> },
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TimeCurveV0 {
  pub offset: i64,
  pub curve: PrimitiveCurve,
  pub buy_transition_fees: Option<TransitionFeeV0>,
  pub sell_transition_fees: Option<TransitionFeeV0>,
}

// A fee that slowly decreases over the course of interval. This is used to prevent botting when curves change
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct TransitionFeeV0 {
  pub percentage: u32,
  pub interval: u32,
}

impl Default for PrimitiveCurve {
  fn default() -> Self {
    PrimitiveCurve::ExponentialCurveV0 {
      c: 1,
      b: 0,
      pow: 1,  // 1
      frac: 1, // 1
    }
  }
}

impl Default for PiecewiseCurve {
  fn default() -> Self {
    PiecewiseCurve::TimeV0 {
      curves: vec![TimeCurveV0 {
        offset: 0,
        curve: PrimitiveCurve::ExponentialCurveV0 {
          c: 1,
          b: 0,
          pow: 1,  // 1
          frac: 1, // 1
        },
        buy_transition_fees: None,
        sell_transition_fees: None,
      }],
    }
  }
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
  pub reserve_balance_from_bonding: u64,
  pub supply_from_bonding: u64,

  /** Whether or not to ignore changes to base storage and target supply outside of the curve */
  pub ignore_external_reserve_changes: bool,
  pub ignore_external_supply_changes: bool,
}
