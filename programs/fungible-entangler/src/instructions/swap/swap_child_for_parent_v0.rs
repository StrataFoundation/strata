use super::{
  account::*,
  arg::SwapV0Args,
  common::{swap_shared_logic, SwapAmount},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

#[derive(Accounts)]
#[instruction(args: SwapV0Args)]
pub struct SwapChildForParentV0<'info> {
  pub common: SwapCommonV0<'info>,
}

pub fn handler(ctx: Context<SwapChildForParentV0>, args: SwapV0Args) -> Result<()> {
  let SwapAmount { amount } = swap_shared_logic(
    &ctx.accounts.common.parent_entangler,
    &ctx.accounts.common.child_entangler,
    &ctx.accounts.common.parent_storage,
    &ctx.accounts.common.source,
    &ctx.accounts.common.clock,
    &args,
  )?;

  let parent_entangler = &mut ctx.accounts.common.parent_entangler;
  let source = ctx.accounts.common.source.to_account_info();
  let destination = ctx.accounts.common.destination.to_account_info();
  let parent_storage = ctx.accounts.common.parent_storage.to_account_info();
  let child_storage = ctx.accounts.common.child_storage.to_account_info();
  let source_authority = ctx.accounts.common.source_authority.to_account_info();
  let token_program = ctx.accounts.common.token_program.to_account_info();

  msg!("Swapping out from source to child storage");
  token::transfer(
    CpiContext::new(
      token_program.clone(),
      Transfer {
        from: source.clone(),
        to: child_storage.clone(),
        authority: source_authority.clone(),
      },
    ),
    amount,
  )?;

  let parent_entangler_seeds: &[&[&[u8]]] = &[&[
    b"entangler",
    parent_entangler.parent_mint.as_ref(),
    &parent_entangler.dynamic_seed,
    &[parent_entangler.bump_seed],
  ]];

  msg!("Swapping out from parent storage to source");
  token::transfer(
    CpiContext::new_with_signer(
      token_program.clone(),
      Transfer {
        from: parent_storage.clone(),
        to: destination.clone(),
        authority: parent_entangler.to_account_info().clone(),
      },
      parent_entangler_seeds,
    ),
    amount,
  )?;

  Ok(())
}
