//! Defines PreciseNumber, a U192 wrapper with float-like operations
// Stolen from SPL math, but changing inner unit

use std::convert::*;

use anchor_lang::{solana_program::log::sol_log_compute_units, prelude::msg};

use crate::uint::{U192};

// Allows for easy swapping between different internal representations
pub type InnerUint = U192;

pub static ONE_PREC: PreciseNumber = PreciseNumber { value: one() };
pub static ZERO_PREC: PreciseNumber = PreciseNumber { value: zero() };
pub static TWO_PREC: PreciseNumber = PreciseNumber { value: two() };

/// The representation of the number one as a precise number as 10^18
pub const ONE: u128 = 1_000_000_000_000_000_000;

/// Struct encapsulating a fixed-point number that allows for decimal calculations
#[derive(Clone, Debug, PartialEq)]
pub struct PreciseNumber {
  /// Wrapper over the inner value, which is multiplied by ONE
  pub value: InnerUint,
}

/// The precise-number 1 as a InnerUint. 24 decimals of precision
#[inline]
pub const fn one() -> InnerUint {
  // InnerUint::from(1_000_000_000_000_000_000_000_000_u128)
  U192([1000000000000000000_u64, 0_u64, 0_u64])
  // InnerUint::from(ONE)
}

#[inline]
pub const fn two() -> InnerUint {
  // InnerUint::from(1_000_000_000_000_000_000_000_000_u128)
  U192([2000000000000000000_u64, 0_u64, 0_u64])
  // InnerUint::from(ONE)
}

// 0.693147180369123816490000
#[inline]
pub const fn ln2hi() -> InnerUint {
  U192([13974485815783726801_u64, 3_u64, 0_u64])
}
pub const LN2HI: PreciseNumber = PreciseNumber { value: ln2hi() };
#[inline]

pub const fn ln2hi_scale() -> InnerUint {
  U192([7766279631452241920_u64, 5_u64, 0_u64])
}

pub const LN2HI_SCALE: PreciseNumber = PreciseNumber { value: ln2hi_scale() };

// 1.90821492927058770002e-10 /* 3dea39ef 35793c76 */
// Note that ln2lo is lower than our max precision, so we store both it and the thirty zeroes to scale by
#[inline]
pub const fn ln2lo() -> InnerUint {
  U192([7217906904860196864_u64, 10344453859422221846_u64, 0_u64])
}
pub const LN2LO: PreciseNumber = PreciseNumber { value: ln2lo() };

#[inline]
pub const fn ln2lo_scale() -> InnerUint {
  U192([9169610316303040512_u64, 1027829888850112811_u64, 2938735877_u64])
}

pub const LN2LO_SCALE: PreciseNumber = PreciseNumber { value: ln2lo_scale() };

// 6.666666666666735130e-01
#[inline]
pub const fn l1() -> InnerUint {
  U192([666666666666673513_u64, 0_u64, 0_u64])
}
pub const L1: PreciseNumber = PreciseNumber { value: l1() };

#[inline]
pub const fn l2() -> InnerUint {
  U192([399999999994094190_u64, 0_u64, 0_u64])
}
pub const L2: PreciseNumber = PreciseNumber { value: l2() };

#[inline]
pub const fn l3() -> InnerUint {
  U192([285714287436623914_u64, 0_u64, 0_u64])
}
pub const L3: PreciseNumber = PreciseNumber { value: l3() };

#[inline]
pub const fn l4() -> InnerUint {
  U192([222221984321497839_u64, 0_u64, 0_u64])
}
pub const L4: PreciseNumber = PreciseNumber { value: l4() };


#[inline]
pub const fn l5() -> InnerUint {
  U192([181835721616180501_u64, 0_u64, 0_u64])
}
pub const L5: PreciseNumber = PreciseNumber { value: l5() };

pub const fn l6() -> InnerUint {
  U192([153138376992093733_u64, 0_u64, 0_u64])
}
pub const L6: PreciseNumber = PreciseNumber { value: l6() };

#[inline]
pub const fn l7() -> InnerUint {
  U192([147981986051165859_u64, 0_u64, 0_u64])
}
pub const L7: PreciseNumber = PreciseNumber { value: l7() };

#[inline]
pub const fn sqrt2overtwo() -> InnerUint {
  U192([707106781186547600_u64, 0_u64, 0_u64])
}
pub const SQRT2OVERTWO: PreciseNumber = PreciseNumber { value: sqrt2overtwo() };

#[inline]
pub const fn p1() -> InnerUint {
  U192([166666666666666019_u64, 0_u64, 0_u64])
}
pub const P1: PreciseNumber = PreciseNumber { value: p1() };

#[inline]
pub const fn p2() -> InnerUint {
  U192([2777777777701559_u64, 0_u64, 0_u64])
}
pub const P2: PreciseNumber = PreciseNumber { value: p2() };

#[inline]
pub const fn p3() -> InnerUint {
  U192([66137563214379_u64, 0_u64, 0_u64])
}
pub const P3: PreciseNumber = PreciseNumber { value: p3() };

#[inline]
pub const fn p4() -> InnerUint {
  U192([1653390220546_u64, 0_u64, 0_u64])
}
pub const P4: PreciseNumber = PreciseNumber { value: p4() };

#[inline]
pub const fn p5() -> InnerUint {
  U192([41381367970_u64, 0_u64, 0_u64])
}
pub const P5: PreciseNumber = PreciseNumber { value: p5() };

#[inline]
pub const fn halfln2() -> InnerUint {
  U192([346573590279972640_u64, 0_u64, 0_u64])
}
pub const HALFLN2: PreciseNumber = PreciseNumber { value: halfln2() };

#[inline]
pub const fn threehalfln2() -> InnerUint {
  U192([1039720770839917900_u64, 0_u64, 0_u64])
}
pub const THREEHALFLN2: PreciseNumber = PreciseNumber { value: threehalfln2() };

#[inline]
pub const fn invln2() -> InnerUint {
  U192([1442695040888963387_u64, 0_u64, 0_u64])
}
pub const INVLN2: PreciseNumber = PreciseNumber { value: invln2() };

#[inline]
pub const fn half() -> InnerUint {
  U192([500000000000000000_u64, 0_u64, 0_u64])
}
pub const HALF: PreciseNumber = PreciseNumber { value: half() };


// #[inline]
// pub const fn L1() -> InnerUint {
//   // InnerUint::from(1_000_000_000_000_000_000_000_000_u128)
//   U192([0x1BCECCEDA1000000_u64, 0xD3C2_u64, 0_u64])
//   // InnerUint::from(ONE)
// }

