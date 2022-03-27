use crate::{
  precise_number::{InnerUint, PreciseNumber, ONE_PREC, ZERO_PREC},
  state::{PiecewiseCurve, PrimitiveCurve, TimeCurveV0},
  util::get_percent_prec,
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

fn expected_target_amount_exp_initial(
  c_prec: &PreciseNumber,
  k_prec: &PreciseNumber,
  reserve_change: &PreciseNumber,
) -> Option<PreciseNumber> {
  /*
   * R = c S ^ (1 + k) / (1 + k)
   * R (1 + k) / c = S^(1+k)
   * (((1 + k) dR)/c)^(1/(1 + k))
   */
  let one_plus_k = ONE_PREC.checked_add(k_prec)?;

  one_plus_k
    .checked_mul(reserve_change)?
    .checked_div(c_prec)?
    .pow(&ONE_PREC.checked_div(&one_plus_k)?)
}

fn expected_target_amount_exp(
  k_prec: &PreciseNumber,
  reserve_change: &PreciseNumber,
  base_amount: &PreciseNumber,
  target_supply: &PreciseNumber,
) -> Option<PreciseNumber> {
  /*
  dS = -S + ((S^(1 + k) (R + dR))/R)^(1/(1 + k))
  dS + S = ((S^(1 + k) (R + dR))/R)^(1/(1 + k))
  log(dS + S) = log((S^(1 + k) (R + dR))/R)^(1/(1 + k)))
  log(dS + S) = (1/(1 + k))log(S^(1 + k) (R + dR))/R)
  log(dS + S) = (1/(1 + k))(log(S^(1 + k)/R) + log(R + dR))
  log(dS + S) = (1/(1 + k))(log(S^(1 + k)) - log(R) + log(R + dR)))
  log(dS + S) = (1/(1 + k))(log(S^(1 + k)) + log(R + dR) - log(R))
  log(dS + S) = (1/(1 + k))((1 + k) log(S) + log(R + dR) - log(R))
  log(dS + S) = log(S) + (1/(1 + k))(log(R + dR) - log(R))
  log(dS + S) = log(S) + (1/(1 + k))(log((R + dR / R)))
  dS + S = e^(log(S) + (1/(1 + k))(log((R + dR / R))))
  dS = e^(log(S) + (1/(1 + k))(log((R + dR / R)))) - S
  */
  target_supply
    .log()?
    .checked_add(
      &ONE_PREC
        .checked_div(&ONE_PREC.checked_add(k_prec)?)?
        .signed()
        .checked_mul(
          &base_amount
            .checked_add(reserve_change)?
            .checked_div(base_amount)?
            .log()?,
        )?,
    )?
    .exp()?
    .checked_sub(target_supply)
}

fn price_exp_initial(
  c_prec: &PreciseNumber,
  k_prec: &PreciseNumber,
  amount: &PreciseNumber,
) -> Option<PreciseNumber> {
  // (c dS^(1 + pow/frac))/(1 + pow/frac)
  let one_plus_k_prec = &ONE_PREC.checked_add(k_prec)?;
  c_prec
    .checked_mul(&amount.pow(one_plus_k_prec)?)?
    .checked_div(one_plus_k_prec)
}

fn price_exp(
  k_prec: &PreciseNumber,
  amount: &PreciseNumber,
  base_amount: &PreciseNumber,
  target_supply: &PreciseNumber,
  sell: bool,
) -> Option<PreciseNumber> {
  /*
    dR = (R / S^(1 + k)) ((S + dS)^(1 + k) - S^(1 + k))
    dR = (R(S + dS)^(1 + k))/S^(1 + k) - R
    log(dR + R) = log((R(S + dS)^(1 + k))/S^(1 + k))
    log(dR + R) = log((R(S + dS)^(1 + k))) - log(S^(1 + k))
    log(dR + R) = log(R) + (1 + k) log((S + dS)) - (1 + k)log(S)
    log(dR + R) = (1 + k) (log(R(S + dS)) - log(S))
    dR + R = e^(log(R) + (1 + k) (log((S + dS)) - log(S)))
    dR = e^(log(R) + (1 + k) (log((S + dS)) - log(S))) - R
    dR = e^(log(R) + (1 + k) (log((S + dS) / S))) - R

    Edge case: selling where dS = S. Just charge them the full base amount
  */
  let s_plus_ds = if sell {
    target_supply.checked_sub(amount)?
  } else {
    target_supply.checked_add(amount)?
  };
  let one_plus_k_prec = &ONE_PREC.checked_add(k_prec)?;

  // They're killing the curve, so it should cost the full reserves
  if s_plus_ds.eq(&ZERO_PREC) {
    return Some(base_amount.clone());
  }

  let log1 = base_amount.log()?;
  let log2 = s_plus_ds.checked_div(target_supply)?.log()?;
  let logs = log1.checked_add(&one_plus_k_prec.signed().checked_mul(&log2)?)?;
  let exp = logs.exp()?;

  Some(exp.signed().checked_sub(&base_amount.signed())?.value)
}

fn to_prec(i: u128) -> PreciseNumber {
  PreciseNumber {
    value: InnerUint::from(i) * 1_000_000_u64, // Add 6 precision
  }
}

fn time_decay_k(
  d: u128,
  k0: u128,
  k1: u128,
  time_offset: i64,
  interval: u32,
) -> Option<PreciseNumber> {
  let k0_prec = to_prec(k0);
  let k1_prec = to_prec(k1);
  let d_prec = to_prec(d);
  let interval_prec = PreciseNumber {
    value: InnerUint::from(interval) * 1_000_000_u64, // Add 6 precision
  };
  let time_offset_prec = PreciseNumber {
    value: InnerUint::from(time_offset) * 1_000_000_u64, // Add 6 precision
  };

  let time_multiplier = if time_offset_prec.less_than(&interval_prec) {
    let interval_completion = time_offset_prec.checked_div(&interval_prec)?;
    interval_completion
      .log()?
      .checked_mul(&d_prec.signed())?
      .exp()?
  } else {
    PreciseNumber::one()
  };

  Some(
    k0_prec
      .signed()
      .checked_sub(
        &k0_prec
          .signed()
          .checked_sub(&k1_prec.signed())?
          .checked_mul(&time_multiplier.signed())?,
      )?
      .value,
  )
}

impl Curve for PrimitiveCurve {
  fn expected_target_amount(
    &self,
    time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    reserve_change: &PreciseNumber,
  ) -> Option<PreciseNumber> {
    if base_amount.eq(&ZERO_PREC) || target_supply.eq(&ZERO_PREC) {
      match *self {
        // b dS + (c dS^(1 + pow/frac))/(1 + pow/frac)
        PrimitiveCurve::ExponentialCurveV0 { pow, frac, b, c } => {
          let pow_prec = PreciseNumber::new(u128::try_from(pow).ok()?)?;
          let frac_prec = PreciseNumber::new(u128::try_from(frac).ok()?)?;
          let c_prec = to_prec(c);
          let b_prec = to_prec(b);
          if b == 0 && c != 0 {
            expected_target_amount_exp_initial(
              &c_prec,
              &pow_prec.checked_div(&frac_prec)?,
              reserve_change,
            )
          } else if c == 0 {
            if base_amount.eq(&ZERO_PREC) {
              reserve_change.checked_div(&b_prec)
            } else {
              target_supply
                .checked_mul(reserve_change)?
                .checked_div(&b_prec)
            }
          } else {
            None // This math is too hard, have not implemented yet.
          }
        }
        PrimitiveCurve::TimeDecayExponentialCurveV0 {
          d,
          c,
          k1,
          k0,
          interval,
        } => expected_target_amount_exp_initial(
          &to_prec(c),
          &time_decay_k(d, k0, k1, time_offset, interval)?,
          reserve_change,
        ),
      }
    } else {
      match *self {
        PrimitiveCurve::ExponentialCurveV0 { pow, frac, b, c } => {
          let pow_prec = PreciseNumber::new(u128::try_from(pow).ok()?)?;
          let frac_prec = PreciseNumber::new(u128::try_from(frac).ok()?)?;

          if b == 0 && c != 0 {
            expected_target_amount_exp(
              &pow_prec.checked_div(&frac_prec)?,
              reserve_change,
              base_amount,
              target_supply,
            )
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
        PrimitiveCurve::TimeDecayExponentialCurveV0 {
          d,
          c: _,
          k1,
          k0,
          interval,
        } => expected_target_amount_exp(
          &time_decay_k(d, k0, k1, time_offset, interval)?,
          reserve_change,
          base_amount,
          target_supply,
        ),
      }
    }
  }

  fn price(
    &self,
    time_offset: i64,
    base_amount: &PreciseNumber,
    target_supply: &PreciseNumber,
    amount: &PreciseNumber,
    sell: bool,
  ) -> Option<PreciseNumber> {
    if base_amount.eq(&ZERO_PREC) || target_supply.eq(&ZERO_PREC) {
      match *self {
        // b dS + (c dS^(1 + pow/frac))/(1 + pow/frac)
        PrimitiveCurve::ExponentialCurveV0 { pow, frac, c, b } => {
          let b_prec = to_prec(b);
          let c_prec = to_prec(c);
          let pow_prec = PreciseNumber::new(u128::try_from(pow).ok()?)?;
          let frac_prec = PreciseNumber::new(u128::try_from(frac).ok()?)?;
          b_prec.checked_mul(amount)?.checked_add(&price_exp_initial(
            &c_prec,
            &pow_prec.checked_div(&frac_prec)?,
            amount,
          )?)
        }
        PrimitiveCurve::TimeDecayExponentialCurveV0 {
          d,
          c,
          k1,
          k0,
          interval,
        } => price_exp_initial(
          &to_prec(c),
          &time_decay_k(d, k0, k1, time_offset, interval)?,
          amount,
        ),
      }
    } else {
      match *self {
        PrimitiveCurve::ExponentialCurveV0 { pow, frac, c, b } => {
          if b == 0 && c != 0 {
            let pow_prec = PreciseNumber::new(u128::try_from(pow).ok()?)?;
            let frac_prec = PreciseNumber::new(u128::try_from(frac).ok()?)?;
            let k = pow_prec.checked_div(&frac_prec)?;
            price_exp(&k, amount, base_amount, target_supply, sell)
          } else if c == 0 {
            // R dS / S
            base_amount.checked_mul(amount)?.checked_div(target_supply)
          } else {
            None // Math is too hard, haven't implemented yet
          }
        }
        PrimitiveCurve::TimeDecayExponentialCurveV0 {
          d,
          c: _,
          k1,
          k0,
          interval,
        } => price_exp(
          &time_decay_k(d, k0, k1, time_offset, interval)?,
          amount,
          base_amount,
          target_supply,
          sell,
        ),
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
      let percent = get_percent_prec(fees.percentage).ok()?;

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

        let price_opt = curve.curve.price(
          time_offset - curve.offset,
          base_amount,
          target_supply,
          amount,
          sell,
        );

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
          time_offset - curve.offset,
          base_amount,
          target_supply,
          &reserve_change.checked_sub(&fees)?,
        )
      }
    }
  }
}
