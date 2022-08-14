use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct TransferChildStorageV0<'info> {
  pub authority: Signer<'info>,
  #[account(
    mut,
    constraint = parent_entangler.authority.ok_or(error!(ErrorCode::NoAuthority))? == authority.key(),
  )]
  pub parent_entangler: Box<Account<'info, FungibleParentEntanglerV0>>,
  #[account(
    has_one = parent_entangler,
    has_one = child_storage,
  )]
  pub entangler: Box<Account<'info, FungibleChildEntanglerV0>>,
  #[account(mut)]
  pub child_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TransferChildStorageArgsV0 {
  pub amount: u64,
}

pub fn handler(
  ctx: Context<TransferChildStorageV0>,
  args: TransferChildStorageArgsV0,
) -> Result<()> {
  let entangler = &mut ctx.accounts.entangler;
  let child_entangler_seeds: &[&[&[u8]]] = &[&[
    b"entangler",
    entangler.parent_entangler.as_ref(),
    entangler.child_mint.as_ref(),
    &[entangler.bump_seed],
  ]];

  msg!("Transfering child storage {}", args.amount);
  token::transfer(
    CpiContext::new_with_signer(
      ctx.accounts.token_program.to_account_info().clone(),
      Transfer {
        from: ctx.accounts.child_storage.to_account_info().clone(),
        to: ctx.accounts.destination.to_account_info().clone(),
        authority: entangler.to_account_info().clone(),
      },
      child_entangler_seeds,
    ),
    args.amount,
  )?;

  Ok(())
}