/// The number 0 as a PreciseNumber, used for easier calculations.
#[inline]
pub const fn zero() -> InnerUint {
  U192([0_u64, 0_u64, 0_u64])
}

impl PreciseNumber {
  /// Correction to apply to avoid truncation errors on division.  Since
  /// integer operations will always floor the result, we artifically bump it
  /// up by one half to get the expect result.
  fn rounding_correction() -> InnerUint {
    InnerUint::from(ONE / 2)
  }

  /// Desired precision for the correction factor applied during each
  /// iteration of checked_pow_approximation.  Once the correction factor is
  /// smaller than this number, or we reach the maxmium number of iterations,
  /// the calculation ends.
  fn precision() -> InnerUint {
    InnerUint::from(100_000_000_000_000_u64)
  }

  fn zero() -> Self {
    Self { value: zero() }
  }

  fn one() -> Self {
    Self { value: one() }
  }

  /// Maximum number iterations to apply on checked_pow_approximation.
  const MAX_APPROXIMATION_ITERATIONS: u128 = 100;

  /// Minimum base allowed when calculating exponents in checked_pow_fraction
  /// and checked_pow_approximation.  This simply avoids 0 as a base.
  fn min_pow_base() -> InnerUint {
    InnerUint::from(1)
  }

  /// Maximum base allowed when calculating exponents in checked_pow_fraction
  /// and checked_pow_approximation.  The calculation use a Taylor Series
  /// approxmation around 1, which converges for bases between 0 and 2.  See
  /// https://en.wikipedia.org/wiki/Binomial_series#Conditions_for_convergence
  /// for more information.
  fn max_pow_base() -> InnerUint {
    InnerUint::from(2 * ONE)
  }

  /// Create a precise number from an imprecise u128, should always succeed
  pub fn new(value: u128) -> Option<Self> {
    let value = InnerUint::from(value).checked_mul(one())?;
    Some(Self { value })
  }

  /// Convert a precise number back to u128
  pub fn to_imprecise(&self) -> Option<u128> {
    self
      .value
      .checked_add(Self::rounding_correction())?
      .checked_div(one())
      .map(|v| v.as_u128())
  }

  /// Checks that two PreciseNumbers are equal within some tolerance
  pub fn almost_eq(&self, rhs: &Self, precision: InnerUint) -> bool {
    let (difference, _) = self.unsigned_sub(rhs);
    difference.value < precision
  }

  /// Checks that a number is less than another
  pub fn less_than(&self, rhs: &Self) -> bool {
    self.value < rhs.value
  }

  /// Checks that a number is greater than another
  pub fn greater_than(&self, rhs: &Self) -> bool {
    self.value > rhs.value
  }

  /// Checks that a number is less than another
  pub fn less_than_or_equal(&self, rhs: &Self) -> bool {
    self.value <= rhs.value
  }

  /// Checks that a number is greater than another
  pub fn greater_than_or_equal(&self, rhs: &Self) -> bool {
    self.value >= rhs.value
  }

  /// Floors a precise value to a precision of ONE
  pub fn floor(&self) -> Option<Self> {
    let value = self.value.checked_div(one())?.checked_mul(one())?;
    Some(Self { value })
  }

  /// Ceiling a precise value to a precision of ONE
  pub fn ceiling(&self) -> Option<Self> {
    let value = self
      .value
      .checked_add(one().checked_sub(InnerUint::from(1))?)?
      .checked_div(one())?
      .checked_mul(one())?;
    Some(Self { value })
  }

  /// Performs a checked division on two precise numbers
  pub fn checked_div(&self, rhs: &Self) -> Option<Self> {
    if *rhs == Self::zero() {
      return None;
    }
    match self.value.checked_mul(one()) {
      Some(v) => {
        let value = v
          .checked_add(Self::rounding_correction())?
          .checked_div(rhs.value)?;
        Some(Self { value })
      }
      None => {
        let value = self
          .value
          .checked_add(Self::rounding_correction())?
          .checked_div(rhs.value)?
          .checked_mul(one())?;
        Some(Self { value })
      }
    }
  }

  /// Performs a multiplication on two precise numbers
  pub fn checked_mul(&self, rhs: &Self) -> Option<Self> {
    match self.value.checked_mul(rhs.value) {
      Some(v) => {
        let value = v
          .checked_add(Self::rounding_correction())?
          .checked_div(one())?;
        Some(Self { value })
      }
      None => {
        let value = if self.value >= rhs.value {
          self.value.checked_div(one())?.checked_mul(rhs.value)?
        } else {
          rhs.value.checked_div(one())?.checked_mul(self.value)?
        };
        Some(Self { value })
      }
    }
  }

  /// Performs addition of two precise numbers
  pub fn checked_add(&self, rhs: &Self) -> Option<Self> {
    let value = self.value.checked_add(rhs.value)?;
    Some(Self { value })
  }

  /// Subtracts the argument from self
  pub fn checked_sub(&self, rhs: &Self) -> Option<Self> {
    let value = self.value.checked_sub(rhs.value)?;
    Some(Self { value })
  }

  /// Performs a subtraction, returning the result and whether the result is negative
  pub fn unsigned_sub(&self, rhs: &Self) -> (Self, bool) {
    match self.value.checked_sub(rhs.value) {
      None => {
        let value = rhs.value.checked_sub(self.value).unwrap();
        (Self { value }, true)
      }
      Some(value) => (Self { value }, false),
    }
  }

  /// Performs pow on a precise number
  pub fn checked_pow(&self, exponent: u128) -> Option<Self> {
    // For odd powers, start with a multiplication by base since we halve the
    // exponent at the start
    let value = if exponent.checked_rem(2)? == 0 {
      one()
    } else {
      self.value
    };
    let mut result = Self { value };

    // To minimize the number of operations, we keep squaring the base, and
    // only push to the result on odd exponents, like a binary decomposition
    // of the exponent.
    let mut squared_base = self.clone();
    let mut current_exponent = exponent.checked_div(2)?;
    while current_exponent != 0 {
      squared_base = squared_base.checked_mul(&squared_base)?;

      // For odd exponents, "push" the base onto the value
      if current_exponent.checked_rem(2)? != 0 {
        result = result.checked_mul(&squared_base)?;
      }

      current_exponent = current_exponent.checked_div(2)?;
    }
    Some(result)
  }

