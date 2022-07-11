use crate::{
  error::ErrorCode,
  state::*,
  util::{close_token_account, CloseTokenAccount},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct CloseFungibleChildEntanglerV0<'info> {
  /// CHECK: Just used to get a refund of sol from closing the child entangler.
  #[account(mut)]
  pub refund: AccountInfo<'info>,
  pub authority: Signer<'info>,
  #[account(
    mut,
    constraint = parent_entangler.authority.ok_or(error!(ErrorCode::NoAuthority))? == authority.key(),
  )]
  pub parent_entangler: Box<Account<'info, FungibleParentEntanglerV0>>,
  #[account(
    mut,
    close = refund,
    has_one = parent_entangler,
    has_one = child_storage,
  )]
  pub entangler: Box<Account<'info, FungibleChildEntanglerV0>>,
  #[account(mut)]
  pub child_storage: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CloseFungibleChildEntanglerV0>) -> Result<()> {
  let entangler = &mut ctx.accounts.entangler;
  let child_entangler_seeds: &[&[&[u8]]] = &[&[
    b"entangler",
    entangler.parent_entangler.as_ref(),
    entangler.child_mint.as_ref(),
    &[entangler.bump_seed],
  ]];

  ctx.accounts.parent_entangler.num_children -= 1;

  msg!("Closing child storage");
  close_token_account(CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info().clone(),
    CloseTokenAccount {
      from: ctx.accounts.child_storage.to_account_info().clone(),
      to: ctx.accounts.refund.to_account_info().clone(),
      authority: entangler.to_account_info().clone(),
    },
    child_entangler_seeds,
  ))?;

  Ok(())
}
