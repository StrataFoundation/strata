use crate::arg::{PiecewiseCurve, TimeCurveV0};
use crate::precise_number::{InnerUint, ONE, ONE_PREC, PreciseNumber, one};
use crate::error::ErrorCode;
use crate::PrimitiveCurve;
use anchor_lang::{prelude::*};
use anchor_spl::token::Mint;


pub trait OrArithError {
  fn or_arith_error(self) -> Result<PreciseNumber, ProgramError>;
}

impl OrArithError for Option<PreciseNumber> {
  fn or_arith_error(self) -> Result<PreciseNumber, ProgramError> {
    self.ok_or(ErrorCode::ArithmeticError.into())
  }
}

pub fn get_percent(percent: u32) -> Result<PreciseNumber, ProgramError> {
  let max_u32 = PreciseNumber::new(u32::MAX as u128).or_arith_error()?;
  let percent_prec = PreciseNumber::new(percent as u128).or_arith_error()?;

  Ok(percent_prec.checked_div(&max_u32).or_arith_error()?)
}

pub fn precise_supply(mint: &Account<Mint>) -> PreciseNumber {
  precise_supply_amt(mint.supply, mint)
}

fn get_pow_10(decimals: u8) -> PreciseNumber {
  match decimals {
    0 => PreciseNumber::new(1),
    1 => PreciseNumber::new(10),
    2 => PreciseNumber::new(100),
    3 => PreciseNumber::new(1000),
    4 => PreciseNumber::new(10000),
    5 => PreciseNumber::new(100000),
    6 => PreciseNumber::new(1000000),
    7 => PreciseNumber::new(10000000),
    8 => PreciseNumber::new(100000000),
    9 => PreciseNumber::new(1000000000),
    10 => PreciseNumber::new(10000000000),
    11 => PreciseNumber::new(100000000000),
    12 => PreciseNumber::new(1000000000000),
    _ => unreachable!()
  }.unwrap()
}

fn get_u128_pow_10(decimals: u8) -> u128 {
  match decimals {
    0 => 1,
    1 => 10,
    2 => 100,
    3 => 1000,
    4 => 10000,
    5 => 100000,
    6 => 1000000,
    7 => 10000000,
    8 => 100000000,
    9 => 1000000000,
    10 => 10000000000,
    11 => 100000000000,
    12 => 1000000000000,
    _ => unreachable!()
  }
}

pub fn precise_supply_amt(amt: u64, mint: &Account<Mint>) -> PreciseNumber {
  PreciseNumber {
    value: InnerUint::from(amt).checked_mul(InnerUint::from(get_u128_pow_10(12_u8 - mint.decimals))).unwrap().checked_mul(InnerUint::from(1_000_000_000_000u64)).unwrap()
  }
}

pub fn to_mint_amount(amt: &PreciseNumber, mint: &Account<Mint>, ceil: bool) -> u64 {
  // Lookup is faster than a checked_pow
  let pow_10 = get_pow_10(mint.decimals);

  let pre_round = amt.checked_mul(
    &pow_10
  ).unwrap();
  let post_round = if ceil {
    pre_round.ceiling().unwrap()
  } else {
    pre_round.floor().unwrap()
  };
  
  post_round.to_imprecise().unwrap() as u64
}


pub fn primitive_curve_is_valid(curve: &PrimitiveCurve) -> bool {
  match curve {
    &PrimitiveCurve::ExponentialCurveV0 { frac, c, b, pow } =>
      frac > 0 && ((b == 0 && c != 0) || c == 0)
  }
}

pub fn curve_is_valid(curve: &PiecewiseCurve) -> bool {
  match curve {
    PiecewiseCurve::TimeV0 { curves } =>
      // All inner curves are valid
      curves.iter().all(|c| primitive_curve_is_valid(&c.curve) && c.offset >= 0) &&
        // The first curve starts at time 0
        curves.get(0).map(|c| c.offset).unwrap_or(1) == 0 && 
        // The curves list is ordered by offset
        curves.windows(2).all(|c| c[0].offset <= c[1].offset)
  }
}