  // Frexp breaks f into a normalized fraction
  // and an integral power of two.
  // It returns frac and exp satisfying f == frac × 2**exp,
  // with the absolute value of frac in the interval [½, 1).
  //
  // Special cases are:
  //	Frexp(±0) = ±0, 0
  //	Frexp(±Inf) = ±Inf, 0
  //	Frexp(NaN) = NaN, 0
  fn frexp(&self) -> Option<(Self, i64)> {
    if self.less_than(&ONE_PREC) {
      let first_leading = self.value.0[0].leading_zeros();
      let one_leading = ONE_PREC.value.0[0].leading_zeros();
      let bits = i64::from(first_leading.checked_sub(one_leading).unwrap());
      let powed: u128 = 1_u128 << bits;
      let frac = self.checked_mul(
        &PreciseNumber::new(powed)?
      )?;
      if frac.less_than(&HALF) {
        Some((frac.checked_mul(&TWO_PREC).unwrap(), -bits - 1))
      } else {
        Some((frac, -bits))
      }
    } else {
      let bits = 128_i64.checked_sub(i64::from(self.to_imprecise()?.leading_zeros()))?;
      let powed: u128 = 1_u128 << bits;
      let frac = self.checked_div(
        &PreciseNumber::new(powed)?
      )?;
      if frac.less_than(&HALF) {
        Some((frac.checked_mul(&TWO_PREC).unwrap(), bits - 1))
      } else {
        Some((frac, bits))
      }
    }

  }

  // Modified from the original to support precise numbers instead of floats
  /*
    Floating-point logarithm.
    Borrowed from https://arm-software.github.io/golang-utils/src/math/log.go.html
  */
  // The original C code, the long comment, and the constants
  // below are from FreeBSD's /usr/src/lib/msun/src/e_log.c
  // and came with this notice. The go code is a simpler
  // version of the original C.
  //
  // ====================================================
  // Copyright (C) 1993 by Sun Microsystems, Inc. All rights reserved.
  //
  // Developed at SunPro, a Sun Microsystems, Inc. business.
  // Permission to use, copy, modify, and distribute this
  // software is freely granted, provided that this notice
  // is preserved.
  // ====================================================
  //
  // __ieee754_log(x)
  // Return the logarithm of x
  //
  // Method :
  //   1. Argument Reduction: find k and f such that
  //			x = 2**k * (1+f),
  //	   where  sqrt(2)/2 < 1+f < sqrt(2) .
  //
  //   2. Approximation of log(1+f).
  //	Let s = f/(2+f) ; based on log(1+f) = log(1+s) - log(1-s)
  //		 = 2s + 2/3 s**3 + 2/5 s**5 + .....,
  //	     	 = 2s + s*R
  //      We use a special Reme algorithm on [0,0.1716] to generate
  //	a polynomial of degree 14 to approximate R.  The maximum error
  //	of this polynomial approximation is bounded by 2**-58.45. In
  //	other words,
  //		        2      4      6      8      10      12      14
  //	    R(z) ~ L1*s +L2*s +L3*s +L4*s +L5*s  +L6*s  +L7*s
  //	(the values of L1 to L7 are listed in the program) and
  //	    |      2          14          |     -58.45
  //	    | L1*s +...+L7*s    -  R(z) | <= 2
  //	    |                             |
  //	Note that 2s = f - s*f = f - hfsq + s*hfsq, where hfsq = f*f/2.
  //	In order to guarantee error in log below 1ulp, we compute log by
  //		log(1+f) = f - s*(f - R)		(if f is not too large)
  //		log(1+f) = f - (hfsq - s*(hfsq+R)).	(better accuracy)
  //
  //	3. Finally,  log(x) = k*Ln2 + log(1+f).
  //			    = k*Ln2_hi+(f-(hfsq-(s*(hfsq+R)+k*Ln2_lo)))
  //	   Here Ln2 is split into two floating point number:
  //			Ln2_hi + Ln2_lo,
  //	   where n*Ln2_hi is always exact for |n| < 2000.
  //
  // Special cases:
  //	log(x) is NaN with signal if x < 0 (including -INF) ;
  //	log(+INF) is +INF; log(0) is -INF with signal;
  //	log(NaN) is that NaN with no signal.
  //
  // Accuracy:
  //	according to an error analysis, the error is always less than
  //	1 ulp (unit in the last place).
  //
  // Constants:
  // The hexadecimal values are the intended ones for the following
  // constants. The decimal values may be used, provided that the
  // compiler will convert from decimal to binary accurately enough
  // to produce the hexadecimal values shown.
  // Frexp breaks f into a normalized fraction
  // and an integral power of two.
  // It returns frac and exp satisfying f == frac × 2**exp,
  // with the absolute value of frac in the interval [½, 1).
  //
  // Log returns the natural logarithm of x.
  //
  // Special cases are:
  //	Log(+Inf) = +Inf
  //	Log(0) = -Inf
  //	Log(x < 0) = NaN
  fn log(&self) -> Option<(Self, bool)> {
    if self.eq(&PreciseNumber::zero()) {
      return None
    }

    if self.eq(&PreciseNumber::one()) {
      return Some((PreciseNumber::zero(), false))
    }

    let (f1_init, ki_init) = self.frexp().unwrap();

    let (f1, ki) = if f1_init.less_than(&SQRT2OVERTWO) {
      let new_f1 = f1_init.checked_mul(&TWO_PREC).unwrap();
      let new_k1 = ki_init.checked_sub(1).unwrap();
      (new_f1, new_k1)
    } else {
      (f1_init, ki_init)
    };

    let (f, f_is_negative) = PreciseNumber::signed_sub((&f1, false), (&ONE_PREC, false)).unwrap();

    let s_divisor = PreciseNumber::signed_add(
      (&TWO_PREC, false),
      (&f, f_is_negative)
    ).unwrap();
    let s = f.checked_div(&s_divisor.0).unwrap();
    let s_is_negative = (s_divisor.1 || f_is_negative) && !(f_is_negative && s_divisor.1);
    let s2 = s.checked_mul(&s).unwrap();
    let s4 = s2.checked_mul(&s2).unwrap();
    // s2 * (L1 + s4*(L3+s4*(L5+s4*L7)))
    let t1 = s2.checked_mul(
      &L1.checked_add(
        &s4.checked_mul(
          &L3.checked_add(
            &s4.checked_mul(
              &L5.checked_add(
                &s4.checked_mul(&L7).unwrap()
              ).unwrap()
            ).unwrap()
          ).unwrap()
        ).unwrap()
      ).unwrap()
    ).unwrap();

    // s4 * (L2 + s4*(L4+s4*L6))
    let t2 = s4.checked_mul(
      &L2.checked_add(
        &s4.checked_mul(
          &L4.checked_add(
            &s4.checked_mul(&L6).unwrap()
          ).unwrap()
        ).unwrap()
      ).unwrap()
    ).unwrap();

    let r = t1.checked_add(&t2).unwrap();
    let hfsq= f.checked_mul(&f).unwrap().checked_div(&TWO_PREC).unwrap();
    let k = (PreciseNumber::new(u128::try_from(ki.abs()).ok().unwrap()).unwrap(), ki < 0);
    
    // k*Ln2Hi - ((hfsq - (s*(hfsq+R) + k*Ln2Lo)) - f)
    let kl2hi = k.0.checked_mul(&LN2HI).unwrap().checked_div(&LN2HI_SCALE).unwrap();
    let shfsqr = s.checked_mul(&hfsq.checked_add(&r).unwrap()).unwrap();
    let kl2lo = &k.0.checked_mul(&LN2LO).unwrap().checked_div(&LN2LO_SCALE).unwrap();

    let shfsqr_kl2lo = PreciseNumber::signed_add(
      (&shfsqr, s_is_negative),
      (&kl2lo, k.1)
    ).unwrap();
    let hfsq_shfsqr_kl2lo = PreciseNumber::signed_sub(
      (&hfsq, false),
      (&shfsqr_kl2lo.0, shfsqr_kl2lo.1)
    ).unwrap();
    let f_hfsq_shfsqr_kl2lo = PreciseNumber::signed_sub(
      (&hfsq_shfsqr_kl2lo.0, hfsq_shfsqr_kl2lo.1),
      (&f, f_is_negative)
    ).unwrap();

    PreciseNumber::signed_sub(
      (&kl2hi, k.1),
      (&f_hfsq_shfsqr_kl2lo.0, f_hfsq_shfsqr_kl2lo.1)
    )
  }

