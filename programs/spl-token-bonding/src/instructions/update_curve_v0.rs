use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateCurveV0Args {
  pub curve_authority: Option<Pubkey>,
}

#[derive(Accounts)]
#[instruction(args: UpdateCurveV0Args)]
pub struct UpdateCurveV0<'info> {
  #[account(
    mut,
    constraint = token_bonding.curve_authority.ok_or(error!(ErrorCode::NoAuthority))? == curve_authority.key()
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub curve_authority: Signer<'info>,
  pub curve: Box<Account<'info, CurveV0>>,
}

pub fn handler(ctx: Context<UpdateCurveV0>, args: UpdateCurveV0Args) -> Result<()> {
  let bonding = &mut ctx.accounts.token_bonding;

  bonding.curve_authority = args.curve_authority;
  bonding.curve = ctx.accounts.curve.key();

  Ok(())
}
