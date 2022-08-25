use crate::{ error::ErrorCode, state::* };
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateCurveV0Args {
  pub curve_authority: Option<Pubkey>,
}

#[derive(Accounts)]
#[instruction(args: UpdateCurveV0Args)]
pub struct UpdateCurveV0<'info> {
  /// CHECK: Just used for sol refund  
  #[account(mut)]
  pub refund: UncheckedAccount<'info>,
  #[account(
    mut,
    constraint = token_bonding.curve_authority.ok_or(error!(ErrorCode::NoAuthority))? == curve_authority.key(),
    has_one = curve
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub curve_authority: Signer<'info>,
  #[account(
    mut,
    close = refund,
  )]
  pub curve: Box<Account<'info, CurveV0>>,
  pub new_curve: Box<Account<'info, CurveV0>>,
}

pub fn handler(ctx: Context<UpdateCurveV0>, args: UpdateCurveV0Args) -> Result<()> {
  let bonding = &mut ctx.accounts.token_bonding;

  bonding.curve_authority = args.curve_authority;
  bonding.curve = ctx.accounts.new_curve.key();
  
  Ok(())
}