  fn signed_add<'a>(lhs: (&Self, bool), rhs: (&Self, bool)) -> Option<(Self, bool)> {
    let lhs_negative = lhs.1;
    let rhs_negative = rhs.1;

    if rhs_negative && lhs_negative {
      Some((lhs.0.checked_add(rhs.0)?, true))
    } else if rhs_negative {
      if rhs.0.greater_than(lhs.0) {
        Some((rhs.0.checked_sub(lhs.0)?, true))
      } else {
        Some((lhs.0.checked_sub(rhs.0)?, false))
      }
    } else if lhs_negative {
      if lhs.0.greater_than(rhs.0) {
        Some((lhs.0.checked_sub(rhs.0)?, true))
      } else {
        Some((rhs.0.checked_sub(lhs.0)?, false))
      }
    } else {
      Some((lhs.0.checked_add(rhs.0)?, false))
    }
  }

  fn signed_sub<'a>(lhs: (&Self, bool), rhs: (&Self, bool)) -> Option<(Self, bool)> {
    PreciseNumber::signed_add(lhs, (rhs.0, !rhs.1))
  }

  // Modified from the original to support precise numbers instead of floats
  /* origin: FreeBSD /usr/src/lib/msun/src/e_exp.c */
  /*
  * ====================================================
  * Copyright (C) 2004 by Sun Microsystems, Inc. All rights reserved.
  *
  * Permission to use, copy, modify, and distribute this
  * software is freely granted, provided that this notice
  * is preserved.
  * ====================================================
  */
  /* exp(x)
  * Returns the exponential of x.
  *
  * Method
  *   1. Argument reduction:
  *      Reduce x to an r so that |r| <= 0.5*ln2 ~ 0.34658.
  *      Given x, find r and integer k such that
  *
  *               x = k*ln2 + r,  |r| <= 0.5*ln2.
  *
  *      Here r will be represented as r = hi-lo for better
  *      accuracy.
  *
  *   2. Approximation of exp(r) by a special rational function on
  *      the interval [0,0.34658]:
  *      Write
  *          R(r**2) = r*(exp(r)+1)/(exp(r)-1) = 2 + r*r/6 - r**4/360 + ...
  *      We use a special Remez algorithm on [0,0.34658] to generate
  *      a polynomial of degree 5 to approximate R. The maximum error
  *      of this polynomial approximation is bounded by 2**-59. In
  *      other words,
  *          R(z) ~ 2.0 + P1*z + P2*z**2 + P3*z**3 + P4*z**4 + P5*z**5
  *      (where z=r*r, and the values of P1 to P5 are listed below)
  *      and
  *          |                  5          |     -59
  *          | 2.0+P1*z+...+P5*z   -  R(z) | <= 2
  *          |                             |
  *      The computation of exp(r) thus becomes
  *                              2*r
  *              exp(r) = 1 + ----------
  *                            R(r) - r
  *                                 r*c(r)
  *                     = 1 + r + ----------- (for better accuracy)
  *                                2 - c(r)
  *      where
  *                              2       4             10
  *              c(r) = r - (P1*r  + P2*r  + ... + P5*r   ).
  *
  *   3. Scale back to obtain exp(x):
  *      From step 1, we have
  *         exp(x) = 2^k * exp(r)
  *
  * Special cases:
  *      exp(INF) is INF, exp(NaN) is NaN;
  *      exp(-INF) is 0, and
  *      for finite argument, only exp(0)=1 is exact.
  *
  * Accuracy:
  *      according to an error analysis, the error is always less than
  *      1 ulp (unit in the last place).
  *
  * Misc. info.
  *      For IEEE double
  *          if x >  709.782712893383973096 then exp(x) overflows
  *          if x < -745.133219101941108420 then exp(x) underflows
  */
  
  /// Calculate the exponential of `x`, that is, *e* raised to the power `x`
  /// (where *e* is the base of the natural system of logarithms, approximately 2.71828).
  pub fn exp(self, is_negative: bool) -> Option<PreciseNumber> {
    let hi: (PreciseNumber, bool);
    let lo: (PreciseNumber, bool);
    let xx: PreciseNumber;
    let y: (PreciseNumber, bool);
    let k: (PreciseNumber, bool);
    let x: (PreciseNumber, bool);
    /* argument reduction */
    /* if |x| > 0.5 ln2 */
    if self.greater_than(&HALFLN2) {
      /* if |x| >= 1.5 ln2 */
      if self.greater_than_or_equal(&THREEHALFLN2) {
        let k_temp = PreciseNumber::signed_add(
          (&INVLN2.checked_mul(&self).unwrap(), is_negative),
        (&HALF, is_negative)
        ).unwrap();
        k = (k_temp.0.floor().unwrap(), k_temp.1);
      } else {
        k = (PreciseNumber::one(), is_negative);
      }
      hi = PreciseNumber::signed_sub(
        (&self, is_negative),
        (&k.0.checked_mul(&LN2HI).unwrap().checked_div(&LN2HI_SCALE).unwrap(), k.1)
      ).unwrap();
      lo = (k.0.checked_mul(&LN2LO).unwrap().checked_div(&LN2LO_SCALE).unwrap(), k.1);
      x = PreciseNumber::signed_sub(
        (&hi.0, hi.1),
        (&lo.0, lo.1)
      ).unwrap();
    } else {
      x = (self.clone(), is_negative);
      k = (PreciseNumber::zero(), is_negative);
      hi = (self, is_negative);
      lo = (PreciseNumber::zero(), is_negative);
    }

    /* x is now in primary range */
    xx = x.0.checked_mul(&x.0).unwrap();
    // c = x - xx * (P1 + xx * (P2 + xx * (P3 + xx * (P4 + xx * P5))));
    let p4p5 = PreciseNumber::signed_add(
      (&P4, true),
      (&xx.checked_mul(&P5).unwrap(), false)
    ).unwrap();
    let p3p4p5 = PreciseNumber::signed_add(
      (&P3, false),
      (&xx.checked_mul(&p4p5.0).unwrap(), p4p5.1)
    ).unwrap();
    let p2p3p4p5 = PreciseNumber::signed_add(
      (&P2, true),
      (&xx.checked_mul(&p3p4p5.0).unwrap(), p3p4p5.1)
    ).unwrap();
    let p1p2p3p4p5 = PreciseNumber::signed_add(
      (&P1, false),
      (&xx.checked_mul(&p2p3p4p5.0).unwrap(), p2p3p4p5.1)
    ).unwrap();
    let (c, c_is_negative) = PreciseNumber::signed_sub(
      (&x.0, x.1), 
      (&p1p2p3p4p5.0.checked_mul(&xx).unwrap(), p1p2p3p4p5.1)
    ).unwrap();

    // y = 1. + (x * c / (2. - c) - lo + hi);
    let c_min_2 = PreciseNumber::signed_sub((&TWO_PREC, false), (&c, c_is_negative)).unwrap();
    let x_c = x.0.checked_mul(
      &c.checked_div(&c_min_2.0).unwrap()
    ).unwrap();
    let xc_negative = (x.1 || c_is_negative) && !(c_is_negative && x.1);
    let x_c_negative = (xc_negative || c_min_2.1) && !(xc_negative && c_min_2.1);

    let one_x_c = PreciseNumber::signed_add(
      (&PreciseNumber::one(), false),
      (&x_c, x_c_negative)
      )
      .unwrap();

    
    let y_min_low = PreciseNumber::signed_sub(
      (&one_x_c.0, one_x_c.1),
      (&lo.0, lo.1)
    ).unwrap();

    y = PreciseNumber::signed_add(
      (&y_min_low.0, y_min_low.1),
      (&hi.0, hi.1)
    ).unwrap();

    if k.0.eq(&PreciseNumber::zero()) {
        Some(y.0)
    } else {
      let bits = k.0.to_imprecise().unwrap();
      let powed: u128 = 1_u128 << bits;
      let powed_prec = PreciseNumber::new(powed).unwrap();

      if k.1 {
        y.0.checked_div(&powed_prec)
      } else {
        y.0.checked_mul(&powed_prec)
      }
    }
  }

  /// Approximate the nth root of a number using a Taylor Series around 1 on
  /// x ^ n, where 0 < n < 1, result is a precise number.
  /// Refine the guess for each term, using:
  ///                                  1                    2
  /// f(x) = f(a) + f'(a) * (x - a) + --- * f''(a) * (x - a)  + ...
  ///                                  2!
  /// For x ^ n, this gives:
  ///  n    n         n-1           1                  n-2        2
  /// x  = a  + n * a    (x - a) + --- * n * (n - 1) a     (x - a)  + ...
  ///                               2!
  ///
  /// More simply, this means refining the term at each iteration with:
  ///
  /// t_k+1 = t_k * (x - a) * (n + 1 - k) / k
  ///
  /// where a = 1, n = power, x = precise_num
  /// NOTE: this function is private because its accurate range and precision
  /// have not been estbalished.
  fn checked_pow_approximation(&self, exponent: &Self, max_iterations: u128) -> Option<Self> {
    assert!(self.value >= Self::min_pow_base());
    assert!(self.value <= Self::max_pow_base());
    let one = Self::one();
    if *exponent == Self::zero() {
      return Some(one);
    }
    let mut precise_guess = one.clone();
    let mut term = precise_guess.clone();
    let (x_minus_a, x_minus_a_negative) = self.unsigned_sub(&precise_guess);
    let exponent_plus_one = exponent.checked_add(&one)?;
    let mut negative = false;
    for k in 1..max_iterations {
      let k = Self::new(k)?;
      let (current_exponent, current_exponent_negative) = exponent_plus_one.unsigned_sub(&k);
      term = term.checked_mul(&current_exponent)?;
      term = term.checked_mul(&x_minus_a)?;
      term = term.checked_div(&k)?;
      if term.value < Self::precision() {
        break;
      }
      if x_minus_a_negative {
        negative = !negative;
      }
      if current_exponent_negative {
        negative = !negative;
      }
      if negative {
        precise_guess = precise_guess.checked_sub(&term)?;
      } else {
        precise_guess = precise_guess.checked_add(&term)?;
      }
    }
    Some(precise_guess)
  }

  /// Get the power of a number, where the exponent is expressed as a fraction
  /// (numerator / denominator)
  pub fn checked_pow_fraction(&self, exponent: &Self) -> Option<Self> {
    if exponent.eq(&ZERO_PREC) {
      return Some(ONE_PREC.clone());
    }

    // Check if this is a whole number. If so, don't use checked_pow_fraction
    let imprecise = exponent.to_imprecise()?;
    if PreciseNumber::new(imprecise)?.eq(exponent) {
      return self.checked_pow(imprecise);
    }

    assert!(self.value >= Self::min_pow_base());
    assert!(self.value <= Self::max_pow_base());
    let whole_exponent = exponent.floor()?;
    let precise_whole = self.checked_pow(whole_exponent.to_imprecise()?)?;
    let (remainder_exponent, negative) = exponent.unsigned_sub(&whole_exponent);
    assert!(!negative);
    if remainder_exponent.value == InnerUint::from(0) {
      return Some(precise_whole);
    }
    let precise_remainder =
      self.checked_pow_approximation(&remainder_exponent, Self::MAX_APPROXIMATION_ITERATIONS)?;
    precise_whole.checked_mul(&precise_remainder)
  }

  /// Approximate the nth root of a number using Newton's method
  /// https://en.wikipedia.org/wiki/Newton%27s_method
  /// NOTE: this function is private because its accurate range and precision
  /// have not been established.
  fn newtonian_root_approximation(
    &self,
    root: &Self,
    mut guess: Self,
    iterations: u128,
  ) -> Option<Self> {
    let zero = &ZERO_PREC;
    if *self == *zero {
      return Some(Self::zero());
    }
    if *root == *zero {
      return None;
    }
    let one = &ONE_PREC;
    let root_minus_one = root.checked_sub(one)?;
    let root_minus_one_whole = root_minus_one.to_imprecise()?;
    let mut last_guess = guess.clone();
    let precision = Self::precision();
    for _ in 0..iterations {
      // x_k+1 = ((n - 1) * x_k + A / (x_k ^ (n - 1))) / n
      let first_term = root_minus_one.checked_mul(&guess)?;
      let power = guess.checked_pow(root_minus_one_whole);
      let second_term = match power {
        Some(num) => self.checked_div(&num)?,
        None => Self::new(0)?,
      };
      guess = first_term.checked_add(&second_term)?.checked_div(root)?;
      if last_guess.almost_eq(&guess, precision) {
        break;
      } else {
        last_guess = guess.clone();
      }
    }

    if last_guess.almost_eq(&guess, precision) {
      Some(guess)
    } else {
      None // Don't return answers that are not close
    }
  }

  /// Based on testing around the limits, this base is the smallest value that
  /// provides an epsilon 11 digits
  fn minimum_sqrt_base() -> Self {
    Self {
      value: InnerUint::from(0),
    }
  }

  /// Based on testing around the limits, this base is the smallest value that
  /// provides an epsilon of 11 digits
  fn maximum_sqrt_base() -> Self {
    Self::new(std::u128::MAX).unwrap()
  }

  /*
  b = pow/frac
  y = a^b
  ln (y) = bln (a)
  y = e^(b ln (a))
  */
  pub fn pow(&self, exp: &Self) -> Option<Self> {
    if self.eq(&PreciseNumber::zero()) {
      return Some(PreciseNumber::zero())
    }

    let (lg, lg_is_negative) = self.log().unwrap();
    let x = exp.checked_mul(&lg).unwrap();
    x.exp(lg_is_negative)
  }

  /// Approximate the square root using Newton's method.  Based on testing,
  /// this provides a precision of 11 digits for inputs between 0 and u128::MAX
  pub fn sqrt(&self) -> Option<Self> {
    if self.less_than(&Self::minimum_sqrt_base()) || self.greater_than(&Self::maximum_sqrt_base()) {
      return None;
    }
    let two = PreciseNumber::new(2)?;
    let one = PreciseNumber::new(1)?;
    // A good initial guess is the average of the interval that contains the
    // input number.  For all numbers, that will be between 1 and the given number.
    let guess = self.checked_add(&one)?.checked_div(&two)?;
    self.newtonian_root_approximation(&two, guess, Self::MAX_APPROXIMATION_ITERATIONS)
  }

  pub fn print(&self) {
    let whole = self.floor().unwrap().to_imprecise().unwrap();
    let decimals = self
      .checked_sub(&PreciseNumber::new(whole).unwrap()).unwrap()
      .checked_mul(&PreciseNumber::new(ONE).unwrap()).unwrap().to_imprecise().unwrap();
    msg!("{}.{:0>width$}", whole, decimals, width = 18);
  }
}

