#![allow(clippy::or_fun_call)]

use std::collections::BTreeMap;

use crate::token_metadata::update_metadata_account_v2;
use arrayref::array_ref;
use {
  anchor_lang::prelude::*,
  anchor_spl::token::{transfer, Transfer},
  borsh::{BorshDeserialize, BorshSerialize},
  spl_token_bonding::instructions::update_curve_v0::UpdateCurveV0Args,
  spl_token_bonding::instructions::update_token_bonding_v0::UpdateTokenBondingV0Args,
};

pub mod account;
pub mod arg;
pub mod error;
pub mod name;
pub mod state;
pub mod token_metadata;
pub mod util;

use spl_token_bonding::cpi::accounts::UpdateCurveV0;
use spl_token_bonding::cpi::accounts::UpdateTokenBondingV0;
use token_metadata::UpdateMetadataAccount;

use crate::token_metadata::UpdateMetadataAccountArgs;
use crate::{account::*, arg::*, error::ErrorCode, state::*, util::*};

declare_id!("TCo1sfSr2nCudbeJPykbif64rG9K1JNMGzrtzvPmp3y");

pub fn initialize_social_token_v0(
  accounts: &mut InitializeSocialTokenV0,
  owner_token_ref: &mut Account<TokenRefV0>,
  mint_token_ref: &mut Account<TokenRefV0>,
  bumps: BTreeMap<String, u8>,
) -> Result<()> {
  let c = get_collective(&accounts.collective);
  let collective = c.as_ref();
  if let Some(collective) = collective {
    if !collective.config.is_open {
      let authority = collective
        .authority
        .ok_or(error!(ErrorCode::InvalidAuthority))?;
      if accounts.authority.key() != authority || !accounts.authority.is_signer {
        return Err(error!(ErrorCode::InvalidAuthority));
      }

      if accounts.token_bonding.base_mint != collective.mint {
        return Err(error!(ErrorCode::InvalidCollective));
      }
    }
  }

  owner_token_ref.collective = if collective.is_some() {
    Some(accounts.collective.key())
  } else {
    None
  };
  owner_token_ref.token_bonding = Some(accounts.token_bonding.key());
  owner_token_ref.mint = accounts.token_bonding.target_mint;
  owner_token_ref.bump_seed = *bumps.get("owner_token_ref").unwrap();
  owner_token_ref.token_metadata = accounts.token_metadata.key();

  mint_token_ref.collective = owner_token_ref.collective;
  mint_token_ref.token_bonding = Some(accounts.token_bonding.key());
  mint_token_ref.bump_seed = *bumps.get("mint_token_ref").unwrap();
  mint_token_ref.mint = accounts.token_bonding.target_mint;

  mint_token_ref.token_metadata = accounts.token_metadata.key();

  Ok(())
}

pub fn get_collective(collective: &UncheckedAccount) -> Option<CollectiveV0> {
  if *collective.owner == crate::ID {
    let data = collective.data.try_borrow().ok();
    return data.and_then(|d| {
      let mut da: &[u8] = &d;
      CollectiveV0::try_deserialize(&mut da).ok()
    });
  }

  None
}

#[program]
pub mod spl_token_collective {

  use anchor_lang::{AccountsClose, Discriminator};
  use spl_token_bonding::{
    cpi::{accounts::UpdateReserveAuthorityV0, update_reserve_authority_v0},
    instructions::UpdateReserveAuthorityV0Args,
  };

  use super::*;

  pub fn initialize_collective_v0(
    ctx: Context<InitializeCollectiveV0>,
    args: InitializeCollectiveV0Args,
  ) -> Result<()> {
    let collective = &mut ctx.accounts.collective;

    collective.mint = ctx.accounts.mint.key();
    collective.config = args.config;
    collective.authority = args.authority;
    collective.bump_seed = *ctx.bumps.get("collective").unwrap();

    Ok(())
  }

