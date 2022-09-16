use super::{sell_account_common::SellCommonV0, sell_arg_common::SellV0Args};
use crate::{curve::Curve, error::ErrorCode, util::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Transfer};

pub struct SellAmount {
  pub reclaimed: u64,
  pub base_royalties: u64,
  pub target_royalties: u64,
}

pub fn sell_shared_logic(common: &mut SellCommonV0, args: &SellV0Args) -> Result<SellAmount> {
  let token_bonding = &mut common.token_bonding;
  let curve = &common.curve;
  let base_mint = &common.base_mint;
  let base_storage = &common.base_storage;
  let target_mint = &common.target_mint;
  let clock = &common.clock;

  let amount = args.target_amount;
  let base_amount_u64 = if token_bonding.ignore_external_reserve_changes {
    token_bonding.reserve_balance_from_bonding
  } else {
    base_storage.amount
  };
  let base_amount = precise_supply_amt(base_amount_u64, base_mint);
  let target_supply_u64 = if token_bonding.ignore_external_supply_changes {
    token_bonding.supply_from_bonding
  } else {
    target_mint.supply
  };
  let target_supply = precise_supply_amt(target_supply_u64, target_mint);

  msg!(
    "Current reserves {} and supply {}",
    base_storage.amount,
    target_mint.supply
  );

  // Not yet initialized since reserve_balance_from_bonding is a new feature
  if !token_bonding.sell_frozen
    && target_mint.supply > 0
    && token_bonding.reserve_balance_from_bonding == 0
    && token_bonding.go_live_unix_time < 1646092800_i64
  {
    token_bonding.reserve_balance_from_bonding = base_storage.amount;
    token_bonding.supply_from_bonding = target_mint.supply;
  }

  if token_bonding.go_live_unix_time > clock.unix_timestamp {
    return Err(error!(ErrorCode::NotLiveYet));
  }

  if token_bonding.sell_frozen {
    return Err(error!(ErrorCode::SellDisabled));
  }

  let base_royalties_percent = token_bonding.sell_base_royalty_percentage;
  let target_royalties_percent = token_bonding.sell_target_royalty_percentage;

  let target_royalties = get_percent(amount, target_royalties_percent)?;
  let amount_minus_royalties_prec = precise_supply_amt(
    amount.checked_sub(target_royalties).or_arith_error()?,
    target_mint,
  );
  let reclaimed_prec = curve
    .definition
    .price(
      clock
        .unix_timestamp
        .checked_sub(token_bonding.go_live_unix_time)
        .unwrap(),
      &base_amount,
      &target_supply,
      &amount_minus_royalties_prec,
      true,
    )
    .or_arith_error()?;
  let reclaimed_with_royalties = to_mint_amount(&reclaimed_prec, base_mint, false);
  let base_royalties = get_percent(reclaimed_with_royalties, base_royalties_percent)?;
  let reclaimed = reclaimed_with_royalties
    .checked_sub(base_royalties)
    .or_arith_error()?;

  token_bonding.supply_from_bonding = token_bonding
    .supply_from_bonding
    .checked_sub(amount)
    .or_arith_error()?;
  token_bonding.reserve_balance_from_bonding = token_bonding
    .reserve_balance_from_bonding
    .checked_sub(reclaimed)
    .or_arith_error()?;

  if reclaimed < args.minimum_price {
    msg!(
      "Err: Minimum price was {}, reclaimed was {}",
      args.minimum_price,
      reclaimed
    );
    return Err(error!(ErrorCode::PriceTooLow));
  }

  Ok(SellAmount {
    reclaimed,
    base_royalties,
    target_royalties,
  })
}

pub fn burn_and_pay_sell_royalties(
  amount: u64,
  target_royalties: u64,
  common: &SellCommonV0,
) -> Result<()> {
  let token_program = &common.token_program.to_account_info();
  let target_mint = &common.target_mint.to_account_info();
  let target_royalties_account = &common.sell_target_royalties.to_account_info();
  let source = &common.source.to_account_info();
  let source_authority = &common.source_authority.to_account_info();

  // msg!("Burning {}", amount);
  token::burn(
    CpiContext::new(
      token_program.clone(),
      Burn {
        mint: target_mint.to_account_info().clone(),
        from: source.clone(),
        authority: source_authority.clone(),
      },
    ),
    amount.checked_sub(target_royalties).unwrap(),
  )?;

  // Do not send if royalties account is closed.
  if target_royalties > 0 && target_royalties_account.lamports() > 0 {
    msg!("Paying out {} to target royalties", target_royalties);
    token::transfer(
      CpiContext::new(
        token_program.clone(),
        Transfer {
          from: source.clone(),
          to: target_royalties_account.to_account_info().clone(),
          authority: source_authority.clone(),
        },
      ),
      target_royalties,
    )?;
  }

  Ok(())
}
