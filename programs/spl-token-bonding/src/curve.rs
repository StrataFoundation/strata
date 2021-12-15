use crate::{
  arg::{PiecewiseCurve, PrimitiveCurve},
  precise_number::{InnerUint, PreciseNumber, ONE_PREC, ZERO_PREC},
};
use anchor_lang::{solana_program::log::sol_log_compute_units};
use std::convert::*;

pub trait Curve {
  fn price(
    &self,
    time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    amount: &PreciseNumber,
    sell: bool,
    root_estimates: Option<[u128; 2]>,
  ) -> Option<PreciseNumber>;
  fn expected_target_amount(
    &self,
    time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    reserve_change: &PreciseNumber,
    root_estimates: Option<[u128; 2]>,
  ) -> Option<PreciseNumber>;
}

impl Curve for PrimitiveCurve {
  fn expected_target_amount(
    &self,
    _time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    reserve_change: &PreciseNumber,
    root_estimates: Option<[u128; 2]>,
  ) -> Option<PreciseNumber> {
    let guess1 = PreciseNumber {
      value: InnerUint::from(root_estimates.unwrap()[0]) * 1_000_000_000_000_u64,
    };
    let guess2 = PreciseNumber {
      value: InnerUint::from(root_estimates.unwrap()[1]) * 1_000_000_000_000_u64,
    };

    if base_amount.eq(&ZERO_PREC) || target_supply.eq(&ZERO_PREC) {
      match *self {
        // b dS + (c dS^(1 + pow/frac))/(1 + pow/frac)
        PrimitiveCurve::ExponentialCurveV0 { pow, frac, b, c } => {
          let b_prec = PreciseNumber {
            value: InnerUint::from(b) * 1_000_000_000_000_u64,
          };
          let c_prec = PreciseNumber {
            value: InnerUint::from(c) * 1_000_000_000_000_u64,
          };
          if b == 0 && c != 0 {
            /*
             * (((1 + k) dR)/c)^(1/(1 + k))
             */
            let pow_prec = PreciseNumber::new(u128::try_from(pow).ok()?)?;
            let frac_prec = PreciseNumber::new(u128::try_from(frac).ok()?)?;
            let one_plus_k = &ONE_PREC.checked_add(&pow_prec.checked_div(&frac_prec)?)?;
            one_plus_k
              .checked_mul(reserve_change)?
              .checked_div(&c_prec)?
              .pow_frac_approximation(frac, frac + pow, guess1)
          } else if c == 0 {
            reserve_change.checked_div(&b_prec)
          } else {
            None // This math is too hard, have not implemented yet.
          }
        }
      }
    } else {
      match *self {
        PrimitiveCurve::ExponentialCurveV0 { pow, frac, b, c } => {
          let one_plus_k_numerator = frac.checked_add(pow)?;
          if b == 0 && c != 0 {
            /*
            dS = -S + ((S^(1 + k) (R + dR))/R)^(1/(1 + k))
            */
            target_supply
              .pow_frac_approximation(one_plus_k_numerator, frac, guess1)?
              .checked_mul(&base_amount.checked_add(reserve_change)?)?
              .checked_div(base_amount)?
              .pow_frac_approximation(frac, frac + pow, guess2)?
              .checked_sub(target_supply)
          } else if c == 0 {
            /*
             * dS = S dR / R
             */
            target_supply
              .checked_mul(reserve_change)?
              .checked_div(base_amount)
          } else {
            None // This math is too hard, have not implemented yet.
          }
        }
      }
    }
  }

  fn price(
    &self,
    _time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    amount: &PreciseNumber,
    sell: bool,
    root_estimates: Option<[u128; 2]>,
  ) -> Option<PreciseNumber> {
    let guess1 = PreciseNumber {
      value: InnerUint::from(root_estimates.unwrap()[0]) * 1_000_000_000_000_u64,
    };
    let guess2 = PreciseNumber {
      value: InnerUint::from(root_estimates.unwrap()[1]) * 1_000_000_000_000_u64,
    };

    if base_amount.eq(&ZERO_PREC) || target_supply.eq(&ZERO_PREC) {
      match *self {
        // b dS + (c dS^(1 + pow/frac))/(1 + pow/frac)
        PrimitiveCurve::ExponentialCurveV0 { pow, frac, c, b } => {
          let b_prec = PreciseNumber {
            value: InnerUint::from(b) * 1_000_000_000_000_u64,
          };
          let c_prec = PreciseNumber {
            value: InnerUint::from(c) * 1_000_000_000_000_u64,
          };
          let one_plus_k_numerator = frac.checked_add(pow)?;
          let pow_prec = PreciseNumber::new(u128::try_from(pow).ok()?)?;
          let frac_prec = PreciseNumber::new(u128::try_from(frac).ok()?)?;
          b_prec.checked_mul(amount)?.checked_add(
            &c_prec
              .checked_mul(&amount.pow_frac_approximation(one_plus_k_numerator, frac, guess1)?)?
              .checked_div(&ONE_PREC.checked_add(&pow_prec.checked_div(&frac_prec)?)?)?,
          )
        }
      }
    } else {
      match *self {
        PrimitiveCurve::ExponentialCurveV0 { pow, frac, c, b } => {
          if b == 0 && c != 0 {
            /*
              (R / S^(1 + k)) ((S + dS)^(1 + k) - S^(1 + k))
            */
            let one_plus_k_numerator = frac.checked_add(pow)?;
            let s_plus_ds = if sell {
              target_supply.checked_sub(amount)?
            } else {
              target_supply.checked_add(amount)?
            };

            let s_k1 = &target_supply.pow_frac_approximation(one_plus_k_numerator, frac, guess1)?;
            let s_plus_ds_k1 =
              s_plus_ds.pow_frac_approximation(one_plus_k_numerator, frac, guess2)?;

            // PreciseNumbers cannot be negative. If we're selling, S + dS is less than S.
            // Swap the two around. This will invert the sine of this function, but since sell = true they are expecting a positive number
            let right_paren_value = if sell {
              s_k1.checked_sub(&s_plus_ds_k1)?
            } else {
              s_plus_ds_k1.checked_sub(s_k1)?
            };

            sol_log_compute_units();
            base_amount
              .checked_div(s_k1)?
              .checked_mul(&right_paren_value)
          } else if c == 0 {
            // R dS / S
            base_amount
              .checked_mul(amount)?
              .checked_div(target_supply)
          } else {
            None // Math is too hard, haven't implemented yet
          }
        }
      }
    }
  }
}

impl Curve for PiecewiseCurve {
  fn price(
    &self,
    time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    amount: &PreciseNumber,
    sell: bool,
    root_estimates: Option<[u128; 2]>,
  ) -> Option<PreciseNumber> {
    match self {
      PiecewiseCurve::TimeV0 { curves } => curves
        .iter()
        .rev()
        .find(|c| c.offset <= time_offset)?
        .curve
        .price(
          time_offset,
          base_amount,
          target_supply,
          amount,
          sell,
          root_estimates,
        ),
    }
  }

  fn expected_target_amount(
    &self,
    time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    reserve_change: &PreciseNumber,
    root_estimates: Option<[u128; 2]>,
  ) -> Option<PreciseNumber> {
    match self {
      PiecewiseCurve::TimeV0 { curves } => curves
        .iter()
        .rev()
        .find(|c| c.offset <= time_offset)?
        .curve
        .expected_target_amount(
          time_offset,
          base_amount,
          target_supply,
          reserve_change,
          root_estimates,
        ),
    }
  }
}
