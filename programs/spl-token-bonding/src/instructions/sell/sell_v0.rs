use super::{
  common::{burn_and_pay_sell_royalties, sell_shared_logic, SellAmount},
  sell_account_common::SellCommonV0,
  sell_arg_common::SellV0Args,
};
use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct SellV0<'info> {
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint,
    has_one = base_storage,
    has_one = curve,
    has_one = sell_base_royalties,
    has_one = sell_target_royalties,
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub curve: Box<Account<'info, CurveV0>>,
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  /// CHECK: Token account could have been closed. Royalties are not sent if the account has been closed, but we also don't want to fail to parse here
  pub sell_base_royalties: AccountInfo<'info>,
  #[account(mut)]
  /// CHECK: Token account could have been closed. Royalties are not sent if the account has been closed, but we also don't want to fail to parse here
  pub sell_target_royalties: AccountInfo<'info>,

  #[account(mut)]
  pub source: Box<Account<'info, TokenAccount>>,
  pub source_authority: Signer<'info>,

  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,

  pub token_program: Program<'info, Token>,
  pub clock: Sysvar<'info, Clock>,
}

pub fn handler(ctx: Context<SellV0>, args: SellV0Args) -> Result<()> {
  msg!("Warning: This endpoint is deprecated, please use sell_v1");
  if ctx.accounts.token_bonding.ignore_external_reserve_changes
    || ctx.accounts.token_bonding.ignore_external_supply_changes
  {
    return Err(error!(ErrorCode::IgnoreExternalV1Only));
  }

  let common = &mut SellCommonV0 {
    token_bonding: ctx.accounts.token_bonding.clone(),
    curve: ctx.accounts.curve.clone(),
    base_mint: ctx.accounts.base_mint.clone(),
    target_mint: ctx.accounts.target_mint.clone(),
    base_storage: ctx.accounts.base_storage.clone(),
    sell_base_royalties: ctx.accounts.sell_base_royalties.clone(),
    source: ctx.accounts.source.clone(),
    source_authority: ctx.accounts.source_authority.clone(),
    sell_target_royalties: ctx.accounts.sell_target_royalties.clone(),
    token_program: ctx.accounts.token_program.clone(),
    clock: ctx.accounts.clock.clone(),
  };

  let SellAmount {
    reclaimed,
    base_royalties,
    target_royalties,
  } = sell_shared_logic(common, &args)?;

  msg!(
    "Total reclaimed is {}, with {} to base royalties, {} to target royalties",
    reclaimed,
    base_royalties,
    target_royalties
  );

  burn_and_pay_sell_royalties(args.target_amount, target_royalties, common)?;

  let token_program = ctx.accounts.token_program.to_account_info();
  let base_storage_account = ctx.accounts.base_storage.to_account_info();
  let destination = ctx.accounts.destination.to_account_info();
  let target_mint = ctx.accounts.target_mint.to_account_info();
  let token_bonding = &mut ctx.accounts.token_bonding;

  msg!(
    "Paying out {} from base storage, {}",
    reclaimed,
    ctx.accounts.base_storage.amount
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
        authority: ctx.accounts.token_bonding.to_account_info().clone(),
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
          to: ctx.accounts.sell_base_royalties.to_account_info().clone(),
          authority: ctx.accounts.token_bonding.to_account_info().clone(),
        },
        bonding_seeds,
      ),
      base_royalties,
    )?;
  }

  Ok(())
}