#[cfg(test)]
mod tests {
  use super::*;
use anchor_lang::solana_program::log::sol_log_compute_units;
use proptest::prelude::*;

  fn check_pow_approximation(base: InnerUint, exponent: InnerUint, expected: InnerUint) {
    let precision = InnerUint::from(5_000_000_000_000_000_000_u64); // correct to at least 3 decimal places
    let base = PreciseNumber { value: base };
    let exponent = PreciseNumber { value: exponent };
    let root = base
      .checked_pow_approximation(&exponent, PreciseNumber::MAX_APPROXIMATION_ITERATIONS)
      .unwrap();
    let expected = PreciseNumber { value: expected };
    assert!(root.almost_eq(&expected, precision));
  }

  #[test]
  fn test_root_approximation() {
    let one = one();
    // square root
    check_pow_approximation(one / 4, one / 2, one / 2); // 1/2
    check_pow_approximation(
      one * 11 / 10,
      one / 2,
      InnerUint::from(1_048808848161_000000000000u128),
    ); // 1.048808848161

    // 5th root
    check_pow_approximation(
      one * 4 / 5,
      one * 2 / 5,
      InnerUint::from(914610103850_000000000000u128),
    );
    // 0.91461010385

    // 10th root
    check_pow_approximation(
      one / 2,
      one * 4 / 50,
      InnerUint::from(946057646730_000000000000u128),
    );
    // 0.94605764673
  }

