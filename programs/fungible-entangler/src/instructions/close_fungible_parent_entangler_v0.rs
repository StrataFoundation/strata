use crate::{
  error::ErrorCode,
  state::*,
  util::{close_token_account, CloseTokenAccount},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct CloseFungibleParentEntanglerV0<'info> {
  /// CHECK: Just used to get a refund of sol from closing the child entangler.
  #[account(mut)]
  pub refund: AccountInfo<'info>,
  pub authority: Signer<'info>,
  #[account(
    mut,
    close = refund,
    constraint = parent_entangler.authority.ok_or(error!(ErrorCode::NoAuthority))? == authority.key(),
    constraint = parent_entangler.num_children == 0,
    has_one = parent_storage,
  )]
  pub parent_entangler: Box<Account<'info, FungibleParentEntanglerV0>>,
  #[account(mut)]
  pub parent_storage: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CloseFungibleParentEntanglerV0>) -> Result<()> {
  let entangler = &mut ctx.accounts.parent_entangler;
  let parent_entangler_seeds: &[&[&[u8]]] = &[&[
    b"entangler",
    entangler.parent_mint.as_ref(),
    &entangler.dynamic_seed,
    &[entangler.bump_seed],
  ]];

  msg!("Closing parent storage");
  close_token_account(CpiContext::new_with_signer(
    ctx.accounts.token_program.to_account_info().clone(),
    CloseTokenAccount {
      from: ctx.accounts.parent_storage.to_account_info().clone(),
      to: ctx.accounts.refund.to_account_info().clone(),
      authority: entangler.to_account_info().clone(),
    },
    parent_entangler_seeds,
  ))?;

  Ok(())
}
