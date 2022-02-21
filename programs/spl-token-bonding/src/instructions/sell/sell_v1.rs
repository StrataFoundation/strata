use super::{
  common::{burn_and_pay_sell_royalties, sell_shared_logic, SellAmount},
  sell_account_common::*,
  sell_arg_common::SellV0Args,
};
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct SellV1<'info> {
  pub common: SellCommonV0<'info>,

  #[account(
    constraint = state.wrapped_sol_mint != common.base_mint.key()
  )]
  pub state: Box<Account<'info, ProgramStateV0>>,

  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,
}

pub fn handler(ctx: Context<SellV1>, args: SellV0Args) -> Result<()> {
  let SellAmount {
    reclaimed,
    base_royalties,
    target_royalties,
  } = sell_shared_logic(&mut ctx.accounts.common, &args)?;

  msg!(
    "Total reclaimed is {}, with {} to base royalties, {} to target royalties",
    reclaimed,
    base_royalties,
    target_royalties
  );

  burn_and_pay_sell_royalties(args.target_amount, target_royalties, &ctx.accounts.common)?;

  let token_program = ctx.accounts.common.token_program.to_account_info();
  let base_storage_account = ctx.accounts.common.base_storage.to_account_info();
  let destination = ctx.accounts.destination.to_account_info();
  let target_mint = ctx.accounts.common.target_mint.to_account_info();
  let token_bonding = &mut ctx.accounts.common.token_bonding;

  msg!(
    "Paying out {} from base storage, {}",
    reclaimed,
    ctx.accounts.common.base_storage.amount
  );
  let bonding_seeds: &[&[&[u8]]] = &[&[
    b"token-bonding",
    target_mint.to_account_info().key.as_ref(),
    &token_bonding.index.to_le_bytes(),
    &[token_bonding.bump_seed],
  ]];
  token::transfer(
    CpiContext::new_with_signer(
      token_program.clone(),
      Transfer {
        from: base_storage_account.clone(),
        to: destination.clone(),
        authority: token_bonding.to_account_info().clone(),
      },
      bonding_seeds,
    ),
    reclaimed,
  )?;

  if base_royalties > 0 {
    msg!(
      "Paying out {} from base storage to base royalties",
      base_royalties
    );
    token::transfer(
      CpiContext::new_with_signer(
        token_program.clone(),
        Transfer {
          from: base_storage_account.clone(),
          to: ctx
            .accounts
            .common
            .sell_base_royalties
            .to_account_info()
            .clone(),
          authority: token_bonding.to_account_info().clone(),
        },
        bonding_seeds,
      ),
      base_royalties,
    )?;
  }

  Ok(())
}
