use {
    anchor_lang::{prelude::*},
    anchor_spl::token::{Transfer, transfer},
    borsh::{BorshDeserialize, BorshSerialize},
    spl_token_bonding::{arg::{UpdateTokenBondingV0Args}},
};

pub mod token_metadata;
pub mod name;
pub mod error;
pub mod account;
pub mod arg;
pub mod state;
pub mod util;

use spl_token_bonding::cpi::accounts::{UpdateTokenBondingV0};
use token_metadata::UpdateMetadataAccount;

use crate::token_metadata::{UpdateMetadataAccountArgs};
use crate::{account::*, arg::*, error::*, util::*, state::*};

declare_id!("TCo1sP6RwuCuyHPHjxgzcrq4dX4BKf9oRQ3aJMcdFry");

pub fn initialize_social_token_v0<'info>(
  accounts: &mut InitializeSocialTokenV0,
  owner_token_ref: &mut Account<TokenRefV0>,
  mint_token_ref: &mut Account<TokenRefV0>,
  args: InitializeSocialTokenV0Args,
) -> ProgramResult {
  owner_token_ref.collective = if accounts.collective.collective.is_some() { Some(accounts.collective.key()) } else { None };
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

#[program]
pub mod spl_token_collective {

  use crate::token_metadata::update_metadata_account;

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
    args: UpdateCollectiveV0Args
  ) -> ProgramResult {
    let collective = &mut ctx.accounts.collective;

    collective.config = args.config;
    collective.authority = args.authority;

    Ok(())
  }

  pub fn set_as_primary_v0(
    ctx: Context<SetAsPrimaryV0>,
    args: SetAsPrimaryV0Args
  ) -> ProgramResult {
    let owner_token_ref = &ctx.accounts.owner_token_ref;
    let primary_token_ref = &mut ctx.accounts.primary_token_ref;

    primary_token_ref.collective = owner_token_ref.collective;
    primary_token_ref.token_metadata = owner_token_ref.token_metadata;
    primary_token_ref.mint = owner_token_ref.mint;
    primary_token_ref.token_bonding = owner_token_ref.token_bonding;
    primary_token_ref.name = owner_token_ref.name;
    primary_token_ref.owner = owner_token_ref.owner;
    primary_token_ref.is_claimed = owner_token_ref.is_claimed;
    primary_token_ref.is_primary = true;
    primary_token_ref.bump_seed = args.bump_seed;
    primary_token_ref.target_royalties_owner_bump_seed = owner_token_ref.target_royalties_owner_bump_seed;

    Ok(())
  }

  pub fn initialize_owned_social_token_v0(
    ctx: Context<InitializeOwnedSocialTokenV0>,
    args: InitializeSocialTokenV0Args,
  ) -> ProgramResult {
    let initialize_args = &ctx.accounts.initialize_args;
    let token_bonding_settings = &initialize_args.collective.collective.as_ref().and_then(|c| c.config.claimed_token_bonding_settings.as_ref());
    if token_bonding_settings.is_some() {
      verify_token_bonding_defaults(&token_bonding_settings.unwrap(), &initialize_args.token_bonding)?;
      verify_token_bonding_royalties(
        &token_bonding_settings.unwrap(), 
        &initialize_args.token_bonding,
        &ctx.accounts.mint_token_ref.key(),
        &initialize_args.buy_base_royalties,
        &initialize_args.buy_target_royalties,
        &initialize_args.sell_base_royalties,
        &initialize_args.sell_target_royalties,
        true
      )?;
    }

    initialize_social_token_v0(&mut ctx.accounts.initialize_args, &mut ctx.accounts.owner_token_ref, &mut ctx.accounts.mint_token_ref, args)?;
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
    let initialize_args = &ctx.accounts.initialize_args;
    let config = initialize_args.collective.collective.as_ref().map(|c| &c.config);
    let token_bonding_settings_opt = config.and_then(|c| c.unclaimed_token_bonding_settings.as_ref());
    let token_metadata_settings_opt = config.and_then(|c| c.unclaimed_token_metadata_settings.as_ref());
    if token_bonding_settings_opt.is_some() {
      verify_token_bonding_defaults(&token_bonding_settings_opt.unwrap(), &initialize_args.token_bonding)?;
      verify_token_bonding_royalties(
        &token_bonding_settings_opt.unwrap(), 
        &initialize_args.token_bonding,
        &ctx.accounts.mint_token_ref.key(),
        &initialize_args.buy_base_royalties,
        &initialize_args.buy_target_royalties,
        &initialize_args.sell_base_royalties,
        &initialize_args.sell_target_royalties,
        false
      )?;
    }

    if token_metadata_settings_opt.is_some() {
      let token_metadata_settings = token_metadata_settings_opt.unwrap();
      let token_metadata = &ctx.accounts.token_metadata;
      let name = &ctx.accounts.name;

      let valid = token_metadata_settings.symbol.as_ref().map_or(true, |symbol| str::replace(&token_metadata.data.symbol, "\u{0000}", "") == *symbol) &&
        token_metadata_settings.uri.as_ref().map_or(true, |uri| str::replace(&token_metadata.data.uri, "\u{0000}", "") == *uri) &&
        !token_metadata_settings.name_is_name_service_name || verify_name(&name, args.name_class, args.name_parent, &str::replace(&initialize_args.token_metadata.data.name, "\u{0000}", ""))?;
      if !valid {
        return Err(ErrorCode::InvalidTokenMetadataSettings.into())
      }
    }

    initialize_social_token_v0(&mut ctx.accounts.initialize_args, &mut ctx.accounts.owner_token_ref,&mut ctx.accounts.mint_token_ref, args)?;
    let owner_token_ref = &mut ctx.accounts.owner_token_ref;
    let mint_token_ref = &mut ctx.accounts.mint_token_ref;

    owner_token_ref.name = Some(ctx.accounts.name.key());
    mint_token_ref.name = Some(ctx.accounts.name.key());
    owner_token_ref.owner = args.name_class;
    mint_token_ref.owner = args.name_class;
    owner_token_ref.authority = args.name_class;
    mint_token_ref.authority = args.name_class;
    mint_token_ref.is_claimed = false;
    owner_token_ref.is_claimed = false;
    mint_token_ref.is_primary = false;
    owner_token_ref.is_primary = false;


    Ok(())
  }

  pub fn claim_social_token_v0(
    ctx: Context<ClaimSocialTokenV0>,
    args: ClaimSocialTokenV0Args
  ) -> ProgramResult {
    let owner_token_ref = &mut ctx.accounts.owner_token_ref;
    let new_token_ref = &mut ctx.accounts.new_token_ref;
    let mint_token_ref = &mut ctx.accounts.mint_token_ref;
    let data = &ctx.accounts.token_metadata.data;
    let token_program = &ctx.accounts.token_program;
    let owner = &ctx.accounts.owner;

    let royalty_accounts = vec![
      [&mut ctx.accounts.buy_base_royalties, &mut ctx.accounts.new_buy_base_royalties], 
      [&mut ctx.accounts.buy_target_royalties, &mut ctx.accounts.new_buy_target_royalties], 
      [&mut ctx.accounts.sell_base_royalties, &mut ctx.accounts.new_sell_base_royalties], 
      [&mut ctx.accounts.sell_target_royalties, &mut ctx.accounts.new_sell_target_royalties], 
    ];
    let seeds: &[&[&[u8]]] = &[
      &[
        b"mint-token-ref", ctx.accounts.target_mint.to_account_info().key.as_ref(),
        &[mint_token_ref.bump_seed]
      ],
    ];
    msg!("Closing standin royalties accounts");
    let mut i = 0;
    for [old_royalty_account, new_royalty_account] in royalty_accounts {
      if i > 1 { // Only possible collistions after index 2. Saves compute on reload
        old_royalty_account.reload()?; // Make sure the balance is up-to-date as one of the other royalty accts could be the same as this one.
      } else {
        i+=1;
      }
      
      if old_royalty_account.owner == mint_token_ref.key() {
        transfer(
          CpiContext::new_with_signer(
              token_program.to_account_info().clone(),
              Transfer {
                from: old_royalty_account.to_account_info().clone(),
                to: new_royalty_account.to_account_info().clone(),
                authority: mint_token_ref.to_account_info().clone()
              },
              seeds
          ),
          old_royalty_account.amount
        )?;
        close_token_account(CpiContext::new_with_signer(
          token_program.to_account_info().clone(), 
          CloseTokenAccount {
            from: old_royalty_account.to_account_info().clone(),
            to: owner.to_account_info().clone(),
            authority: mint_token_ref.to_account_info().clone()
          },
          seeds
        ))?;
      }
    }

    new_token_ref.collective = owner_token_ref.collective;
    new_token_ref.token_bonding = owner_token_ref.token_bonding;
    new_token_ref.bump_seed = args.owner_token_ref_bump_seed;
    new_token_ref.target_royalties_owner_bump_seed = owner_token_ref.target_royalties_owner_bump_seed;
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
    let seeds: &[&[&[u8]]] = &[
      &[
        b"mint-token-ref", ctx.accounts.target_mint.to_account_info().key.as_ref(),
        &[ctx.accounts.mint_token_ref.bump_seed]
      ],
    ];

    update_metadata_account(CpiContext::new_with_signer(
      ctx.accounts.token_metadata_program.clone(),
      UpdateMetadataAccount {
        token_metadata: ctx.accounts.token_metadata.to_account_info().clone(),
        update_authority: ctx.accounts.mint_token_ref.to_account_info(),
        new_update_authority: ctx.accounts.owner.to_account_info().clone()
      },
      seeds
    ), UpdateMetadataAccountArgs {
      name: data.name.to_owned(),
      symbol: data.symbol.to_owned(),
      uri: data.uri.to_owned(),
    })?;

    
    spl_token_bonding::cpi::update_token_bonding_v0(CpiContext::new_with_signer(
      ctx.accounts.token_bonding_program.clone(),
      UpdateTokenBondingV0 {
        token_bonding: ctx.accounts.token_bonding.to_account_info().clone(),
        base_mint: ctx.accounts.base_mint.to_account_info().clone(),
        target_mint: ctx.accounts.target_mint.to_account_info().clone(),
        general_authority: ctx.accounts.mint_token_ref.to_account_info().clone(),
        buy_base_royalties: ctx.accounts.new_buy_base_royalties.to_account_info().clone(),
        buy_target_royalties: ctx.accounts.new_buy_target_royalties.to_account_info().clone(),
        sell_base_royalties: ctx.accounts.new_sell_base_royalties.to_account_info().clone(),
        sell_target_royalties: ctx.accounts.new_sell_target_royalties.to_account_info().clone(),
      },
      seeds
    ), UpdateTokenBondingV0Args {
      general_authority: token_bonding.general_authority,
      buy_base_royalty_percentage: token_bonding.buy_base_royalty_percentage,
      buy_target_royalty_percentage: token_bonding.buy_target_royalty_percentage,
      sell_base_royalty_percentage: token_bonding.sell_base_royalty_percentage,
      sell_target_royalty_percentage: token_bonding.sell_target_royalty_percentage,
      buy_frozen: token_bonding.buy_frozen,
    })?;

    let token_bonding_settings_opt = &ctx.accounts.collective.collective.as_ref().and_then(|c| c.config.unclaimed_token_bonding_settings.as_ref());
    if token_bonding_settings_opt.is_some() {
      verify_token_bonding_defaults(&token_bonding_settings_opt.unwrap(), &ctx.accounts.token_bonding)?;
      verify_token_bonding_royalties(
        &token_bonding_settings_opt.unwrap(), 
        &ctx.accounts.token_bonding,
        &ctx.accounts.mint_token_ref.key(),
        &ctx.accounts.buy_base_royalties,
        &ctx.accounts.buy_target_royalties,
        &ctx.accounts.sell_base_royalties,
        &ctx.accounts.sell_target_royalties,
        true
      )?;
    }

    Ok(())
  }

  pub fn update_token_bonding_v0(ctx: Context<UpdateTokenBondingV0Wrapper>, args: UpdateTokenBondingV0ArgsWrapper) -> ProgramResult {
    let token_bonding = ctx.accounts.token_bonding.clone();
    
    let seeds: &[&[&[u8]]] = &[
      &[
        b"mint-token-ref", ctx.accounts.target_mint.to_account_info().key.as_ref(),
        &[ctx.accounts.mint_token_ref.bump_seed]
      ],
    ];
    spl_token_bonding::cpi::update_token_bonding_v0(CpiContext::new_with_signer(
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
      seeds
    ), UpdateTokenBondingV0Args {
      general_authority: token_bonding.general_authority,
      buy_base_royalty_percentage: args.buy_base_royalty_percentage,
      buy_target_royalty_percentage: args.buy_target_royalty_percentage,
      sell_base_royalty_percentage: args.sell_base_royalty_percentage,
      sell_target_royalty_percentage: args.sell_target_royalty_percentage,
      buy_frozen: args.buy_frozen,
    })?;

    let config = &ctx.accounts.collective.config;
    let token_bonding_settings_opt = config.unclaimed_token_bonding_settings.as_ref();
    if token_bonding_settings_opt.is_some() {
      verify_token_bonding_defaults(&token_bonding_settings_opt.unwrap(), &ctx.accounts.token_bonding)?;
      verify_token_bonding_royalties(
        &token_bonding_settings_opt.unwrap(), 
        &ctx.accounts.token_bonding,
        &ctx.accounts.mint_token_ref.key(),
        &ctx.accounts.buy_base_royalties,
        &ctx.accounts.buy_target_royalties,
        &ctx.accounts.sell_base_royalties,
        &ctx.accounts.sell_target_royalties,
        true
      )?;
    }

    Ok(())
  }
}
