#![allow(clippy::or_fun_call)]

use crate::token_metadata::update_metadata_account;
use std::str::FromStr;
use {
  anchor_lang::prelude::*,
  anchor_spl::token::{transfer, Transfer},
  borsh::{BorshDeserialize, BorshSerialize},
  spl_token_bonding::arg::UpdateTokenBondingV0Args,
};

pub mod account;
pub mod arg;
pub mod error;
pub mod name;
pub mod state;
pub mod token_metadata;
pub mod util;

use spl_token_bonding::cpi::accounts::UpdateTokenBondingV0;
use token_metadata::UpdateMetadataAccount;

use crate::token_metadata::UpdateMetadataAccountArgs;
use crate::{account::*, arg::*, error::*, state::*, util::*};

const WUMBO_KEY: &str = "Gzyvrg8gJfShKQwhVYFXV5utp86tTcMxSzrN7zcfebKj";

const EARLY_LAUNCH_GO_LIVE: i64 = 1; // Jan 19th 9am CST
const LAUNCH_GO_LIVE: i64 = 1; // Jan 20th 9am CST

declare_id!("TCo1sfSr2nCudbeJPykbif64rG9K1JNMGzrtzvPmp3y");

pub fn initialize_social_token_v0(
  accounts: &mut InitializeSocialTokenV0,
  owner_token_ref: &mut Account<TokenRefV0>,
  mint_token_ref: &mut Account<TokenRefV0>,
  args: &InitializeSocialTokenV0Args,
) -> ProgramResult {
  let c = get_collective(accounts.collective.clone());
  let collective = c.as_ref();
  if let Some(collective) = collective {
    if !collective.config.is_open {
      let authority = collective
        .authority
        .ok_or::<ProgramError>(ErrorCode::InvalidAuthority.into())?;
      if accounts.authority.key() != authority || !accounts.authority.is_signer {
        return Err(ErrorCode::InvalidAuthority.into());
      }

      if accounts.token_bonding.base_mint.key() != collective.mint.key() {
        return Err(ErrorCode::InvalidCollective.into());
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
  owner_token_ref.bump_seed = args.owner_token_ref_bump_seed;
  owner_token_ref.token_metadata = accounts.token_metadata.key();

  mint_token_ref.collective = owner_token_ref.collective;
  mint_token_ref.token_bonding = Some(accounts.token_bonding.key());
  mint_token_ref.bump_seed = args.mint_token_ref_bump_seed;
  mint_token_ref.mint = accounts.token_bonding.target_mint;

  mint_token_ref.token_metadata = accounts.token_metadata.key();

  Ok(())
}

pub fn get_collective(collective: UncheckedAccount) -> Option<CollectiveV0> {
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
  use super::*;

  pub fn initialize_collective_v0(
    ctx: Context<InitializeCollectiveV0>,
    args: InitializeCollectiveV0Args,
  ) -> ProgramResult {
    let collective = &mut ctx.accounts.collective;

    collective.mint = ctx.accounts.mint.key();
    collective.config = args.config;
    collective.authority = args.authority;
    collective.bump_seed = args.bump_seed;

    Ok(())
  }

  pub fn update_collective_v0(
    ctx: Context<UpdateCollectiveV0>,
    args: UpdateCollectiveV0Args,
  ) -> ProgramResult {
    let collective = &mut ctx.accounts.collective;

    collective.config = args.config;
    collective.authority = args.authority;

    Ok(())
  }

  pub fn set_as_primary_v0(
    ctx: Context<SetAsPrimaryV0>,
    args: SetAsPrimaryV0Args,
  ) -> ProgramResult {
    let token_ref = &ctx.accounts.token_ref;
    let primary_token_ref = &mut ctx.accounts.primary_token_ref;

    primary_token_ref.collective = token_ref.collective;
    primary_token_ref.token_metadata = token_ref.token_metadata;
    primary_token_ref.mint = token_ref.mint;
    primary_token_ref.token_bonding = token_ref.token_bonding;
    primary_token_ref.name = token_ref.name;
    primary_token_ref.owner = token_ref.owner;
    primary_token_ref.authority = token_ref.authority;
    primary_token_ref.is_claimed = token_ref.is_claimed;
    primary_token_ref.is_primary = true;
    primary_token_ref.bump_seed = args.bump_seed;
    primary_token_ref.target_royalties_owner_bump_seed = token_ref.target_royalties_owner_bump_seed;

    Ok(())
  }

  pub fn initialize_owned_social_token_v0(
    ctx: Context<InitializeOwnedSocialTokenV0>,
    args: InitializeSocialTokenV0Args,
  ) -> ProgramResult {
    let collective = get_collective(ctx.accounts.initialize_args.collective.clone());
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

    let correct_go_live = initialize_args.token_bonding.go_live_unix_time >= LAUNCH_GO_LIVE;
    if !correct_go_live {
      return Err(ErrorCode::InvalidGoLive.into());
    }

    initialize_social_token_v0(
      &mut ctx.accounts.initialize_args,
      &mut ctx.accounts.owner_token_ref,
      &mut ctx.accounts.mint_token_ref,
      &args,
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
  ) -> ProgramResult {
    let collective = get_collective(ctx.accounts.initialize_args.collective.clone());
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
    let wumbo = Pubkey::from_str(WUMBO_KEY).unwrap();
    let is_wumbo = ctx.accounts.initialize_args.payer.key() == wumbo;
    // TOOD: We can remove this after launch.
    if timestamp > LAUNCH_GO_LIVE && initialize_args.token_bonding.go_live_unix_time > timestamp {
      return Err(ErrorCode::UnclaimedNotLive.into());
    }

    let set_go_live = initialize_args.token_bonding.go_live_unix_time;

    let correct_go_live = (is_wumbo && set_go_live >= EARLY_LAUNCH_GO_LIVE)
      || (!is_wumbo && set_go_live >= LAUNCH_GO_LIVE);
    if !correct_go_live {
      return Err(ErrorCode::InvalidGoLive.into());
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
        return Err(ErrorCode::InvalidTokenMetadataSettings.into());
      }
    }

    initialize_social_token_v0(
      &mut ctx.accounts.initialize_args,
      &mut ctx.accounts.owner_token_ref,
      &mut ctx.accounts.mint_token_ref,
      &args,
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
  ) -> ProgramResult {
    let owner_token_ref = &mut ctx.accounts.owner_token_ref;
    let new_token_ref = &mut ctx.accounts.new_token_ref;
    let mint_token_ref = &mut ctx.accounts.mint_token_ref;
    let data = &ctx.accounts.token_metadata.data;
    let token_program = &ctx.accounts.token_program;
    let owner = &ctx.accounts.owner;

    let royalty_accounts = vec![
      [
        &mut ctx.accounts.buy_base_royalties,
        &mut ctx.accounts.new_buy_base_royalties,
      ],
      [
        &mut ctx.accounts.buy_target_royalties,
        &mut ctx.accounts.new_buy_target_royalties,
      ],
      [
        &mut ctx.accounts.sell_base_royalties,
        &mut ctx.accounts.new_sell_base_royalties,
      ],
      [
        &mut ctx.accounts.sell_target_royalties,
        &mut ctx.accounts.new_sell_target_royalties,
      ],
    ];
    let seeds: &[&[&[u8]]] = &[&[
      b"mint-token-ref",
      ctx.accounts.target_mint.to_account_info().key.as_ref(),
      &[mint_token_ref.bump_seed],
    ]];
    msg!("Closing standin royalties accounts");
    let mut i = 0;
    for [old_royalty_account, new_royalty_account] in royalty_accounts {
      if i > 1 {
        // Only possible collistions after index 2. Saves compute on reload
        old_royalty_account.reload()?; // Make sure the balance is up-to-date as one of the other royalty accts could be the same as this one.
      } else {
        i += 1;
      }

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

    new_token_ref.collective = owner_token_ref.collective;
    new_token_ref.token_bonding = owner_token_ref.token_bonding;
    new_token_ref.bump_seed = args.owner_token_ref_bump_seed;
    new_token_ref.target_royalties_owner_bump_seed =
      owner_token_ref.target_royalties_owner_bump_seed;
    new_token_ref.token_metadata = owner_token_ref.token_metadata;
    new_token_ref.owner = Some(ctx.accounts.owner.key());
    new_token_ref.mint = owner_token_ref.mint;

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

    update_metadata_account(
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

    let collective = get_collective(ctx.accounts.collective.clone());
    let token_bonding_settings_opt = &collective
      .as_ref()
      .and_then(|c| c.config.unclaimed_token_bonding_settings.as_ref());
    if let Some(token_bonding_settings) = token_bonding_settings_opt {
      verify_token_bonding_defaults(token_bonding_settings, &ctx.accounts.token_bonding)?;
      verify_token_bonding_royalties(
        token_bonding_settings_opt.unwrap(),
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

  pub fn update_token_bonding_v0(
    ctx: Context<UpdateTokenBondingV0Wrapper>,
    args: UpdateTokenBondingV0ArgsWrapper,
  ) -> ProgramResult {
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
  ) -> ProgramResult {
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
      return Err(ErrorCode::InvalidNameAuthority.into());
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
    args: ChangeOptStatusUnclaimedV0Args,
  ) -> ProgramResult {
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
}
