use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateCurveV0Args {
  pub definition: PiecewiseCurve,
}

pub fn primitive_curve_is_valid(curve: &PrimitiveCurve) -> bool {
  match *curve {
    PrimitiveCurve::ExponentialCurveV0 { frac, c, b, pow } => {
      (c == 0 || b == 0) && frac > 0 && frac <= 10 && pow <= 10
    }
    PrimitiveCurve::TimeDecayExponentialCurveV0 { .. } => true,
  }
}

pub fn curve_is_valid(curve: &PiecewiseCurve) -> bool {
  match curve {
    PiecewiseCurve::TimeV0 { curves } =>
    // All inner curves are valid
    {
      curves.iter().all(|c| primitive_curve_is_valid(&c.curve) && c.offset >= 0) &&
        // The first curve starts at time 0
        curves.get(0).map(|c| c.offset).unwrap_or(1) == 0 &&
        // The curves list is ordered by offset
        curves.windows(2).all(|c| c[0].offset <= c[1].offset)
    }
  }
}

#[derive(Accounts)]
#[instruction(args: PiecewiseCurve)]
pub struct InitializeCurveV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(zero)]
  pub curve: Account<'info, CurveV0>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeCurveV0>, args: CreateCurveV0Args) -> Result<()> {
  if !curve_is_valid(&args.definition) {
    return Err(error!(ErrorCode::InvalidCurve));
  }

  let curve = &mut ctx.accounts.curve;
  curve.definition = args.definition;

  Ok(())
}