  pub fn initialize_collective_for_social_token_v0(
    ctx: Context<InitializeCollectiveForSocialTokenV0>,
    args: InitializeCollectiveForSocialTokenV0Args,
  ) -> Result<()> {
    let collective = &mut ctx.accounts.collective;

    collective.mint = ctx.accounts.mint.key();
    collective.config = args.config;
    collective.authority = args.authority;
    collective.bump_seed = *ctx.bumps.get("collective").unwrap();

    Ok(())
  }

  pub fn update_collective_v0(
    ctx: Context<UpdateCollectiveV0>,
    args: UpdateCollectiveV0Args,
  ) -> Result<()> {
    let collective = &mut ctx.accounts.collective;

    collective.config = args.config;
    collective.authority = args.authority;

    Ok(())
  }

  pub fn set_as_primary_v0(ctx: Context<SetAsPrimaryV0>, args: SetAsPrimaryV0Args) -> Result<()> {
    let token_ref = &ctx.accounts.token_ref;
    let primary_token_ref = &mut ctx.accounts.primary_token_ref;

    let acct = primary_token_ref.to_account_info();
    let data: &[u8] = &acct.try_borrow_data()?;
    let disc_bytes = array_ref![data, 0, 8];
    if disc_bytes != &TokenRefV0::discriminator() && disc_bytes.iter().any(|a| a != &0) {
      return Err(error!(ErrorCode::AccountDiscriminatorMismatch));
    }

    primary_token_ref.collective = token_ref.collective;
    primary_token_ref.token_metadata = token_ref.token_metadata;
    primary_token_ref.mint = token_ref.mint;
    primary_token_ref.token_bonding = token_ref.token_bonding;
    primary_token_ref.name = token_ref.name;
    primary_token_ref.owner = token_ref.owner;
    primary_token_ref.authority = token_ref.authority;
    primary_token_ref.is_claimed = token_ref.is_claimed;
    primary_token_ref.is_primary = true;
    primary_token_ref.bump_seed = *ctx
      .bumps
      .get("primaty_token_ref")
      .unwrap_or(&args.bump_seed);
    primary_token_ref.target_royalties_owner_bump_seed = token_ref.target_royalties_owner_bump_seed;

    Ok(())
  }

  pub fn initialize_owned_social_token_v0(
    ctx: Context<InitializeOwnedSocialTokenV0>,
    args: InitializeSocialTokenV0Args,
  ) -> Result<()> {
    let collective = get_collective(&ctx.accounts.initialize_args.collective);
    let initialize_args = &ctx.accounts.initialize_args;
    let token_bonding_settings = collective
      .as_ref()
      .and_then(|c| c.config.claimed_token_bonding_settings.as_ref());
    if let Some(token_bonding_settings) = token_bonding_settings {
      verify_token_bonding_defaults(token_bonding_settings, &initialize_args.token_bonding)?;
      verify_token_bonding_royalties(
        token_bonding_settings,
        &initialize_args.token_bonding,
        &ctx.accounts.mint_token_ref.key(),
        &initialize_args.buy_base_royalties,
        &initialize_args.buy_target_royalties,
        &initialize_args.sell_base_royalties,
        &initialize_args.sell_target_royalties,
        true,
      )?;
    }

    initialize_social_token_v0(
      &mut ctx.accounts.initialize_args,
      &mut ctx.accounts.owner_token_ref,
      &mut ctx.accounts.mint_token_ref,
      ctx.bumps,
    )?;
    let owner_token_ref = &mut ctx.accounts.owner_token_ref;
    let mint_token_ref = &mut ctx.accounts.mint_token_ref;

    owner_token_ref.owner = Some(ctx.accounts.owner.key());
    mint_token_ref.owner = Some(ctx.accounts.owner.key());
    owner_token_ref.authority = args.authority;
    mint_token_ref.authority = args.authority;
    mint_token_ref.is_claimed = true;
    owner_token_ref.is_claimed = true;

    Ok(())
  }

