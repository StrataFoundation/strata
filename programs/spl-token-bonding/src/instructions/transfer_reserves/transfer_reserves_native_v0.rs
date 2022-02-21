use super::{
  transfer_reserves_account_common::*, transfer_reserves_arg_common::TransferReservesV0Args,
};
use crate::{
  instructions::sell::sell_wrapped_sol_v0::{
    sell_wrapped_sol, SellWrappedSolV0, SellWrappedSolV0Args,
  },
  state::*,
};
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

#[derive(Accounts)]
#[instruction(args: TransferReservesV0Args)]
pub struct TransferReservesNativeV0<'info> {
  pub common: TransferReservesV0Common<'info>,
  #[account(mut)]
  pub destination: SystemAccount<'info>,

  #[account(
    has_one = sol_storage,
    has_one = wrapped_sol_mint
  )]
  pub state: Box<Account<'info, ProgramStateV0>>,
  #[account(
    mut,
    constraint = wrapped_sol_mint.mint_authority.unwrap() == mint_authority.key(),
    constraint = wrapped_sol_mint.key() == common.base_mint.key()
  )]
  pub wrapped_sol_mint: Account<'info, Mint>,
  /// CHECK: Used in cpi
  pub mint_authority: AccountInfo<'info>,
  #[account(mut)]
  pub sol_storage: SystemAccount<'info>,

  pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<TransferReservesNativeV0>, args: TransferReservesV0Args) -> Result<()> {
  let token_bonding = &mut ctx.accounts.common.token_bonding;
  let bonding_seeds: &[&[&[u8]]] = &[&[
    b"token-bonding",
    token_bonding.target_mint.as_ref(),
    &token_bonding.index.to_le_bytes(),
    &[token_bonding.bump_seed],
  ]];

  sell_wrapped_sol(
    &SellWrappedSolV0 {
      state: ctx.accounts.state.clone(),
      wrapped_sol_mint: ctx.accounts.wrapped_sol_mint.clone(),
      sol_storage: ctx.accounts.sol_storage.clone(),
      source: ctx.accounts.common.base_storage.clone(),
      owner: token_bonding.to_account_info(),
      destination: SystemAccount::try_from(&ctx.accounts.destination.to_account_info())?,
      token_program: ctx.accounts.common.token_program.clone(),
      system_program: ctx.accounts.system_program.clone(),
    },
    &SellWrappedSolV0Args {
      amount: args.amount,
      all: false,
    },
    Some(bonding_seeds),
  )?;

  Ok(())
}
