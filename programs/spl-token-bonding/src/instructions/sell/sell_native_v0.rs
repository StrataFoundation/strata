use super::{
  common::{burn_and_pay_sell_royalties, sell_shared_logic, SellAmount},
  sell_account_common::*,
  sell_arg_common::SellV0Args,
  sell_wrapped_sol_v0::{sell_wrapped_sol, SellWrappedSolV0, SellWrappedSolV0Args},
};
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

#[derive(Accounts)]
pub struct SellNativeV0<'info> {
  pub common: SellCommonV0<'info>,

  #[account(mut)]
  pub destination: SystemAccount<'info>,

  #[account(
    has_one = sol_storage,
    has_one = wrapped_sol_mint
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

pub fn handler(ctx: Context<SellNativeV0>, args: SellV0Args) -> Result<()> {
  let amount = args.target_amount;

  let SellAmount {
    reclaimed,
    base_royalties,
    target_royalties,
  } = sell_shared_logic(&mut ctx.accounts.common, &args)?;

  // msg!(
  //   "Total reclaimed is {}, with {} to base royalties, {} to target royalties",
  //   reclaimed,
  //   base_royalties,
  //   target_royalties
  // );

  burn_and_pay_sell_royalties(amount, target_royalties, &ctx.accounts.common)?;

  let base_storage_account = &ctx.accounts.common.base_storage.clone();
  let destination = &ctx.accounts.destination;
  let token_bonding = &mut ctx.accounts.common.token_bonding;
  let target_mint = &mut ctx.accounts.common.target_mint;

  // msg!(
  //   "Paying out {} from base storage, {}",
  //   reclaimed,
  //   ctx.accounts.common.base_storage.amount
  // );
  let bonding_seeds: &[&[&[u8]]] = &[&[
    b"token-bonding",
    target_mint.to_account_info().key.as_ref(),
    &token_bonding.index.to_le_bytes(),
    &[token_bonding.bump_seed],
  ]];

  sell_wrapped_sol(
    &SellWrappedSolV0 {
      state: ctx.accounts.state.clone(),
      wrapped_sol_mint: ctx.accounts.wrapped_sol_mint.clone(),
      sol_storage: ctx.accounts.sol_storage.clone(),
      source: base_storage_account.clone(),
      owner: token_bonding.to_account_info(),
      destination: destination.clone(),
      token_program: ctx.accounts.common.token_program.clone(),
      system_program: ctx.accounts.system_program.clone(),
    },
    &SellWrappedSolV0Args {
      amount: reclaimed,
      all: false,
    },
    Some(bonding_seeds),
  )?;

  if base_royalties > 0 && ctx.accounts.common.sell_base_royalties.lamports() > 0 {
    msg!(
      "Paying out {} from base storage to base royalties",
      base_royalties
    );
    sell_wrapped_sol(
      &SellWrappedSolV0 {
        state: ctx.accounts.state.clone(),
        wrapped_sol_mint: ctx.accounts.wrapped_sol_mint.clone(),
        sol_storage: ctx.accounts.sol_storage.clone(),
        source: base_storage_account.clone(),
        owner: token_bonding.to_account_info(),
        destination: SystemAccount::try_from(&ctx.accounts.common.sell_base_royalties)?,
        token_program: ctx.accounts.common.token_program.clone(),
        system_program: ctx.accounts.system_program.clone(),
      },
      &SellWrappedSolV0Args {
        amount: base_royalties,
        all: false,
      },
      Some(bonding_seeds),
    )?;
  }

  Ok(())
}
