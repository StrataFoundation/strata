use super::{
  buy_account_common::BuyCommonV0,
  buy_arg_common::BuyV0Args,
  common::{buy_shared_logic, mint_to_dest, BuyAmount},
};
use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct BuyV0<'info> {
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint,
    has_one = base_storage,
    has_one = buy_base_royalties,
    has_one = buy_target_royalties,
    has_one = curve
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub curve: Box<Account<'info, CurveV0>>,
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  /// CHECK: Token account could have been closed. This is fine if royalties are 0
  pub buy_base_royalties: AccountInfo<'info>,
  #[account(mut)]
  /// CHECK: Token account could have been closed. This is fine if royalties are 0
  pub buy_target_royalties: AccountInfo<'info>,
  #[account(mut)]
  pub source: Box<Account<'info, TokenAccount>>,
  pub source_authority: Signer<'info>,
  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
  pub clock: Sysvar<'info, Clock>,
}

// DEPRECATED, USE BUY V1
pub fn handler(ctx: Context<BuyV0>, args: BuyV0Args) -> Result<()> {
  msg!("Warning: This endpoint is deprecated, please use buy_v1");
  if ctx.accounts.token_bonding.ignore_external_reserve_changes
    || ctx.accounts.token_bonding.ignore_external_supply_changes
  {
    return Err(error!(ErrorCode::IgnoreExternalV1Only));
  }
  let common = &mut BuyCommonV0 {
    token_bonding: ctx.accounts.token_bonding.clone(),
    curve: ctx.accounts.curve.clone(),
    base_mint: ctx.accounts.base_mint.clone(),
    target_mint: ctx.accounts.target_mint.clone(),
    base_storage: ctx.accounts.base_storage.clone(),
    buy_base_royalties: ctx.accounts.buy_base_royalties.clone(),
    buy_target_royalties: ctx.accounts.buy_target_royalties.clone(),
    destination: ctx.accounts.destination.clone(),
    token_program: ctx.accounts.token_program.clone(),
    clock: ctx.accounts.clock.clone(),
  };
  let BuyAmount {
    total_amount,
    price,
    target_royalties,
    base_royalties,
  } = buy_shared_logic(common, &args)?;

  mint_to_dest(
    total_amount,
    target_royalties,
    common,
    &ctx.accounts.destination.to_account_info(),
  )?;

  msg!(
    "Total price is {}, with {} to base royalties and {} to target royalties",
    price + base_royalties,
    base_royalties,
    target_royalties
  );
  let token_program = ctx.accounts.token_program.to_account_info();
  let source = ctx.accounts.source.to_account_info();
  let base_storage_account = ctx.accounts.base_storage.to_account_info();
  let base_royalties_account = ctx.accounts.buy_base_royalties.clone().to_account_info();
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