  pub fn initialize_unclaimed_social_token_v0(
    ctx: Context<InitializeUnclaimedSocialTokenV0>,
    args: InitializeSocialTokenV0Args,
  ) -> Result<()> {
    let collective = get_collective(&ctx.accounts.initialize_args.collective);
    let initialize_args = &ctx.accounts.initialize_args;
    let config = collective.as_ref().map(|c| &c.config);
    let token_bonding_settings_opt =
      config.and_then(|c| c.unclaimed_token_bonding_settings.as_ref());
    let token_metadata_settings_opt =
      config.and_then(|c| c.unclaimed_token_metadata_settings.as_ref());
    if token_bonding_settings_opt.is_some() {
      verify_token_bonding_defaults(
        token_bonding_settings_opt.unwrap(),
        &initialize_args.token_bonding,
      )?;
      verify_token_bonding_royalties(
        token_bonding_settings_opt.unwrap(),
        &initialize_args.token_bonding,
        &ctx.accounts.mint_token_ref.key(),
        &initialize_args.buy_base_royalties,
        &initialize_args.buy_target_royalties,
        &initialize_args.sell_base_royalties,
        &initialize_args.sell_target_royalties,
        false,
      )?;
    }

    let timestamp = initialize_args.clock.unix_timestamp;
    if initialize_args.token_bonding.go_live_unix_time > timestamp {
      return Err(error!(ErrorCode::UnclaimedNotLive));
    }

    if let Some(token_metadata_settings) = token_metadata_settings_opt {
      let token_metadata = &ctx.accounts.token_metadata;
      let name = &ctx.accounts.name;

      let valid = token_metadata_settings
        .symbol
        .as_ref()
        .map_or(true, |symbol| {
          str::replace(&token_metadata.data.symbol, "\u{0000}", "") == *symbol
        })
        && token_metadata_settings.uri.as_ref().map_or(true, |uri| {
          str::replace(&token_metadata.data.uri, "\u{0000}", "") == *uri
        })
        && !token_metadata_settings.name_is_name_service_name
        || verify_name(
          name,
          args.name_class,
          args.name_parent,
          &str::replace(&initialize_args.token_metadata.data.name, "\u{0000}", ""),
        )?;
      if !valid {
        return Err(error!(ErrorCode::InvalidTokenMetadataSettings));
      }
    }

    initialize_social_token_v0(
      &mut ctx.accounts.initialize_args,
      &mut ctx.accounts.owner_token_ref,
      &mut ctx.accounts.mint_token_ref,
      ctx.bumps,
    )?;
    let owner_token_ref = &mut ctx.accounts.owner_token_ref;
    let mint_token_ref = &mut ctx.accounts.mint_token_ref;

    owner_token_ref.name = Some(ctx.accounts.name.key());
    mint_token_ref.name = Some(ctx.accounts.name.key());
    owner_token_ref.owner = args.name_class;
    mint_token_ref.owner = owner_token_ref.owner;
    owner_token_ref.authority = owner_token_ref.owner;
    mint_token_ref.authority = owner_token_ref.owner;
    mint_token_ref.is_claimed = false;
    owner_token_ref.is_claimed = false;
    mint_token_ref.is_primary = false;
    owner_token_ref.is_primary = false;

    Ok(())
  }

