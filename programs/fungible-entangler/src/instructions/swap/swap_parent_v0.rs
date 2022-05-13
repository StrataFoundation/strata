use super::{
  account::*,
  arg::SwapV0Args
};
use crate::{error::ErrorCode};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct SwapParentV0<'info> {
  pub common: SwapCommonV0<'info>,
}

pub fn handler(ctx: Context<SwapParentV0>, args: SwapV0Args) -> Result<()> {
  let token_program = &ctx.accounts.common.token_program.to_account_info();
  let parent_entangler = &ctx.accounts.common.parent_entangler.to_account_info();
  let source = &ctx.accounts.common.source.to_account_info();
  let destination = &ctx.accounts.common.destination.to_account_info();
  let parent_storage = &ctx.accounts.common.parent_storage.to_account_info();
  let child_storage = &ctx.accounts.common.child_storage.to_account_info();
  let source_authority = &ctx.accounts.common.source_authority.to_account_info();  

  let token_program = &ctx.accounts.common.token_program;  
  let clock = &ctx.accounts.common.clock;

  msg!("Swapping out {} from source to parent storage", amount);
  token::transfer(
    CpiContext::new(
      token_program.clone(),
      Transfer {
        from: source.clone(),
        to: parent_storage.clone(),
        authority: source_authority.clone(),
      }
    ),
    args.amount,
  )?;

  msg!("Swapping out {} from child storage to source", amount);
  token::transfer(
    CpiContext::new(
      token_program.clone(),
      Trasnfer {
        from: child_storage.clone(),
        to: destination.clone(),
        authority: parent_entangler.clone()
      }
    ),
    args.amount,
  )?;

  Ok(())
}