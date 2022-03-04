use super::{
  transfer_reserves_account_common::*, transfer_reserves_arg_common::TransferReservesV0Args,
};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, TokenAccount, Transfer};

#[derive(Accounts)]
#[instruction(args: TransferReservesV0Args)]
pub struct TransferReservesV0<'info> {
  pub common: TransferReservesV0Common<'info>,
  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,
}

pub fn handler(ctx: Context<TransferReservesV0>, args: TransferReservesV0Args) -> Result<()> {
  let token_bonding = &mut ctx.accounts.common.token_bonding;
  let bonding_seeds: &[&[&[u8]]] = &[&[
    b"token-bonding",
    token_bonding.target_mint.as_ref(),
    &token_bonding.index.to_le_bytes(),
    &[token_bonding.bump_seed],
  ]];

  token::transfer(
    CpiContext::new_with_signer(
      ctx.accounts.common.token_program.to_account_info().clone(),
      Transfer {
        from: ctx.accounts.common.base_storage.to_account_info().clone(),
        to: ctx.accounts.destination.to_account_info().clone(),
        authority: token_bonding.to_account_info().clone(),
      },
      bonding_seeds,
    ),
    args.amount,
  )?;

  Ok(())
}