  pub fn claim_social_token_v0(
    ctx: Context<ClaimSocialTokenV0>,
    args: ClaimSocialTokenV0Args,
  ) -> Result<()> {
    let new_token_ref = &mut ctx.accounts.new_token_ref;
    let mint_token_ref = &mut ctx.accounts.mint_token_ref;
    let data = &ctx.accounts.token_metadata.data;
    let token_program = &ctx.accounts.token_program;
    let owner = &ctx.accounts.owner;

    let mut royalty_accounts = vec![
      [
        &mut ctx.accounts.buy_base_royalties,
        &mut ctx.accounts.new_buy_base_royalties,
      ],
      [
        &mut ctx.accounts.sell_base_royalties,
        &mut ctx.accounts.new_sell_base_royalties,
      ],
      [
        &mut ctx.accounts.buy_target_royalties,
        &mut ctx.accounts.new_buy_target_royalties,
      ],
      [
        &mut ctx.accounts.sell_target_royalties,
        &mut ctx.accounts.new_sell_target_royalties,
      ],
    ];
    royalty_accounts.dedup_by(|a, b| a[0].key() == b[0].key());

    let seeds: &[&[&[u8]]] = &[&[
      b"mint-token-ref",
      ctx.accounts.target_mint.to_account_info().key.as_ref(),
      &[mint_token_ref.bump_seed],
    ]];

    for [old_royalty_account, new_royalty_account] in royalty_accounts {
      if old_royalty_account.owner == mint_token_ref.key() {
        transfer(
          CpiContext::new_with_signer(
            token_program.to_account_info().clone(),
            Transfer {
              from: old_royalty_account.to_account_info().clone(),
              to: new_royalty_account.to_account_info().clone(),
              authority: mint_token_ref.to_account_info().clone(),
            },
            seeds,
          ),
          old_royalty_account.amount,
        )?;
        close_token_account(CpiContext::new_with_signer(
          token_program.to_account_info().clone(),
          CloseTokenAccount {
            from: old_royalty_account.to_account_info().clone(),
            to: owner.to_account_info().clone(),
            authority: mint_token_ref.to_account_info().clone(),
          },
          seeds,
        ))?;
      }
    }

    new_token_ref.collective = mint_token_ref.collective;
    new_token_ref.token_bonding = mint_token_ref.token_bonding;
    new_token_ref.bump_seed = *ctx.bumps.get("new_token_ref").unwrap();
    new_token_ref.target_royalties_owner_bump_seed =
      mint_token_ref.target_royalties_owner_bump_seed;
    new_token_ref.token_metadata = mint_token_ref.token_metadata;
    new_token_ref.owner = Some(ctx.accounts.owner.key());
    new_token_ref.mint = mint_token_ref.mint;

    new_token_ref.authority = args.authority;
    mint_token_ref.authority = args.authority;

    mint_token_ref.owner = Some(ctx.accounts.owner.key());
    mint_token_ref.name = None;
    new_token_ref.is_claimed = true;
    mint_token_ref.is_claimed = true;
    new_token_ref.is_primary = args.is_primary;
    mint_token_ref.is_primary = args.is_primary;

    let token_bonding = ctx.accounts.token_bonding.clone();
    let seeds: &[&[&[u8]]] = &[&[
      b"mint-token-ref",
      ctx.accounts.target_mint.to_account_info().key.as_ref(),
      &[ctx.accounts.mint_token_ref.bump_seed],
    ]];

    update_metadata_account_v2(
      CpiContext::new_with_signer(
        ctx.accounts.token_metadata_program.clone(),
        UpdateMetadataAccount {
          token_metadata: ctx.accounts.token_metadata.to_account_info().clone(),
          update_authority: ctx.accounts.mint_token_ref.to_account_info(),
          new_update_authority: ctx.accounts.owner.to_account_info().clone(),
        },
        seeds,
      ),
      UpdateMetadataAccountArgs {
        name: data.name.to_owned(),
        symbol: data.symbol.to_owned(),
        uri: data.uri.to_owned(),
      },
    )?;

    spl_token_bonding::cpi::update_token_bonding_v0(
      CpiContext::new_with_signer(
        ctx.accounts.token_bonding_program.clone(),
        UpdateTokenBondingV0 {
          token_bonding: ctx.accounts.token_bonding.to_account_info().clone(),
          base_mint: ctx.accounts.base_mint.to_account_info().clone(),
          target_mint: ctx.accounts.target_mint.to_account_info().clone(),
          general_authority: ctx.accounts.mint_token_ref.to_account_info().clone(),
          buy_base_royalties: ctx
            .accounts
            .new_buy_base_royalties
            .to_account_info()
            .clone(),
          buy_target_royalties: ctx
            .accounts
            .new_buy_target_royalties
            .to_account_info()
            .clone(),
          sell_base_royalties: ctx
            .accounts
            .new_sell_base_royalties
            .to_account_info()
            .clone(),
          sell_target_royalties: ctx
            .accounts
            .new_sell_target_royalties
            .to_account_info()
            .clone(),
        },
        seeds,
      ),
      UpdateTokenBondingV0Args {
        general_authority: token_bonding.general_authority,
        buy_base_royalty_percentage: token_bonding.buy_base_royalty_percentage,
        buy_target_royalty_percentage: token_bonding.buy_target_royalty_percentage,
        sell_base_royalty_percentage: token_bonding.sell_base_royalty_percentage,
        sell_target_royalty_percentage: token_bonding.sell_target_royalty_percentage,
        buy_frozen: token_bonding.buy_frozen,
      },
    )?;

    let collective = get_collective(&ctx.accounts.collective);
    let token_bonding_settings_opt = &collective
      .as_ref()
      .and_then(|c| c.config.unclaimed_token_bonding_settings.as_ref());
    if let Some(token_bonding_settings) = token_bonding_settings_opt {
      verify_token_bonding_defaults(token_bonding_settings, &ctx.accounts.token_bonding)?;
      verify_token_bonding_royalties(
        token_bonding_settings_opt.unwrap(),
        &ctx.accounts.token_bonding,
        &ctx.accounts.mint_token_ref.key(),
        &ctx.accounts.buy_base_royalties.to_account_info(),
        &ctx.accounts.buy_target_royalties.to_account_info(),
        &ctx.accounts.sell_base_royalties.to_account_info(),
        &ctx.accounts.sell_target_royalties.to_account_info(),
        true,
      )?;
    }

    Ok(())
  }

