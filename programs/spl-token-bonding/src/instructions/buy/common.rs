use anchor_lang::prelude::*;
use anchor_spl::token::{self, MintTo};

use crate::{curve::*, error::ErrorCode, util::*};

use super::{buy_account_common::BuyCommonV0, buy_arg_common::BuyV0Args};

pub struct BuyAmount {
  pub price: u64,
  pub total_amount: u64,
  pub base_royalties: u64,
  pub target_royalties: u64,
}

pub fn buy_shared_logic(common: &mut BuyCommonV0, args: &BuyV0Args) -> Result<BuyAmount> {
  let token_bonding = &mut common.token_bonding;
  let curve = &common.curve;
  let base_mint = &common.base_mint;
  let target_mint = &common.target_mint;
  let base_storage = &common.base_storage;
  let clock = &common.clock;

  // Not yet initialized since reserve_balance_from_bonding is a new feature
  if !token_bonding.sell_frozen
    && target_mint.supply > 0
    && token_bonding.reserve_balance_from_bonding == 0
    && token_bonding.go_live_unix_time < 1646092800_i64
  {
    token_bonding.reserve_balance_from_bonding = base_storage.amount;
    token_bonding.supply_from_bonding = target_mint.supply;
  }

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

  // msg!(
  //   "Current reserves {} and supply {}",
  //   base_storage.amount,
  //   target_mint.supply
  // );

  if token_bonding.go_live_unix_time > clock.unix_timestamp {
    return Err(error!(ErrorCode::NotLiveYet));
  }

  if token_bonding.buy_frozen {
    return Err(error!(ErrorCode::BuyFrozen));
  }

  if token_bonding.freeze_buy_unix_time.is_some()
    && token_bonding.freeze_buy_unix_time.unwrap() < clock.unix_timestamp
  {
    return Err(error!(ErrorCode::BuyFrozen));
  }

  let base_royalties_percent = token_bonding.buy_base_royalty_percentage;
  let target_royalties_percent = token_bonding.buy_target_royalty_percentage;

  let price: u64;
  let total_amount: u64;
  let base_royalties: u64;
  let target_royalties: u64;
  if args.buy_target_amount.is_some() {
    let buy_target_amount = args.buy_target_amount.clone().unwrap();

    total_amount = buy_target_amount.target_amount;
    let amount_prec = precise_supply_amt(total_amount, target_mint);
    let price_prec = curve
      .definition
      .price(
        clock
          .unix_timestamp
          .checked_sub(token_bonding.go_live_unix_time)
          .unwrap(),
        &base_amount,
        &target_supply,
        &amount_prec,
        false,
      )
      .or_arith_error()?;

    price = to_mint_amount(&price_prec, base_mint, true);
    base_royalties = get_percent(price, base_royalties_percent)?;
    target_royalties = get_percent(total_amount, target_royalties_percent)?;

    if price.checked_add(base_royalties).unwrap() > buy_target_amount.maximum_price {
      msg!(
        "Price {} too high for max price {}",
        price + base_royalties,
        buy_target_amount.maximum_price
      );
      return Err(error!(ErrorCode::PriceTooHigh));
    }
  } else {
    let buy_with_base = args.buy_with_base.clone().unwrap();
    let total_price = buy_with_base.base_amount;
    base_royalties = get_percent(total_price, base_royalties_percent)?;
    let price_prec = precise_supply_amt(
      total_price.checked_sub(base_royalties).or_arith_error()?,
      base_mint,
    );

    let amount_prec = curve
      .definition
      .expected_target_amount(
        clock
          .unix_timestamp
          .checked_sub(token_bonding.go_live_unix_time)
          .unwrap(),
        &base_amount,
        &target_supply,
        &price_prec,
      )
      .or_arith_error()?;

    total_amount = to_mint_amount(&amount_prec, target_mint, false);

    price = to_mint_amount(&price_prec, base_mint, false);

    target_royalties = get_percent(total_amount, target_royalties_percent)?;

    let target_amount_minus_royalties = total_amount.checked_sub(target_royalties).unwrap();
    if target_amount_minus_royalties < buy_with_base.minimum_target_amount {
      msg!(
        "{} less than minimum tokens {}",
        target_amount_minus_royalties,
        buy_with_base.minimum_target_amount
      );
      return Err(error!(ErrorCode::PriceTooHigh));
    }
  }

  if token_bonding.mint_cap.is_some()
    && target_mint.supply.checked_add(total_amount).unwrap() > token_bonding.mint_cap.unwrap()
  {
    msg!(
      "Mint cap is {} {} {}",
      token_bonding.mint_cap.unwrap(),
      target_mint.supply,
      total_amount
    );
    return Err(error!(ErrorCode::PassedMintCap));
  }

  if token_bonding.purchase_cap.is_some() && total_amount > token_bonding.purchase_cap.unwrap() {
    return Err(error!(ErrorCode::OverPurchaseCap));
  }

  token_bonding.supply_from_bonding = token_bonding
    .supply_from_bonding
    .checked_add(total_amount)
    .or_arith_error()?;

  token_bonding.reserve_balance_from_bonding = token_bonding
    .reserve_balance_from_bonding
    .checked_add(price)
    .or_arith_error()?;

  Ok(BuyAmount {
    price,
    base_royalties,
    target_royalties,
    total_amount,
  })
}

pub fn mint_to_dest<'info>(
  total_amount: u64,
  target_royalties: u64,
  common: &BuyCommonV0<'info>,
  destination: &AccountInfo<'info>,
) -> Result<()> {
  let token_bonding = &common.token_bonding;
  let token_program = &common.token_program.to_account_info();
  let target_mint = &common.target_mint.to_account_info();
  let target_royalties_account = &common.buy_target_royalties.to_account_info();
  let target_mint_authority = &common.token_bonding.to_account_info();

  let mint_signer_seeds: &[&[&[u8]]] = &[&[
    b"token-bonding",
    target_mint.key.as_ref(),
    &token_bonding.index.to_le_bytes(),
    &[token_bonding.bump_seed],
  ]];

  if target_royalties > 0 {
    // msg!("Minting {} to target royalties", target_royalties);
    token::mint_to(
      CpiContext::new_with_signer(
        token_program.clone(),
        MintTo {
          mint: target_mint.clone(),
          to: target_royalties_account.clone(),
          authority: target_mint_authority.clone(),
        },
        mint_signer_seeds,
      ),
      target_royalties,
    )?;
  }

  // msg!("Minting {} to destination", total_amount - target_royalties);
  token::mint_to(
    CpiContext::new_with_signer(
      token_program.clone(),
      MintTo {
        mint: target_mint.clone(),
        to: destination.clone(),
        authority: target_mint_authority.clone(),
      },
      mint_signer_seeds,
    ),
    total_amount.checked_sub(target_royalties).unwrap(),
  )?;

  Ok(())
}
