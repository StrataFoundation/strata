#![allow(clippy::too_many_arguments)]

use crate::arg::*;
use crate::{error::ErrorCode, name::NameRecordHeader};
use anchor_lang::{prelude::*, solana_program::hash::hashv};
use anchor_spl::token::TokenAccount;
use spl_token_bonding::state::TokenBondingV0;

pub fn verify_authority(authority: Option<Pubkey>, key: &Pubkey) -> Result<bool, ProgramError> {
  if *key != authority.ok_or::<ProgramError>(ErrorCode::NoAuthority.into())? {
    return Err(ErrorCode::InvalidAuthority.into());
  }

  Ok(true)
}

pub fn verify_bonding_authorities(
  bonding: &TokenBondingV0,
  mint_token_ref_key: &Pubkey,
) -> Result<bool, ProgramError> {
  Ok(
    verify_authority(bonding.general_authority, mint_token_ref_key)?
      && verify_authority(bonding.curve_authority, mint_token_ref_key)?
      && verify_authority(bonding.reserve_authority, mint_token_ref_key)?,
  )
}

pub fn get_seeds_and_key(
  program_id: &Pubkey,
  hashed_name: Vec<u8>, // Hashing is done off-chain
  name_class_opt: Option<Pubkey>,
  parent_name_address_opt: Option<Pubkey>,
) -> (Pubkey, Vec<u8>) {
  // let hashed_name: Vec<u8> = hashv(&[(HASH_PREFIX.to_owned() + name).as_bytes()]).0.to_vec();
  let mut seeds_vec: Vec<u8> = hashed_name;

  let name_class = name_class_opt.unwrap_or_default();

  for b in name_class.to_bytes().to_vec() {
    seeds_vec.push(b);
  }

  let parent_name_address = parent_name_address_opt.unwrap_or_default();

  for b in parent_name_address.to_bytes().to_vec() {
    seeds_vec.push(b);
  }

  let (name_account_key, bump) =
    Pubkey::find_program_address(&seeds_vec.chunks(32).collect::<Vec<&[u8]>>(), program_id);
  seeds_vec.push(bump);

  (name_account_key, seeds_vec)
}

pub fn get_name(name_parent: &AccountInfo) -> Result<NameRecordHeader, ProgramError> {
  let mut data: &[u8] = &name_parent
    .data
    .try_borrow()
    .map_err(|_| ProgramError::AccountBorrowFailed)?;
  NameRecordHeader::try_deserialize(&mut data)
}

pub fn verify_name(
  name: &AccountInfo,
  name_class: Option<Pubkey>,
  name_parent: Option<Pubkey>,
  expected: &str,
) -> Result<bool, ProgramError> {
  let hashed_name: Vec<u8> = hashv(&[("SPL Name Service".to_owned() + expected).as_bytes()])
    .0
    .to_vec();

  let (address, _) = get_seeds_and_key(&spl_name_service::ID, hashed_name, name_class, name_parent);

  msg!("Name vs address {} {}", *name.key, address);
  Ok(*name.key == address)
}

pub fn verify_token_bonding_royalties<'info>(
  defaults: &TokenBondingSettingsV0,
  token_bonding: &Account<'info, TokenBondingV0>,
  mint_token_ref_key: &Pubkey,
  buy_base_royalties: &Account<'info, TokenAccount>,
  buy_target_royalties: &Account<'info, TokenAccount>,
  sell_base_royalties: &Account<'info, TokenAccount>,
  sell_target_royalties: &Account<'info, TokenAccount>,
  claimed: bool,
) -> ProgramResult {
  let valid = (!claimed
    || (defaults
      .buy_base_royalties
      .address
      .map_or(true, |royalty| royalty == token_bonding.buy_base_royalties)
      && defaults
        .buy_target_royalties
        .address
        .map_or(true, |royalty| {
          royalty == token_bonding.buy_target_royalties
        })
      && defaults
        .sell_base_royalties
        .address
        .map_or(true, |royalty| royalty == token_bonding.sell_base_royalties)
      && defaults
        .sell_target_royalties
        .address
        .map_or(true, |royalty| {
          royalty == token_bonding.sell_target_royalties
        })))
    && (claimed
      || ((!defaults.buy_base_royalties.owned_by_name
        || buy_base_royalties.owner == *mint_token_ref_key)
        && (!defaults.buy_target_royalties.owned_by_name
          || buy_target_royalties.owner == *mint_token_ref_key)
        && (!defaults.sell_base_royalties.owned_by_name
          || sell_base_royalties.owner == *mint_token_ref_key)
        && (!defaults.sell_target_royalties.owned_by_name
          || sell_target_royalties.owner == *mint_token_ref_key)));

  if valid {
    Ok(())
  } else {
    Err(ErrorCode::InvalidTokenBondingRoyalties.into())
  }
}

pub fn verify_token_bonding_defaults<'info>(
  defaults: &TokenBondingSettingsV0,
  token_bonding: &Account<'info, TokenBondingV0>,
) -> ProgramResult {
  let valid = defaults
    .curve
    .map_or(true, |curve| token_bonding.curve == curve)
    && defaults
      .min_buy_base_royalty_percentage
      .map_or(true, |min| token_bonding.buy_base_royalty_percentage >= min)
    && defaults
      .min_sell_base_royalty_percentage
      .map_or(true, |min| {
        token_bonding.sell_base_royalty_percentage >= min
      })
    && defaults
      .min_buy_target_royalty_percentage
      .map_or(true, |min| {
        token_bonding.buy_target_royalty_percentage >= min
      })
    && defaults
      .min_sell_target_royalty_percentage
      .map_or(true, |min| {
        token_bonding.sell_target_royalty_percentage >= min
      })
    && defaults
      .max_buy_base_royalty_percentage
      .map_or(true, |max| token_bonding.buy_base_royalty_percentage <= max)
    && defaults
      .max_sell_base_royalty_percentage
      .map_or(true, |max| {
        token_bonding.sell_base_royalty_percentage <= max
      })
    && defaults
      .max_buy_target_royalty_percentage
      .map_or(true, |max| {
        token_bonding.buy_target_royalty_percentage <= max
      })
    && defaults
      .max_sell_target_royalty_percentage
      .map_or(true, |max| {
        token_bonding.sell_target_royalty_percentage <= max
      })
    && defaults.min_purchase_cap.map_or(true, |cap| {
      token_bonding
        .purchase_cap
        .map_or(true, |bond_cap| bond_cap >= cap)
    })
    && defaults.max_purchase_cap.map_or(true, |cap| {
      token_bonding
        .purchase_cap
        .map_or(true, |bond_cap| bond_cap <= cap)
    })
    && defaults.min_mint_cap.map_or(true, |cap| {
      token_bonding
        .mint_cap
        .map_or(true, |bond_cap| bond_cap >= cap)
    })
    && defaults.max_mint_cap.map_or(true, |cap| {
      token_bonding
        .mint_cap
        .map_or(true, |bond_cap| bond_cap <= cap)
    })
    && !token_bonding.sell_frozen
    && token_bonding.freeze_buy_unix_time.is_none();

  if valid {
    Ok(())
  } else {
    Err(ErrorCode::InvalidTokenBondingSettings.into())
  }
}