  pub fn update_curve_v0(ctx: Context<UpdateCurveV0Wrapper>) -> Result<()> {
    let token_bonding = ctx.accounts.token_bonding.clone();
    let token_ref_seeds: &[&[&[u8]]] = &[&[
      b"mint-token-ref",
      ctx.accounts.target_mint.to_account_info().key.as_ref(),
      &[ctx.accounts.mint_token_ref.bump_seed],
    ]];

    spl_token_bonding::cpi::update_curve_v0(
      CpiContext::new_with_signer(
        ctx.accounts.token_bonding_program.clone(),
        UpdateCurveV0 {
          token_bonding: ctx.accounts.token_bonding.to_account_info().clone(),
          curve_authority: ctx.accounts.mint_token_ref.to_account_info().clone(),
          curve: ctx.accounts.curve.to_account_info().clone(),
        },
        token_ref_seeds,
      ),
      UpdateCurveV0Args {
        curve_authority: token_bonding.curve_authority,
      },
    )?;

    Ok(())
  }

  pub fn update_token_bonding_v0(
    ctx: Context<UpdateTokenBondingV0Wrapper>,
    args: UpdateTokenBondingV0ArgsWrapper,
  ) -> Result<()> {
    let token_bonding = ctx.accounts.token_bonding.clone();

    let seeds: &[&[&[u8]]] = &[&[
      b"mint-token-ref",
      ctx.accounts.target_mint.to_account_info().key.as_ref(),
      &[ctx.accounts.mint_token_ref.bump_seed],
    ]];

    spl_token_bonding::cpi::update_token_bonding_v0(
      CpiContext::new_with_signer(
        ctx.accounts.token_bonding_program.clone(),
        UpdateTokenBondingV0 {
          token_bonding: ctx.accounts.token_bonding.to_account_info().clone(),
          general_authority: ctx.accounts.mint_token_ref.to_account_info().clone(),
          base_mint: ctx.accounts.base_mint.to_account_info().clone(),
          target_mint: ctx.accounts.target_mint.to_account_info().clone(),
          buy_base_royalties: ctx.accounts.buy_base_royalties.to_account_info().clone(),
          sell_base_royalties: ctx.accounts.sell_base_royalties.to_account_info().clone(),
          buy_target_royalties: ctx.accounts.buy_target_royalties.to_account_info().clone(),
          sell_target_royalties: ctx.accounts.sell_target_royalties.to_account_info().clone(),
        },
        seeds,
      ),
      UpdateTokenBondingV0Args {
        general_authority: token_bonding.general_authority,
        buy_base_royalty_percentage: args.buy_base_royalty_percentage,
        buy_target_royalty_percentage: args.buy_target_royalty_percentage,
        sell_base_royalty_percentage: args.sell_base_royalty_percentage,
        sell_target_royalty_percentage: args.sell_target_royalty_percentage,
        buy_frozen: args.buy_frozen,
      },
    )?;

    let config = &ctx.accounts.collective.config;
    let token_bonding_settings_opt = if ctx.accounts.mint_token_ref.is_claimed {
      config.claimed_token_bonding_settings.as_ref()
    } else {
      config.unclaimed_token_bonding_settings.as_ref()
    };
    if let Some(token_bonding_settings) = token_bonding_settings_opt {
      verify_token_bonding_defaults(token_bonding_settings, &ctx.accounts.token_bonding)?;
      verify_token_bonding_royalties(
        token_bonding_settings,
        &ctx.accounts.token_bonding,
        &ctx.accounts.mint_token_ref.key(),
        &ctx.accounts.buy_base_royalties,
        &ctx.accounts.buy_target_royalties,
        &ctx.accounts.sell_base_royalties,
        &ctx.accounts.sell_target_royalties,
        true,
      )?;
    }

    Ok(())
  }