  fn check_pow_fraction(
    base: InnerUint,
    exponent: InnerUint,
    expected: InnerUint,
    precision: InnerUint,
  ) {
    let base = PreciseNumber { value: base };
    let exponent = PreciseNumber { value: exponent };
    let power = base.checked_pow_fraction(&exponent).unwrap();
    let expected = PreciseNumber { value: expected };
    assert!(power.almost_eq(&expected, precision));
  }

  #[test]
  fn test_pow() {
    let precision = InnerUint::from(5_000_000_000_000_u128); // correct to at least 12 decimal places
    let test = PreciseNumber::new(8).unwrap();
    let sqrt = test.pow(&HALF).unwrap();
    let expected = PreciseNumber::new(28284271247461903).unwrap().checked_div(&PreciseNumber::new(10000000000000000).unwrap()).unwrap();
    assert!(sqrt.almost_eq(&expected, precision));

    let test2 = PreciseNumber::new(55).unwrap().checked_div(&PreciseNumber::new(100).unwrap()).unwrap();
    let squared = test2.pow(&TWO_PREC).unwrap();
    let expected = PreciseNumber::new(3025).unwrap().checked_div(&PreciseNumber::new(10000).unwrap()).unwrap();
    assert!(squared.almost_eq(&expected, precision));
  }

