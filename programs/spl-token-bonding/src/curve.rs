use crate::{
  arg::{PiecewiseCurve, PrimitiveCurve, TimeCurveV0},
  precise_number::{InnerUint, PreciseNumber, ONE_PREC, ZERO_PREC},
  util::get_percent,
};
use std::convert::*;

pub trait Curve {
  fn price(
    &self,
    time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    amount: &PreciseNumber,
    sell: bool,
  ) -> Option<PreciseNumber>;
  fn expected_target_amount(
    &self,
    time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    reserve_change: &PreciseNumber,
  ) -> Option<PreciseNumber>;
}

impl Curve for PrimitiveCurve {
  fn expected_target_amount(
    &self,
    _time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    reserve_change: &PreciseNumber,
  ) -> Option<PreciseNumber> {
    if base_amount.eq(&ZERO_PREC) || target_supply.eq(&ZERO_PREC) {
      match *self {
        // b dS + (c dS^(1 + pow/frac))/(1 + pow/frac)
        PrimitiveCurve::ExponentialCurveV0 { pow, frac, b, c } => {
          let b_prec = PreciseNumber {
            value: InnerUint::from(b) * 1_000_000_u64,
          };
          let c_prec = PreciseNumber {
            value: InnerUint::from(c) * 1_000_000_u64,
          };
          if b == 0 && c != 0 {
            /*
             * (((1 + k) dR)/c)^(1/(1 + k))
             */
            let pow_prec = PreciseNumber::new(u128::try_from(pow).ok()?)?;
            let frac_prec = PreciseNumber::new(u128::try_from(frac).ok()?)?;
            let pow = pow_prec.checked_div(&frac_prec)?;
            let one_plus_k = ONE_PREC.checked_add(&pow)?;

            let res = one_plus_k
              .checked_mul(reserve_change)?
              .checked_div(&c_prec)?
              .pow(&ONE_PREC.checked_div(&one_plus_k)?);

            res.clone()?.print();

            res
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
          let pow_prec = PreciseNumber::new(u128::try_from(pow).ok()?)?;
          let frac_prec = PreciseNumber::new(u128::try_from(frac).ok()?)?;

          let one_plus_k_prec = pow_prec.checked_div(&frac_prec)?.checked_add(&ONE_PREC)?;
          if b == 0 && c != 0 {
            /*
            dS = -S + ((S^(1 + k) (R + dR))/R)^(1/(1 + k))
            */

            target_supply
              .pow(&one_plus_k_prec)?
              .checked_mul(&base_amount.checked_add(reserve_change)?)?
              .checked_div(base_amount)?
              .pow(&ONE_PREC.checked_div(&one_plus_k_prec)?)?
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
  ) -> Option<PreciseNumber> {
    if base_amount.eq(&ZERO_PREC) || target_supply.eq(&ZERO_PREC) {
      match *self {
        // b dS + (c dS^(1 + pow/frac))/(1 + pow/frac)
        PrimitiveCurve::ExponentialCurveV0 { pow, frac, c, b } => {
          let b_prec = PreciseNumber {
            value: InnerUint::from(b) * 1_000_000_u64, // Add 6 precision
          };
          let c_prec = PreciseNumber {
            value: InnerUint::from(c) * 1_000_000_u64, // Add 6 precision
          };
          let pow_prec = PreciseNumber::new(u128::try_from(pow).ok()?)?;
          let frac_prec = PreciseNumber::new(u128::try_from(frac).ok()?)?;
          let one_plus_k_prec = pow_prec.checked_div(&frac_prec)?.checked_add(&ONE_PREC)?;
          b_prec.checked_mul(amount)?.checked_add(
            &c_prec
              .checked_mul(&amount.pow(&one_plus_k_prec)?)?
              .checked_div(&one_plus_k_prec)?,
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
            let s_plus_ds = if sell {
              target_supply.checked_sub(amount)?
            } else {
              target_supply.checked_add(amount)?
            };

            let pow_prec = PreciseNumber::new(u128::try_from(pow).ok()?)?;
            let frac_prec = PreciseNumber::new(u128::try_from(frac).ok()?)?;
            let one_plus_k_prec = pow_prec.checked_div(&frac_prec)?.checked_add(&ONE_PREC)?;

            let s_k1 = &target_supply.pow(&one_plus_k_prec)?;
            let s_plus_ds_k1 = s_plus_ds.pow(&one_plus_k_prec)?;

            // PreciseNumbers cannot be negative. If we're selling, S + dS is less than S.
            // Swap the two around. This will invert the sine of this function, but since sell = true they are expecting a positive number
            let right_paren_value = if sell {
              s_k1.checked_sub(&s_plus_ds_k1)?
            } else {
              s_plus_ds_k1.checked_sub(s_k1)?
            };

            base_amount
              .checked_div(s_k1)?
              .checked_mul(&right_paren_value)
          } else if c == 0 {
            // R dS / S
            base_amount.checked_mul(amount)?.checked_div(target_supply)
          } else {
            None // Math is too hard, haven't implemented yet
          }
        }
      }
    }
  }
}

fn transition_fees(
  time_offset: i64,
  reserve_change: &PreciseNumber,
  curve: &TimeCurveV0,
  sell: bool,
) -> Option<PreciseNumber> {
  let transition_fees_opt = if sell {
    curve.sell_transition_fees.as_ref()
  } else {
    curve.buy_transition_fees.as_ref()
  };

  if let Some(fees) = transition_fees_opt {
    let offset_in_current_curve =
      PreciseNumber::new(u128::try_from(time_offset.checked_sub(curve.offset)?).ok()?)?;
    let interval = PreciseNumber::new(u128::try_from(fees.interval).ok()?)?;
    // Decaying percentage. Starts at 100%, works its way down to 0 over the interval. (interval - curr_offset) / interval.
    // When curr_offset is past interval, checked_sub fails and this is just none
    let percent_of_fees_opt = interval
      .checked_sub(&offset_in_current_curve)?
      .checked_div(&interval);
    if let Some(percent_of_fees) = percent_of_fees_opt {
      let percent = get_percent(fees.percentage).ok()?;

      return reserve_change
        .checked_mul(&percent)?
        .checked_mul(&percent_of_fees);
    }
  }

  None
}

fn transition_fees_or_zero(
  time_offset: i64,
  reserve_change: &PreciseNumber,
  curve: &TimeCurveV0,
  sell: bool,
) -> PreciseNumber {
  transition_fees(time_offset, reserve_change, curve, sell)
    .unwrap_or(PreciseNumber::new(0).unwrap())
}

impl Curve for PiecewiseCurve {
  fn price(
    &self,
    time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    amount: &PreciseNumber,
    sell: bool,
  ) -> Option<PreciseNumber> {
    match self {
      PiecewiseCurve::TimeV0 { curves } => {
        let curve = curves.iter().rev().find(|c| c.offset <= time_offset)?;

        let price_opt = curve
          .curve
          .price(time_offset, base_amount, target_supply, amount, sell);

        price_opt.and_then(|p| {
          // Add shock absorbtion to make price continuous
          let fees = transition_fees_or_zero(time_offset, &p, curve, sell);

          if sell {
            p.checked_sub(&fees)
          } else {
            p.checked_add(&fees)
          }
        })
      }
    }
  }

  fn expected_target_amount(
    &self,
    time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    reserve_change: &PreciseNumber,
  ) -> Option<PreciseNumber> {
    match self {
      PiecewiseCurve::TimeV0 { curves } => {
        let curve = curves.iter().rev().find(|c| c.offset <= time_offset)?;

        let fees = transition_fees_or_zero(time_offset, reserve_change, curve, false);

        curve.curve.expected_target_amount(
          time_offset,
          base_amount,
          target_supply,
          &reserve_change.checked_sub(&fees)?,
        )
      }
    }
  }
}
