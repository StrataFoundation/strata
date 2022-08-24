use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateCurveV0<'info> {
  #[account(
    mut,
    constraint = token_bonding.curve_authority.ok_or(error!(ErrorCode::NoAuthority))? == curve_authority.key(),
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub curve_authority: Signer<'info>,
  pub curve: Box<Account<'info, CurveV0>>,
}

pub fn handler(ctx: Context<UpdateCurveV0>) -> Result<()> {
  let bonding = &mut ctx.accounts.token_bonding;

  bonding.curve = ctx.accounts.curve.key();
  Ok(())
}