  pub fn change_opt_status_unclaimed_v0(
    ctx: Context<ChangeOptStatusUnclaimedV0>,
    args: ChangeOptStatusUnclaimedV0Args,
  ) -> Result<()> {
    let name_class = &ctx.remaining_accounts[0];
    let name_parent = &ctx.remaining_accounts[1];
    let name_parent_owner = &ctx.remaining_accounts[2];
    let valid_authority = get_seeds_and_key(
      &spl_name_service::ID,
      args.hashed_name,
      Some(name_class.key()),
      Some(name_parent.key()),
    ).0 == ctx.accounts.name.key() &&
    // No class, or is a signer
    (name_class.key() == Pubkey::default() || name_class.is_signer) &&
    // No parent, or parent owner is a signer (just plug parent owner into owner field)
    (name_parent.key() == Pubkey::default() ||
      (name_parent_owner.key() == get_name(name_parent)?.owner) &&
      name_parent_owner.is_signer
    );

    // Even if the name was never actually created, verify the name class and name parent are accurate
    if !valid_authority {
      return Err(error!(ErrorCode::InvalidNameAuthority));
    }

    ctx.accounts.owner_token_ref.is_opted_out = args.is_opted_out;
    ctx.accounts.mint_token_ref.is_opted_out = args.is_opted_out;

    let static_args = &ctx.accounts.token_bonding_update_accounts;
    let token_bonding = &static_args.token_bonding;
    let seeds: &[&[&[u8]]] = &[&[
      b"mint-token-ref",
      static_args.target_mint.to_account_info().key.as_ref(),
      &[ctx.accounts.mint_token_ref.bump_seed],
    ]];
    spl_token_bonding::cpi::update_token_bonding_v0(
      CpiContext::new_with_signer(
        ctx.accounts.token_bonding_program.clone(),
        UpdateTokenBondingV0 {
          token_bonding: token_bonding.to_account_info(),
          base_mint: static_args.base_mint.to_account_info(),
          target_mint: static_args.target_mint.to_account_info(),
          general_authority: ctx.accounts.mint_token_ref.to_account_info(),
          buy_base_royalties: static_args.buy_base_royalties.to_account_info(),
          buy_target_royalties: static_args.buy_target_royalties.to_account_info(),
          sell_base_royalties: static_args.sell_base_royalties.to_account_info(),
          sell_target_royalties: static_args.sell_target_royalties.to_account_info(),
        },
        seeds,
      ),
      UpdateTokenBondingV0Args {
        general_authority: token_bonding.general_authority,
        buy_base_royalty_percentage: token_bonding.buy_base_royalty_percentage,
        buy_target_royalty_percentage: token_bonding.buy_target_royalty_percentage,
        sell_base_royalty_percentage: token_bonding.sell_base_royalty_percentage,
        sell_target_royalty_percentage: token_bonding.sell_target_royalty_percentage,
        buy_frozen: args.is_opted_out,
      },
    )?;

    Ok(())
  }

