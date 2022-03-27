use crate::state::*;
use anchor_lang::{
  prelude::*,
  solana_program::{program::invoke, system_instruction},
};
use anchor_spl::token::Mint;

use super::{
  buy_account_common::*,
  buy_arg_common::BuyV0Args,
  buy_wrapped_sol_v0::{buy_wrapped_sol, BuyWrappedSolV0, BuyWrappedSolV0Args},
  common::{buy_shared_logic, mint_to_dest, BuyAmount},
};

#[derive(Accounts)]
pub struct BuyNativeV0<'info> {
  pub common: BuyCommonV0<'info>,
  #[account(mut)]
  pub source: Signer<'info>,

  #[account(
    has_one = sol_storage,
    has_one = wrapped_sol_mint,
    constraint = common.base_mint.key() == state.wrapped_sol_mint
  )]
  pub state: Box<Account<'info, ProgramStateV0>>,
  #[account(mut, constraint = wrapped_sol_mint.mint_authority.unwrap() == mint_authority.key())]
  pub wrapped_sol_mint: Account<'info, Mint>,
  /// CHECK: Checked by cpi to spl token
  pub mint_authority: AccountInfo<'info>,
  #[account(mut)]
  pub sol_storage: SystemAccount<'info>,
  pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<BuyNativeV0>, args: BuyV0Args) -> Result<()> {
  let BuyAmount {
    price,
    base_royalties,
    target_royalties,
    total_amount,
  } = buy_shared_logic(&mut ctx.accounts.common, &args)?;

  mint_to_dest(
    total_amount,
    target_royalties,
    &ctx.accounts.common,
    &ctx.accounts.common.destination.to_account_info(),
  )?;

  // msg!(
  //   "Total price is {}, with {} to base royalties and {} to target royalties",
  //   price + base_royalties,
  //   base_royalties,
  //   target_royalties
  // );
  let source = &ctx.accounts.source;
  let base_storage_account = &ctx.accounts.common.base_storage;
  let base_royalties_account = ctx
    .accounts
    .common
    .buy_base_royalties
    .clone()
    .to_account_info();

  if base_royalties > 0 {
    // msg!("Paying out {} base royalties", base_royalties);
    invoke(
      &system_instruction::transfer(&source.key(), &base_royalties_account.key(), base_royalties),
      &[
        source.to_account_info().clone(),
        base_royalties_account.to_account_info().clone(),
        ctx.accounts.system_program.to_account_info().clone(),
      ],
    )?;
  }

  // msg!("Paying out {} to base storage", price);
  buy_wrapped_sol(
    &BuyWrappedSolV0 {
      state: ctx.accounts.state.clone(),
      wrapped_sol_mint: ctx.accounts.wrapped_sol_mint.clone(),
      mint_authority: ctx.accounts.mint_authority.clone(),
      sol_storage: ctx.accounts.sol_storage.clone(),
      source: source.clone(),
      destination: base_storage_account.clone(),
      token_program: ctx.accounts.common.token_program.clone(),
      system_program: ctx.accounts.system_program.clone(),
    },
    &BuyWrappedSolV0Args { amount: price },
  )?;

  Ok(())
}