  #[test]
  fn test_pow_fraction() {
    let one = one();
    let precision = InnerUint::from(50_000_000_000_000_000_000_u128); // correct to at least 3 decimal places
    let less_precision = precision * 1_000; // correct to at least 1 decimal place
    check_pow_fraction(one, one, one, precision);
    check_pow_fraction(
      one * 20 / 13,
      one * 50 / 3,
      InnerUint::from(1312_534484739100_000000000000u128),
      precision,
    ); // 1312.5344847391
    check_pow_fraction(
      one * 2 / 7,
      one * 49 / 4,
      InnerUint::from(2163_000000000000u128),
      precision,
    );
    check_pow_fraction(
      one * 5000 / 5100,
      one / 9,
      InnerUint::from(997802126900_000000000000u128),
      precision,
    ); // 0.99780212695
       // results get less accurate as the base gets further from 1, so allow
       // for a greater margin of error
    check_pow_fraction(
      one * 2,
      one * 27 / 5,
      InnerUint::from(42_224253144700_000000000000u128),
      less_precision,
    ); // 42.2242531447
    check_pow_fraction(
      one * 18 / 10,
      one * 11 / 3,
      InnerUint::from(8_629769290500_000000000000u128),
      less_precision,
    ); // 8.629769290
  }

  #[test]
  fn test_exp() {
    let precision = InnerUint::from(5_000_000_000_u128); // correct to at least 9 decimal places
    let half = PreciseNumber { value: half() };
    assert!(half.exp(false).unwrap().almost_eq(
      &PreciseNumber::new(16487212707001282).unwrap().checked_div(&PreciseNumber::new(10000000000000000).unwrap()).unwrap(),
      precision
    ));

    let three_half = PreciseNumber::new(15).unwrap().checked_div(&PreciseNumber::new(10).unwrap()).unwrap();
    assert!(three_half.exp(false).unwrap().almost_eq(
      &PreciseNumber::new(44816890703380645).unwrap().checked_div(&PreciseNumber::new(10000000000000000).unwrap()).unwrap(),
      precision
    ));

    let point_one = PreciseNumber::new(1).unwrap().checked_div(&PreciseNumber::new(10).unwrap()).unwrap();
    assert!(point_one.exp(false).unwrap().almost_eq(
      &PreciseNumber::new(11051709180756477).unwrap().checked_div(&PreciseNumber::new(10000000000000000).unwrap()).unwrap(),
      precision
    ));

    let negative = PreciseNumber::new(55).unwrap().checked_div(&PreciseNumber::new(100).unwrap()).unwrap();
    assert!(negative.exp(true).unwrap().almost_eq(
      &PreciseNumber::new(5769498103804866).unwrap().checked_div(&PreciseNumber::new(10000000000000000).unwrap()).unwrap(),
      precision
    ));
  }

  #[test]
  fn test_log() {
    let precision = InnerUint::from(5_000_000_000_u128); // correct to at least 9 decimal places
    
    let test = PreciseNumber::new(9).unwrap();
    let log = test.log().unwrap().0;
    let expected = PreciseNumber::new(21972245773362196).unwrap().checked_div(&PreciseNumber::new(10000000000000000).unwrap()).unwrap();
    assert!(log.almost_eq(&expected, precision));

    let test2 = PreciseNumber::new(2).unwrap();
    assert!(test2.log().unwrap().0.almost_eq(
      &PreciseNumber::new(6931471805599453).unwrap().checked_div(&PreciseNumber::new(10000000000000000).unwrap()).unwrap(),
      precision
    ));

    let test3 = &PreciseNumber::new(12).unwrap().checked_div(&PreciseNumber::new(10).unwrap()).unwrap();
    assert!(test3.log().unwrap().0.almost_eq(
      &PreciseNumber::new(1823215567939546).unwrap().checked_div(&PreciseNumber::new(10000000000000000).unwrap()).unwrap(),
      precision
    ));

    let test5 = &PreciseNumber::new(15).unwrap().checked_div(&PreciseNumber::new(10).unwrap()).unwrap();
    assert!(test5.log().unwrap().0.almost_eq(
      &PreciseNumber::new(4054651081081644).unwrap().checked_div(&PreciseNumber::new(10000000000000000).unwrap()).unwrap(),
      precision
    ));

    let test6 = PreciseNumber::new(4).unwrap().checked_div(&PreciseNumber::new(1000000).unwrap()).unwrap();
    assert!(test6.log().unwrap().0.almost_eq(
      &PreciseNumber::new(12429216196844383).unwrap().checked_div(&PreciseNumber::new(1000000000000000).unwrap()).unwrap(),
      precision
    ));
  }

  #[test]
  fn test_newtonian_approximation() {
    // square root
    let test = PreciseNumber::new(9).unwrap();
    let nth_root = PreciseNumber::new(2).unwrap();
    let guess = test.checked_div(&nth_root).unwrap();
    let root = test
      .newtonian_root_approximation(
        &nth_root,
        guess,
        PreciseNumber::MAX_APPROXIMATION_ITERATIONS,
      )
      .unwrap()
      .to_imprecise()
      .unwrap();
    assert_eq!(root, 3); // actually 3

    let test = PreciseNumber::new(101).unwrap();
    let nth_root = PreciseNumber::new(2).unwrap();
    let guess = test.checked_div(&nth_root).unwrap();
    let root = test
      .newtonian_root_approximation(
        &nth_root,
        guess,
        PreciseNumber::MAX_APPROXIMATION_ITERATIONS,
      )
      .unwrap()
      .to_imprecise()
      .unwrap();
    assert_eq!(root, 10); // actually 10.049875

    let test = PreciseNumber::new(1_000_000_000).unwrap();
    let nth_root = PreciseNumber::new(2).unwrap();
    let guess = test.checked_div(&nth_root).unwrap();
    let root = test
      .newtonian_root_approximation(
        &nth_root,
        guess,
        PreciseNumber::MAX_APPROXIMATION_ITERATIONS,
      )
      .unwrap()
      .to_imprecise()
      .unwrap();
    assert_eq!(root, 31_623); // actually 31622.7766

    // 5th root
    let test = PreciseNumber::new(500).unwrap();
    let nth_root = PreciseNumber::new(5).unwrap();
    let guess = test.checked_div(&nth_root).unwrap();
    let root = test
      .newtonian_root_approximation(
        &nth_root,
        guess,
        PreciseNumber::MAX_APPROXIMATION_ITERATIONS,
      )
      .unwrap()
      .to_imprecise()
      .unwrap();
    assert_eq!(root, 3); // actually 3.46572422
  }