  pub fn change_opt_status_claimed_v0(
    ctx: Context<ChangeOptStatusClaimedV0>,
    args: ChangeOptStatusClaimedV0Args,
  ) -> Result<()> {
    ctx.accounts.owner_token_ref.is_opted_out = args.is_opted_out;
    ctx.accounts.mint_token_ref.is_opted_out = args.is_opted_out;
    if ctx.accounts.primary_token_ref.collective == ctx.accounts.mint_token_ref.collective {
      ctx.accounts.primary_token_ref.is_opted_out = args.is_opted_out;
    }

    let static_args = &ctx.accounts.token_bonding_update_accounts;
    let token_bonding = &static_args.token_bonding;
    let seeds: &[&[&[u8]]] = &[&[
      b"mint-token-ref",
      static_args.target_mint.to_account_info().key.as_ref(),
      &[ctx.accounts.mint_token_ref.bump_seed],
    ]];
    spl_token_bonding::cpi::update_token_bonding_v0(
      CpiContext::new_with_signer(
        ctx.accounts.token_bonding_program.clone(),
        UpdateTokenBondingV0 {
          token_bonding: token_bonding.to_account_info(),
          base_mint: static_args.base_mint.to_account_info(),
          target_mint: static_args.target_mint.to_account_info(),
          general_authority: ctx.accounts.mint_token_ref.to_account_info(),
          buy_base_royalties: static_args.buy_base_royalties.to_account_info(),
          buy_target_royalties: static_args.buy_target_royalties.to_account_info(),
          sell_base_royalties: static_args.sell_base_royalties.to_account_info(),
          sell_target_royalties: static_args.sell_target_royalties.to_account_info(),
        },
        seeds,
      ),
      UpdateTokenBondingV0Args {
        general_authority: token_bonding.general_authority,
        buy_base_royalty_percentage: token_bonding.buy_base_royalty_percentage,
        buy_target_royalty_percentage: token_bonding.buy_target_royalty_percentage,
        sell_base_royalty_percentage: 0,
        sell_target_royalty_percentage: 0,
        buy_frozen: args.is_opted_out,
      },
    )?;

    Ok(())
  }

  // Args kept for backward compatibility
  pub fn update_owner_v0(ctx: Context<UpdateOwnerV0>, args: UpdateOwnerV0Args) -> Result<()> {
    let mint_token_ref = &mut ctx.accounts.mint_token_ref;
    // Change owner
    mint_token_ref.owner = Some(ctx.accounts.new_owner.key());

    let new_primary_token_ref = &ctx.accounts.new_primary_token_ref;
    let acct = new_primary_token_ref.to_account_info();
    let data: &[u8] = &acct.try_borrow_data()?;
    let disc_bytes = array_ref![data, 0, 8];
    if disc_bytes != &TokenRefV0::discriminator() && disc_bytes.iter().any(|a| a != &0) {
      return Err(error!(ErrorCode::AccountDiscriminatorMismatch));
    }

    let primary = &mut ctx.accounts.old_primary_token_ref;
    // Only update if this is for the same social token as the mint token ref
    // and if the new wallet doesn't already have a primary
    if primary.mint == mint_token_ref.mint {
      if ctx.accounts.new_primary_token_ref.mint == Pubkey::default() {
        // Was a primary for the current wallet, and no primary for the new wallet
        // Copy old token ref to new token ref
        let new_token_ref = &mut ctx.accounts.new_primary_token_ref;
        new_token_ref.set_inner(mint_token_ref.clone().into_inner());
        primary.close(ctx.accounts.payer.to_account_info())?;
        new_token_ref.is_primary = true;
        new_token_ref.bump_seed = *ctx
          .bumps
          .get("new_primary_token_ref")
          .unwrap_or(&args.primary_token_ref_bump_seed);
      }
    } else {
      // Wasn't a primary for the current wallet, and wasn't a primary for the new wallet
      if ctx.accounts.new_primary_token_ref.mint == Pubkey::default() {
        ctx
          .accounts
          .new_primary_token_ref
          .close(ctx.accounts.payer.to_account_info())?;
      }
    }

    // Copy old token ref to new token ref
    let new_token_ref = &mut ctx.accounts.new_owner_token_ref;
    new_token_ref.set_inner(mint_token_ref.clone().into_inner());
    new_token_ref.bump_seed = *ctx
      .bumps
      .get("new_owner_token_ref")
      .unwrap_or(&args.owner_token_ref_bump_seed);
    Ok(())
  }

