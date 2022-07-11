use anchor_lang::{prelude::*, solana_program};
use std::convert::*;

#[derive(Accounts)]
pub struct CloseTokenAccount<'info> {
  /// CHECK: Used in cpi
  pub from: AccountInfo<'info>,
  /// CHECK: Used in cpi
  pub to: AccountInfo<'info>,
  /// CHECK: Used in cpi
  pub authority: AccountInfo<'info>,
}

pub fn close_token_account<'a, 'b, 'c, 'info>(
  ctx: CpiContext<'a, 'b, 'c, 'info, CloseTokenAccount<'info>>,
) -> Result<()> {
  let ix = spl_token::instruction::close_account(
    &spl_token::ID,
    ctx.accounts.from.key,
    ctx.accounts.to.key,
    ctx.accounts.authority.key,
    &[],
  )?;
  solana_program::program::invoke_signed(
    &ix,
    &[
      ctx.accounts.from.clone(),
      ctx.accounts.to.clone(),
      ctx.accounts.authority.clone(),
      ctx.program.clone(),
    ],
    ctx.signer_seeds,
  )
  .map_err(|e| e.into())
}
