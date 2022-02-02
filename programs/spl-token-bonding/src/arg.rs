use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeTokenBondingV0Args {
  /// Percentage of purchases that go to the founder
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub buy_base_royalty_percentage: u32,
  pub buy_target_royalty_percentage: u32,
  pub sell_base_royalty_percentage: u32,
  pub sell_target_royalty_percentage: u32,
  pub go_live_unix_time: i64,
  pub freeze_buy_unix_time: Option<i64>, // Cut this bonding curve off at some time
  // The maximum number of target tokens that can be minted.
  pub mint_cap: Option<u64>,
  // The maximum target tokens per purchase
  pub purchase_cap: Option<u64>,
  pub general_authority: Option<Pubkey>,
  pub reserve_authority: Option<Pubkey>,
  pub curve_authority: Option<Pubkey>,
  pub buy_frozen: bool,
  pub index: u16, // A given target mint can have multiple curves associated with it. Index 0 is reserved for the primary curve that holds mint authority
  pub bump_seed: u8,

  pub sell_frozen: bool,

  /** Whether or not to ignore changes to base storage and target supply outside of the curve */
  pub ignore_external_reserve_changes: bool,
  pub ignore_external_supply_changes: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TransferReservesV0Args {
  pub amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateTokenBondingV0Args {
  pub general_authority: Option<Pubkey>,
  /// Percentage of purchases that go to the founder
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub buy_base_royalty_percentage: u32,
  pub buy_target_royalty_percentage: u32,
  pub sell_base_royalty_percentage: u32,
  pub sell_target_royalty_percentage: u32,
  pub buy_frozen: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BuyWithBaseV0Args {
  pub base_amount: u64,
  pub minimum_target_amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BuyTargetAmountV0Args {
  // Number to purchase. This is including the decimal value. So 1 is the lowest possible fraction of a coin
  // Note that you will receive this amount, less target_royalties.
  // Target royalties are taken out of the total purchased amount. Base royalties inflate the purchase price.
  pub target_amount: u64,
  // Maximum price to pay for this amount. Allows users to account and fail-fast for slippage.
  pub maximum_price: u64,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BuyV0Args {
  pub buy_with_base: Option<BuyWithBaseV0Args>,
  pub buy_target_amount: Option<BuyTargetAmountV0Args>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SellV0Args {
  // Number to sell. This is including the decimal value. So 1 is the lowest possible fraction of a coin
  pub target_amount: u64,
  // Minimum price to receive for this amount. Allows users to account and fail-fast for slippage.
  pub minimum_price: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeSolStorageV0Args {
  pub mint_authority_bump_seed: u8,
  pub sol_storage_bump_seed: u8,
  pub bump_seed: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BuyWrappedSolV0Args {
  pub amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SellWrappedSolV0Args {
  pub amount: u64,
  pub all: bool, // Optional flag to just sell all of it.
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateCurveV0Args {
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