  pub fn update_authority_v0(
    ctx: Context<UpdateAuthorityV0>,
    args: UpdateAuthorityV0Args,
  ) -> Result<()> {
    let primary = &mut ctx.accounts.primary_token_ref;
    if primary.authority.is_some()
      && primary.authority.unwrap() == ctx.accounts.authority.key()
      && primary.mint == ctx.accounts.mint_token_ref.mint
    {
      ctx.accounts.primary_token_ref.authority = Some(args.new_authority);
    }

    ctx.accounts.mint_token_ref.authority = Some(args.new_authority);
    ctx.accounts.owner_token_ref.authority = Some(args.new_authority);
    Ok(())
  }

  pub fn claim_bonding_authority_v0(ctx: Context<ClaimBondingAuthorityV0>) -> Result<()> {
    let mint_token_ref = &ctx.accounts.mint_token_ref;
    let token_bonding_update_accts = &ctx.accounts.token_bonding_update_accounts;
    let token_bonding = &token_bonding_update_accts.token_bonding;

    let seeds: &[&[&[u8]]] = &[&[
      b"mint-token-ref",
      mint_token_ref.mint.as_ref(),
      &[mint_token_ref.bump_seed],
    ]];

    update_reserve_authority_v0(
      CpiContext::new_with_signer(
        ctx.accounts.token_bonding_program.clone(),
        UpdateReserveAuthorityV0 {
          token_bonding: token_bonding_update_accts.token_bonding.to_account_info(),
          reserve_authority: mint_token_ref.to_account_info(),
        },
        seeds,
      ),
      UpdateReserveAuthorityV0Args {
        new_reserve_authority: mint_token_ref.authority,
      },
    )?;

    spl_token_bonding::cpi::update_token_bonding_v0(
      CpiContext::new_with_signer(
        ctx.accounts.token_bonding_program.clone(),
        UpdateTokenBondingV0 {
          token_bonding: token_bonding_update_accts
            .token_bonding
            .to_account_info()
            .clone(),
          base_mint: token_bonding_update_accts
            .base_mint
            .to_account_info()
            .clone(),
          target_mint: token_bonding_update_accts
            .target_mint
            .to_account_info()
            .clone(),
          general_authority: ctx.accounts.mint_token_ref.to_account_info().clone(),
          buy_base_royalties: token_bonding_update_accts
            .buy_base_royalties
            .to_account_info()
            .clone(),
          buy_target_royalties: token_bonding_update_accts
            .buy_target_royalties
            .to_account_info()
            .clone(),
          sell_base_royalties: token_bonding_update_accts
            .sell_base_royalties
            .to_account_info()
            .clone(),
          sell_target_royalties: token_bonding_update_accts
            .sell_target_royalties
            .to_account_info()
            .clone(),
        },
        seeds,
      ),
      UpdateTokenBondingV0Args {
        general_authority: mint_token_ref.authority,
        buy_base_royalty_percentage: token_bonding.buy_base_royalty_percentage,
        buy_target_royalty_percentage: token_bonding.buy_target_royalty_percentage,
        sell_base_royalty_percentage: token_bonding.sell_base_royalty_percentage,
        sell_target_royalty_percentage: token_bonding.sell_target_royalty_percentage,
        buy_frozen: token_bonding.buy_frozen,
      },
    )?;

    Ok(())
  }
}
