use crate::error::ErrorCode;
use crate::precise_number::{InnerUint, PreciseNumber};
use anchor_lang::solana_program::system_program;
use anchor_lang::{prelude::*, solana_program};
use anchor_spl::token::{Mint, TokenAccount};
use std::convert::*;

pub trait OrArithError<T> {
  fn or_arith_error(self) -> Result<T>;
}

impl OrArithError<PreciseNumber> for Option<PreciseNumber> {
  fn or_arith_error(self) -> Result<PreciseNumber> {
    self.ok_or(ErrorCode::ArithmeticError.into())
  }
}

impl OrArithError<u128> for Option<u128> {
  fn or_arith_error(self) -> Result<u128> {
    self.ok_or(ErrorCode::ArithmeticError.into())
  }
}

impl OrArithError<u64> for Option<u64> {
  fn or_arith_error(self) -> Result<u64> {
    self.ok_or(ErrorCode::ArithmeticError.into())
  }
}

pub fn get_percent_prec(percent: u32) -> Result<PreciseNumber> {
  let max_u32 = PreciseNumber::new(u32::MAX as u128).or_arith_error()?;
  let percent_prec = PreciseNumber::new(percent as u128).or_arith_error()?;

  percent_prec.checked_div(&max_u32).or_arith_error()
}

pub fn get_percent(value: u64, percent: u32) -> Result<u64> {
  u64::try_from(
    u128::try_from(value)
      .ok()
      .or_arith_error()?
      .checked_mul(u128::try_from(percent).ok().or_arith_error()?)
      .or_arith_error()?
      .checked_div(u32::MAX as u128)
      .or_arith_error()?,
  )
  .ok()
  .or_arith_error()
}

pub fn precise_supply(mint: &Account<Mint>) -> PreciseNumber {
  precise_supply_amt(mint.supply, mint)
}

fn get_pow_10(decimals: u8) -> PreciseNumber {
  match decimals {
    0 => PreciseNumber::new(1),
    1 => PreciseNumber::new(10),
    2 => PreciseNumber::new(100),
    3 => PreciseNumber::new(1000),
    4 => PreciseNumber::new(10000),
    5 => PreciseNumber::new(100000),
    6 => PreciseNumber::new(1000000),
    7 => PreciseNumber::new(10000000),
    8 => PreciseNumber::new(100000000),
    9 => PreciseNumber::new(1000000000),
    10 => PreciseNumber::new(10000000000),
    11 => PreciseNumber::new(100000000000),
    12 => PreciseNumber::new(1000000000000),
    _ => unreachable!(),
  }
  .unwrap()
}

fn get_u128_pow_10(decimals: u8) -> u128 {
  match decimals {
    0 => 1,
    1 => 10,
    2 => 100,
    3 => 1000,
    4 => 10000,
    5 => 100000,
    6 => 1000000,
    7 => 10000000,
    8 => 100000000,
    9 => 1000000000,
    10 => 10000000000,
    11 => 100000000000,
    12 => 1000000000000,
    _ => unreachable!(),
  }
}

pub fn precise_supply_amt(amt: u64, mint: &Mint) -> PreciseNumber {
  PreciseNumber {
    value: InnerUint::from(amt)
      .checked_mul(InnerUint::from(get_u128_pow_10(12_u8 - mint.decimals)))
      .unwrap()
      .checked_mul(InnerUint::from(1_000_000u64)) // Add 6 precision
      .unwrap(),
  }
}

pub fn to_mint_amount(amt: &PreciseNumber, mint: &Mint, ceil: bool) -> u64 {
  // Lookup is faster than a checked_pow
  let pow_10 = get_pow_10(mint.decimals);

  let pre_round = amt.checked_mul(&pow_10).unwrap();
  let post_round = if ceil {
    pre_round.ceiling().unwrap()
  } else {
    pre_round.floor().unwrap()
  };

  post_round.to_imprecise().unwrap() as u64
}

pub fn verify_empty_or_mint<'info>(
  maybe_token_account: &UncheckedAccount<'info>,
  mint: &Pubkey,
) -> Result<()> {
  if *maybe_token_account.owner == system_program::ID {
    Ok(())
  } else {
    let acc: Account<'info, TokenAccount> = Account::try_from(maybe_token_account)?;
    if acc.mint == *mint {
      Ok(())
    } else {
      Err(error!(ErrorCode::InvalidMint))
    }
  }
}

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
