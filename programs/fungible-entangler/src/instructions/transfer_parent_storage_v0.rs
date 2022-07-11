use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct TransferParentStorageV0<'info> {
  pub authority: Signer<'info>,
  #[account(
    mut,
    constraint = parent_entangler.authority.ok_or(error!(ErrorCode::NoAuthority))? == authority.key(),
    has_one = parent_storage,
  )]
  pub parent_entangler: Box<Account<'info, FungibleParentEntanglerV0>>,
  #[account(mut)]
  pub parent_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TransferParentStorageArgsV0 {
  pub amount: u64,
}

pub fn handler(
  ctx: Context<TransferParentStorageV0>,
  args: TransferParentStorageArgsV0,
) -> Result<()> {
  let entangler = &mut ctx.accounts.parent_entangler;
  let parent_entangler_seeds: &[&[&[u8]]] = &[&[
    b"entangler",
    entangler.parent_mint.as_ref(),
    &entangler.dynamic_seed,
    &[entangler.bump_seed],
  ]];

  msg!("Transfering parent storage {}", args.amount);
  token::transfer(
    CpiContext::new_with_signer(
      ctx.accounts.token_program.to_account_info().clone(),
      Transfer {
        from: ctx.accounts.parent_storage.to_account_info().clone(),
        to: ctx.accounts.destination.to_account_info().clone(),
        authority: entangler.to_account_info().clone(),
      },
      parent_entangler_seeds,
    ),
    args.amount,
  )?;

  Ok(())
}
