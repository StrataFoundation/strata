use super::{
  buy_account_common::*,
  buy_arg_common::BuyV0Args,
  common::{buy_shared_logic, mint_to_dest, BuyAmount},
};
use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct BuyV1<'info> {
  pub common: BuyCommonV0<'info>,
  // This endpoint is only for non wrapped sol
  #[account(
    constraint = state.wrapped_sol_mint != common.base_mint.key()
  )]
  pub state: Box<Account<'info, ProgramStateV0>>,
  #[account(mut)]
  pub source: Box<Account<'info, TokenAccount>>,
  pub source_authority: Signer<'info>,
}

pub fn handler(ctx: Context<BuyV1>, args: BuyV0Args) -> Result<()> {
  let BuyAmount {
    total_amount,
    price,
    target_royalties,
    base_royalties,
  } = buy_shared_logic(&mut ctx.accounts.common, &args)?;

  mint_to_dest(
    total_amount,
    target_royalties,
    &ctx.accounts.common,
    &ctx.accounts.common.destination.to_account_info(),
  )?;

  msg!(
    "Total price is {}, with {} to base royalties and {} to target royalties",
    price + base_royalties,
    base_royalties,
    target_royalties
  );
  let token_program = ctx.accounts.common.token_program.to_account_info();
  let source = ctx.accounts.source.to_account_info();
  let base_storage_account = ctx.accounts.common.base_storage.to_account_info();
  let base_royalties_account = ctx
    .accounts
    .common
    .buy_base_royalties
    .clone()
    .to_account_info();
  let source_authority = ctx.accounts.source_authority.to_account_info();

  if base_royalties > 0 {
    msg!("Paying out {} base royalties", base_royalties);
    token::transfer(
      CpiContext::new(
        token_program.clone(),
        Transfer {
          from: source.clone(),
          to: base_royalties_account.clone(),
          authority: source_authority.clone(),
        },
      ),
      base_royalties,
    )?;
  }

  msg!("Paying out {} to base storage", price);
  token::transfer(
    CpiContext::new(
      token_program.clone(),
      Transfer {
        from: source.clone(),
        to: base_storage_account.clone(),
        authority: source_authority.clone(),
      },
    ),
    price,
  )?;

  Ok(())
}