  fn check_square_root(check: &PreciseNumber) {
    let epsilon = PreciseNumber {
      value: InnerUint::from(10_000000000000_u64),
    }; // correct within 11 decimals
    let one = PreciseNumber::one();
    let one_plus_epsilon = one.checked_add(&epsilon).unwrap();
    let one_minus_epsilon = one.checked_sub(&epsilon).unwrap();
    // let approximate_root = check.sqrt().unwrap();
    let approximate_root = check.sqrt().unwrap();
    let lower_bound = approximate_root
      .checked_mul(&one_minus_epsilon)
      .unwrap()
      .checked_pow(2)
      .unwrap();
    let upper_bound = approximate_root
      .checked_mul(&one_plus_epsilon)
      .unwrap()
      .checked_pow(2)
      .unwrap();
    assert!(check.less_than_or_equal(&upper_bound));
    assert!(check.greater_than_or_equal(&lower_bound));
  }

  #[test]
  fn test_square_root_min_max() {
    let test_roots = [
      PreciseNumber::minimum_sqrt_base(),
      PreciseNumber::maximum_sqrt_base(),
    ];
    for i in test_roots.iter() {
      check_square_root(i);
    }
  }

  #[test]
  fn test_floor() {
    let whole_number = PreciseNumber::new(2).unwrap();
    let mut decimal_number = PreciseNumber::new(2).unwrap();
    decimal_number.value += InnerUint::from(1);
    let floor = decimal_number.floor().unwrap();
    let floor_again = floor.floor().unwrap();
    assert_eq!(whole_number.value, floor.value);
    assert_eq!(whole_number.value, floor_again.value);
  }

  #[test]
  fn test_ceiling() {
    let whole_number = PreciseNumber::new(2).unwrap();
    let mut decimal_number = PreciseNumber::new(2).unwrap();
    decimal_number.value -= InnerUint::from(1);
    let ceiling = decimal_number.ceiling().unwrap();
    let ceiling_again = ceiling.ceiling().unwrap();
    assert_eq!(whole_number.value, ceiling.value);
    assert_eq!(whole_number.value, ceiling_again.value);
  }

  // Keep around for testing. Can drop a debugger and find out the binary for the inner unit
  // #[test]
  // fn get_constants() {
  //   let one = PreciseNumber { value: InnerUint::from(ONE) };
  //   let two = PreciseNumber::new(2).unwrap();
  //   let sqrt_two_over_two = PreciseNumber::new(7071067811865476).unwrap().checked_div(
  //     &PreciseNumber::new(10000000000000000).unwrap()
  //   ).unwrap();
  //   // Purposefully take 2 decimals off of ln2hi to keep precision
  //   let ln2hi = PreciseNumber::new(693147180369123816490_u128).unwrap().checked_div(
  //     &PreciseNumber::new(1_000_000_000_000_000_000_0).unwrap()
  //   ).unwrap();
  //   let ln2scale = &PreciseNumber::new(100).unwrap();

  //   let ln2lo_scale = &PreciseNumber::new(1000000000000000000000000000000).unwrap();
  //   let ln2lo = PreciseNumber::new(190821492927058770002_u128).unwrap();
  //   let l1 = PreciseNumber::new(6666666666666735130_u128).unwrap().checked_div(
  //     &PreciseNumber::new(10000000000000000000).unwrap()
  //   ).unwrap();
  //   let l2 = PreciseNumber::new(3999999999940941908_u128).unwrap().checked_div(
  //     &PreciseNumber::new(10000000000000000000).unwrap()
  //   ).unwrap();
  //   let l3 = PreciseNumber::new(2857142874366239149_u128).unwrap().checked_div(
  //     &PreciseNumber::new(10000000000000000000).unwrap()
  //   ).unwrap();
  //   let l4 = PreciseNumber::new(2222219843214978396_u128).unwrap().checked_div(
  //     &PreciseNumber::new(10000000000000000000).unwrap()
  //   ).unwrap();
  //   let l5 = PreciseNumber::new(1818357216161805012_u128).unwrap().checked_div(
  //     &PreciseNumber::new(10000000000000000000).unwrap()
  //   ).unwrap();
  //   let l6 = PreciseNumber::new(1531383769920937332_u128).unwrap().checked_div(
  //     &PreciseNumber::new(10000000000000000000).unwrap()
  //   ).unwrap();
  //   let l7 = PreciseNumber::new(1479819860511658591_u128).unwrap().checked_div(
  //     &PreciseNumber::new(10000000000000000000).unwrap()
  //   ).unwrap();

  //   let invln2 = PreciseNumber::new(144269504088896338700_u128).unwrap().checked_div(
  //     &PreciseNumber::new(100000000000000000000).unwrap()
  //   ).unwrap();

  //   let halfln2 = PreciseNumber::new(34657359027997264_u128).unwrap().checked_div(
  //     &PreciseNumber::new(100000000000000000).unwrap()
  //   ).unwrap();

  //   let threehalfln2 = PreciseNumber::new(10397207708399179_u128).unwrap().checked_div(
  //     &PreciseNumber::new(10000000000000000).unwrap()
  //   ).unwrap();


  //   let half = PreciseNumber::new(5_u128).unwrap().checked_div(
  //     &PreciseNumber::new(10).unwrap()
  //   ).unwrap();

  //   let p1 = PreciseNumber::new(166666666666666019037_u128).unwrap().checked_div(
  //     &PreciseNumber::new(1000000000000000000000).unwrap()
  //   ).unwrap();

  //   let p2 = PreciseNumber::new(277777777770155933842_u128).unwrap().checked_div(
  //     &PreciseNumber::new(100000000000000000000000).unwrap()
  //   ).unwrap();

  //   let p3 = PreciseNumber::new(661375632143793436117_u128).unwrap().checked_div(
  //     &PreciseNumber::new(10000000000000000000000000).unwrap()
  //   ).unwrap();

  //   let p4 = PreciseNumber::new(165339022054652515390_u128).unwrap().checked_div(
  //     &PreciseNumber::new(100000000000000000000000000).unwrap()
  //   ).unwrap();

  //   let p5 = PreciseNumber::new(413813679705723846039_u128).unwrap().checked_div(
  //     &PreciseNumber::new(10000000000000000000000000000).unwrap()
  //   ).unwrap();

  //   l1.print();
  //   l2.print();
  //   l3.print();
  //   l4.print();
  //   l5.print();
  //   l6.print();
  //   l7.print();
  //   ln2hi.print();
  //   ln2lo.print();
  //   sqrt_two_over_two.print();

  //   let s = 1;
  // }

  proptest! {
      #[test]
      fn test_square_root(a in 0..u128::MAX) {
          let a = PreciseNumber { value: InnerUint::from(a) };
          check_square_root(&a);
      }
  }
}
