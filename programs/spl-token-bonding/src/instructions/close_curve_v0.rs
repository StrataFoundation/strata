use crate::{
  error::ErrorCode,
  state::*,
  util::{close_token_account, CloseTokenAccount},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CloseCurveV0<'info> {
  #[account(mut)]
  pub refund: AccountInfo<'info>,
  #[account(
    mut,
    constraint = token_bonding.curve_authority.ok_or(error!(ErrorCode::NoAuthority))? == curve_authority.key(),
    has_one = curve,
  )]
  pub token_bonding: Account<'info, TokenBondingV0>,
  pub curve: Box<Account<'info, CurveV0>>,
  pub curve_authority: Signer<'info>,
  pub token_program: Program<'info, Token>,  
}

pub fn handler(ctx: Context<CloseCurveV0>) -> Result<()> {
  let token_bonding = &mut ctx.accounts.token_bonding;
  let bonding_seeds: &[&[&[u8]]] = &[&[
    b"token-bonding",
    ctx.accounts.target_mint.to_account_info().key.as_ref(),
    &token_bonding.index.to_le_bytes(),
    &[token_bonding.bump_seed],
  ]];

  if ctx.accounts.curve.owner == token_bonding.key() {
    close_token_account(CpiContext::new_with_signer(
      ctx.accounts.token_program.to_account_info().clone(),
      CloseTokenAccount {
        from : ctx.accounts.curve.to_account_info().clone(),
        to: ctx.accounts.refund.to_account_info().clone(),
        authority: token_bonding.to_account_info().clone(),
      },
      bonding_seeds
    ))
  } 

  Ok(())
}