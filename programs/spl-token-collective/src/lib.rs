use {
    anchor_lang::{prelude::*, solana_program::system_program},
    anchor_spl::token::{Mint, TokenAccount, Transfer, transfer},
    borsh::{BorshDeserialize, BorshSerialize},
    spl_token_bonding::{UpdateTokenBondingV0Args, TokenBondingV0},
};

pub mod token_metadata;
pub mod name;
use spl_token_bonding::cpi::accounts::{UpdateTokenBondingV0};
use anchor_lang::solana_program::{self, hash::hashv};
use token_metadata::UpdateMetadataAccount;

use crate::token_metadata::{Metadata, UpdateMetadataAccountArgs};
use crate::name::{NameRecordHeader};

declare_id!("WumbodN8t7wcDPCY2nGszs4x6HRtL5mJcTR519Qr6m7");

#[derive(Accounts)]
pub struct CloseTokenAccount<'info> {
    pub from: AccountInfo<'info>,
    pub to: AccountInfo<'info>,
    pub authority: AccountInfo<'info>,
}

pub fn close_token_account<'a, 'b, 'c, 'info>(
    ctx: CpiContext<'a, 'b, 'c, 'info, CloseTokenAccount<'info>>,
) -> ProgramResult {
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
}

pub fn initialize_social_token_v0<'info>(
  accounts: &mut InitializeSocialTokenV0,
  token_ref: &mut Account<TokenRefV0>,
  reverse_token_ref: &mut Account<TokenRefV0>,
  args: InitializeSocialTokenV0Args,
) -> ProgramResult {
  token_ref.collective = accounts.collective.key();
  token_ref.token_bonding = accounts.token_bonding.key();
  token_ref.mint = accounts.token_bonding.target_mint;
  token_ref.bump_seed = args.token_ref_bump_seed;
  token_ref.token_metadata_update_authority_bump_seed = args.token_metadata_update_authority_bump_seed;
  token_ref.token_bonding_authority_bump_seed = args.token_bonding_authority_bump_seed;
  token_ref.token_metadata = accounts.token_metadata.key();

  reverse_token_ref.collective = accounts.collective.key();
  reverse_token_ref.token_bonding = accounts.token_bonding.key();
  reverse_token_ref.bump_seed = args.reverse_token_ref_bump_seed;
  reverse_token_ref.mint = accounts.token_bonding.target_mint;

  reverse_token_ref.token_metadata_update_authority_bump_seed = args.token_metadata_update_authority_bump_seed;
  reverse_token_ref.token_bonding_authority_bump_seed = args.token_bonding_authority_bump_seed;
  reverse_token_ref.token_metadata = accounts.token_metadata.key();

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

    pub fn initialize_owned_social_token_v0(
      ctx: Context<InitializeOwnedSocialTokenV0>,
      args: InitializeSocialTokenV0Args,
    ) -> ProgramResult {
      let initialize_args = &ctx.accounts.initialize_args;
      let config = &initialize_args.collective.config;
      let token_bonding_settings = config.claimed_token_bonding_settings.as_ref();
      if token_bonding_settings.is_some() {
        verify_token_bonding_defaults(&token_bonding_settings.unwrap(), &initialize_args.token_bonding)?;
        verify_token_bonding_royalties(
          &token_bonding_settings.unwrap(), 
          &initialize_args.token_bonding,
          &ctx.accounts.reverse_token_ref.key(),
          &initialize_args.buy_base_royalties,
          &initialize_args.buy_target_royalties,
          &initialize_args.sell_base_royalties,
          &initialize_args.sell_target_royalties,
          true
        )?;
      }

      initialize_social_token_v0(&mut ctx.accounts.initialize_args, &mut ctx.accounts.token_ref, &mut ctx.accounts.reverse_token_ref, args)?;
      let token_ref = &mut ctx.accounts.token_ref;
      let reverse_token_ref = &mut ctx.accounts.reverse_token_ref;

      token_ref.owner = Some(ctx.accounts.owner.key());
      reverse_token_ref.owner = Some(ctx.accounts.owner.key());
      reverse_token_ref.is_claimed = true;
      token_ref.is_claimed = true;

      Ok(())
    }

    pub fn initialize_unclaimed_social_token_v0(
      ctx: Context<InitializeUnclaimedSocialTokenV0>,
      args: InitializeSocialTokenV0Args,
    ) -> ProgramResult {
      let initialize_args = &ctx.accounts.initialize_args;
      let config = &initialize_args.collective.config;
      let token_bonding_settings_opt = config.unclaimed_token_bonding_settings.as_ref();
      let token_metadata_settings_opt = config.unclaimed_token_metadata_settings.as_ref();
      if token_bonding_settings_opt.is_some() {
        verify_token_bonding_defaults(&token_bonding_settings_opt.unwrap(), &initialize_args.token_bonding)?;
        verify_token_bonding_royalties(
          &token_bonding_settings_opt.unwrap(), 
          &initialize_args.token_bonding,
          &ctx.accounts.reverse_token_ref.key(),
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

      initialize_social_token_v0(&mut ctx.accounts.initialize_args, &mut ctx.accounts.token_ref,&mut ctx.accounts.reverse_token_ref, args)?;
      let token_ref = &mut ctx.accounts.token_ref;
      let reverse_token_ref = &mut ctx.accounts.reverse_token_ref;

      token_ref.name = Some(ctx.accounts.name.key());
      reverse_token_ref.name = Some(ctx.accounts.name.key());
      token_ref.owner = args.name_class;
      reverse_token_ref.owner = args.name_class;
      reverse_token_ref.is_claimed = false;
      token_ref.is_claimed = false;

      Ok(())
    }

    pub fn claim_social_token_v0(
      ctx: Context<ClaimSocialTokenV0>,
      args: ClaimSocialTokenV0Args
    ) -> ProgramResult {
      let token_ref = &mut ctx.accounts.token_ref;
      let new_token_ref = &mut ctx.accounts.new_token_ref;
      let reverse_token_ref = &mut ctx.accounts.reverse_token_ref;
      let data = &ctx.accounts.token_metadata.data;
      let token_program = &ctx.accounts.token_program;
      let owner = &ctx.accounts.owner;
      let royalties_owner = ctx.accounts.royalties_owner.to_account_info();

      let royalty_accounts = vec![
        [&mut ctx.accounts.buy_base_royalties, &mut ctx.accounts.new_buy_base_royalties], 
        [&mut ctx.accounts.buy_target_royalties, &mut ctx.accounts.new_buy_target_royalties], 
        [&mut ctx.accounts.sell_base_royalties, &mut ctx.accounts.new_sell_base_royalties], 
        [&mut ctx.accounts.sell_target_royalties, &mut ctx.accounts.new_sell_target_royalties], 
      ];
      let (standin_royalties_owner, standin_royalties_bump_seed) = Pubkey::find_program_address(
        &[b"standin-royalties-owner", reverse_token_ref.to_account_info().key.as_ref()],
        &self::id()
      );
      let seeds: &[&[&[u8]]] = &[
        &[b"standin-royalties-owner", reverse_token_ref.to_account_info().key.as_ref(), &[standin_royalties_bump_seed]]
      ];
      msg!("Closing standin royalties accounts");
      let mut i = 0;
      for [old_royalty_account, new_royalty_account] in royalty_accounts {
        if i > 1 { // Only possible collistions after index 2. Saves compute on reload
          old_royalty_account.reload()?; // Make sure the balance is up-to-date as one of the other royalty accts could be the same as this one.
        } else {
          i+=1;
        }
        
        if old_royalty_account.owner == standin_royalties_owner {
          transfer(
            CpiContext::new_with_signer(
                token_program.clone(),
                Transfer {
                  from: old_royalty_account.to_account_info().clone(),
                  to: new_royalty_account.to_account_info().clone(),
                  authority: royalties_owner.clone()
                },
                seeds
            ),
            old_royalty_account.amount
          )?;
          close_token_account(CpiContext::new_with_signer(
            token_program.clone(), 
            CloseTokenAccount {
              from: old_royalty_account.to_account_info().clone(),
              to: owner.clone(),
              authority: royalties_owner.clone()
            },
            seeds
          ))?;
        }
      }

      new_token_ref.collective = token_ref.collective;
      new_token_ref.token_bonding = token_ref.token_bonding;
      new_token_ref.bump_seed = args.token_ref_bump_seed;
      new_token_ref.token_metadata_update_authority_bump_seed = token_ref.token_metadata_update_authority_bump_seed;
      new_token_ref.token_bonding_authority_bump_seed = token_ref.token_bonding_authority_bump_seed;
      new_token_ref.target_royalties_owner_bump_seed = token_ref.target_royalties_owner_bump_seed;
      new_token_ref.token_metadata = token_ref.token_metadata;
      new_token_ref.owner = Some(ctx.accounts.owner.key());
      new_token_ref.mint = token_ref.mint;

      token_ref.owner = Some(ctx.accounts.owner.key());
      token_ref.name = None;
      reverse_token_ref.owner = Some(ctx.accounts.owner.key());
      reverse_token_ref.name = None;
      new_token_ref.is_claimed = true;
      reverse_token_ref.is_claimed = true;

      let token_bonding = ctx.accounts.token_bonding.clone();

      update_metadata_account(CpiContext::new_with_signer(
        ctx.accounts.token_metadata_program.clone(),
        UpdateMetadataAccount {
          token_metadata: ctx.accounts.token_metadata.to_account_info().clone(),
          update_authority: ctx.accounts.metadata_update_authority.to_account_info(),
          new_update_authority: ctx.accounts.owner.to_account_info().clone()
        },
        &[
          &[
            b"token-metadata-authority", ctx.accounts.reverse_token_ref.key().as_ref(),
            &[ctx.accounts.reverse_token_ref.token_metadata_update_authority_bump_seed]
          ],
        ]
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
          authority: ctx.accounts.token_bonding_authority.to_account_info().clone(),
          buy_base_royalties: ctx.accounts.new_buy_base_royalties.to_account_info().clone(),
          buy_target_royalties: ctx.accounts.new_buy_target_royalties.to_account_info().clone(),
          sell_base_royalties: ctx.accounts.new_sell_base_royalties.to_account_info().clone(),
          sell_target_royalties: ctx.accounts.new_sell_target_royalties.to_account_info().clone(),
        },
        &[
          &[
            b"token-bonding-authority", ctx.accounts.reverse_token_ref.key().as_ref(),
            &[ctx.accounts.reverse_token_ref.token_bonding_authority_bump_seed]
          ],
        ]
      ), UpdateTokenBondingV0Args {
        token_bonding_authority: token_bonding.authority,
        buy_base_royalty_percentage: token_bonding.buy_base_royalty_percentage,
        buy_target_royalty_percentage: token_bonding.buy_target_royalty_percentage,
        sell_base_royalty_percentage: token_bonding.sell_base_royalty_percentage,
        sell_target_royalty_percentage: token_bonding.sell_target_royalty_percentage,
        buy_frozen: token_bonding.buy_frozen,
      })?;

      let config = &ctx.accounts.collective.config;
      let token_bonding_settings_opt = config.unclaimed_token_bonding_settings.as_ref();
      if token_bonding_settings_opt.is_some() {
        verify_token_bonding_defaults(&token_bonding_settings_opt.unwrap(), &ctx.accounts.token_bonding)?;
        verify_token_bonding_royalties(
          &token_bonding_settings_opt.unwrap(), 
          &ctx.accounts.token_bonding,
          &ctx.accounts.reverse_token_ref.key(),
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
      
      spl_token_bonding::cpi::update_token_bonding_v0(CpiContext::new_with_signer(
        ctx.accounts.token_bonding_program.clone(),
        UpdateTokenBondingV0 {
          token_bonding: ctx.accounts.token_bonding.to_account_info().clone(),
          authority: ctx.accounts.token_bonding_authority.to_account_info().clone(),
          base_mint: ctx.accounts.base_mint.to_account_info().clone(),
          target_mint: ctx.accounts.target_mint.to_account_info().clone(),
          buy_base_royalties: ctx.accounts.buy_base_royalties.to_account_info().clone(),
          sell_base_royalties: ctx.accounts.sell_base_royalties.to_account_info().clone(),
          buy_target_royalties: ctx.accounts.buy_target_royalties.to_account_info().clone(),
          sell_target_royalties: ctx.accounts.sell_target_royalties.to_account_info().clone(),
        },
        &[
          &[
            b"token-bonding-authority", ctx.accounts.reverse_token_ref.key().as_ref(),
            &[ctx.accounts.reverse_token_ref.token_bonding_authority_bump_seed]
          ],
        ]
      ), UpdateTokenBondingV0Args {
        token_bonding_authority: token_bonding.authority,
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
          &ctx.accounts.reverse_token_ref.key(),
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


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct ClaimSocialTokenV0Args {
  pub token_ref_bump_seed: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeCollectiveV0Args {
    pub bump_seed: u8,
    pub authority: Option<Pubkey>,
    pub config: CollectiveConfigV0
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct CollectiveConfigV0 {
  pub is_open: bool,
  pub unclaimed_token_metadata_settings: Option<TokenMetadataSettingsV0>,
  pub unclaimed_token_bonding_settings: Option<TokenBondingSettingsV0>,
  pub claimed_token_bonding_settings: Option<TokenBondingSettingsV0>, // Note that this only enforces at entry into the collective. Some fields may be able to be changed
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenMetadataSettingsV0 {
    pub symbol: Option<String>,
    pub uri: Option<String>,
    pub name_is_name_service_name: bool
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct RoyaltySettingV0 {
  pub address: Option<Pubkey>, // Royalty must be at this address if set
  pub owned_by_name: bool, // If true, this account can be claimed by the name owner when they claim the token
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenBondingSettingsV0 {
    pub curve: Option<Pubkey>,
    pub min_sell_base_royalty_percentage: Option<u32>,
    pub min_sell_target_royalty_percentage: Option<u32>,
    pub max_sell_base_royalty_percentage: Option<u32>,
    pub max_sell_target_royalty_percentage: Option<u32>,
    pub min_buy_base_royalty_percentage: Option<u32>,
    pub min_buy_target_royalty_percentage: Option<u32>,
    pub max_buy_base_royalty_percentage: Option<u32>,
    pub max_buy_target_royalty_percentage: Option<u32>,
    pub target_mint_decimals: Option<u8>,
    pub buy_base_royalties: RoyaltySettingV0,
    pub sell_base_royalties: RoyaltySettingV0,
    pub buy_target_royalties: RoyaltySettingV0,
    pub sell_target_royalties: RoyaltySettingV0,
    pub min_purchase_cap: Option<u64>,
    pub max_purchase_cap: Option<u64>,
    pub min_mint_cap: Option<u64>,
    pub max_mint_cap: Option<u64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default, Copy)]
pub struct InitializeSocialTokenV0Args {
  pub name_parent: Option<Pubkey>,
  pub name_class: Option<Pubkey>,
  pub collective_bump_seed: u8,
  pub token_bonding_authority_bump_seed: u8,
  pub token_ref_bump_seed: u8,
  pub reverse_token_ref_bump_seed: u8,
  pub token_metadata_update_authority_bump_seed: u8,
}

#[derive(Accounts)]
#[instruction(args: InitializeCollectiveV0Args)]
pub struct InitializeCollectiveV0<'info> {
    #[account(init, seeds = [
      b"collective", 
      mint.key().as_ref()], 
      payer=payer,
      bump=args.bump_seed, 
      space=512
    )]
    collective: Box<Account<'info, CollectiveV0>>,
    #[account(
      constraint = *mint.to_account_info().owner == spl_token::id(),
      constraint = mint.mint_authority.unwrap() == mint_authority.key()
    )]
    mint: Account<'info, Mint>,
    #[account(signer)]
    mint_authority: AccountInfo<'info>,

    #[account(mut, signer)]
    payer: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    system_program: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
}

fn verify_authority(authority: Option<Pubkey>, seeds: &[&[u8]], bump: u8) -> Result<bool> {
  let (key, canonical_bump) = Pubkey::find_program_address(seeds, &self::id());

  if bump != canonical_bump {
    return Err(ErrorCode::InvalidBump.into());
  }

  if key != authority.ok_or::<ProgramError>(ErrorCode::NoAuthority.into())? {
    return Err(ErrorCode::InvalidAuthority.into());
  }

  Ok(true)
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

fn verify_name(name: &AccountInfo, name_class: Option<Pubkey>, name_parent: Option<Pubkey>, expected: &String) -> Result<bool> {
  let hashed_name: Vec<u8> = hashv(&[("SPL Name Service".to_owned() + expected).as_bytes()]).0.to_vec();

  let (address, _) = get_seeds_and_key(
    &spl_name_service::ID,
    hashed_name,
    name_class,
    name_parent,
  );

  msg!("Name vs address {} {}", *name.key, address);
  Ok(*name.key == address)
}

pub fn verify_token_bonding_royalties<'info>(
  defaults: &TokenBondingSettingsV0, 
  token_bonding: &Account<'info, TokenBondingV0>, 
  reverse_token_ref_key: &Pubkey,
  buy_base_royalties: &Account<'info, TokenAccount>,
  buy_target_royalties: &Account<'info, TokenAccount>,
  sell_base_royalties: &Account<'info, TokenAccount>,
  sell_target_royalties: &Account<'info, TokenAccount>,
  claimed: bool
) -> ProgramResult {
  let (standin_royalties_owner, _) = Pubkey::find_program_address(
    &[b"standin-royalties-owner", reverse_token_ref_key.as_ref()],
    &self::id()
  );

  let valid = (!claimed || (
      defaults.buy_base_royalties.address.map_or(true, |royalty| royalty == token_bonding.buy_base_royalties) &&
      defaults.buy_target_royalties.address.map_or(true, |royalty| royalty == token_bonding.buy_target_royalties) &&
      defaults.sell_base_royalties.address.map_or(true, |royalty| royalty == token_bonding.sell_base_royalties) &&
      defaults.sell_target_royalties.address.map_or(true, |royalty| royalty == token_bonding.sell_target_royalties)
    )) &&
    (claimed || (
      (!defaults.buy_base_royalties.owned_by_name || buy_base_royalties.owner == standin_royalties_owner) &&
      (!defaults.buy_target_royalties.owned_by_name || buy_target_royalties.owner == standin_royalties_owner) &&
      (!defaults.sell_base_royalties.owned_by_name || sell_base_royalties.owner == standin_royalties_owner) &&
      (!defaults.sell_target_royalties.owned_by_name || sell_target_royalties.owner == standin_royalties_owner)
    ));

  if valid {
    Ok(())
  } else {
    Err(ErrorCode::InvalidTokenBondingRoyalties.into())
  }
}

pub fn verify_token_bonding_defaults<'info>(defaults: &TokenBondingSettingsV0, token_bonding: &Account<'info, TokenBondingV0>) -> ProgramResult {
  let valid = defaults.curve.map_or(true, |curve| token_bonding.curve == curve) &&
    defaults.min_buy_base_royalty_percentage.map_or(true, |min| token_bonding.buy_base_royalty_percentage >= min) &&
    defaults.min_sell_base_royalty_percentage.map_or(true, |min| token_bonding.sell_base_royalty_percentage >= min) &&
    defaults.min_buy_target_royalty_percentage.map_or(true, |min| token_bonding.buy_target_royalty_percentage >= min) &&
    defaults.min_sell_target_royalty_percentage.map_or(true, |min| token_bonding.sell_target_royalty_percentage >= min) &&
    defaults.max_buy_base_royalty_percentage.map_or(true, |max| token_bonding.buy_base_royalty_percentage <= max) &&
    defaults.max_sell_base_royalty_percentage.map_or(true, |max| token_bonding.sell_base_royalty_percentage <= max) &&
    defaults.max_buy_target_royalty_percentage.map_or(true, |max| token_bonding.buy_target_royalty_percentage <= max) &&
    defaults.max_sell_target_royalty_percentage.map_or(true, |max| token_bonding.sell_target_royalty_percentage <= max) &&
    defaults.min_purchase_cap.map_or(true, |cap| token_bonding.purchase_cap.map_or(true, |bond_cap| bond_cap >= cap)) &&
    defaults.max_purchase_cap.map_or(true, |cap| token_bonding.purchase_cap.map_or(true, |bond_cap| bond_cap <= cap)) &&
    defaults.min_mint_cap.map_or(true, |cap| token_bonding.mint_cap.map_or(true, |bond_cap| bond_cap >= cap)) &&
    defaults.max_mint_cap.map_or(true, |cap| token_bonding.mint_cap.map_or(true, |bond_cap| bond_cap <= cap)) &&
    !token_bonding.sell_frozen &&
    token_bonding.freeze_buy_unix_time.is_none();
    // TODO: Go live check?
    // token_bonding_defaults.go_live_unix_time.map_or(true, |go_live| token_bonding.go_live_unix_time <= go_live) &&

  if valid {
    Ok(())
  } else {
    Err(ErrorCode::InvalidTokenBondingSettings.into())
  }
}

#[derive(Accounts)]
pub struct InitializeSocialTokenV0<'info> {
    #[account(mut, signer)]
    payer: AccountInfo<'info>,
    #[account(seeds = [b"collective", collective.mint.as_ref()], bump = collective.bump_seed)]
    collective: Box<Account<'info, CollectiveV0>>,
    #[account(
      constraint = token_bonding.base_mint.key() == collective.mint.key(),
      has_one = base_mint,
      has_one = target_mint,
      has_one = buy_base_royalties,
      has_one = buy_target_royalties,
      has_one = sell_base_royalties,
      has_one = sell_target_royalties,
    )]
    token_bonding: Box<Account<'info, TokenBondingV0>>,
    #[account(
      constraint = (
        token_metadata.data.creators.is_none() &&
        token_metadata.data.seller_fee_basis_points == 0
      ),
      constraint = token_metadata.is_mutable,
    )]
    token_metadata: Box<Account<'info, Metadata>>,
    pub base_mint: Box<Account<'info, Mint>>,
    #[account(
      constraint = target_mint.supply == 0
    )]
    pub target_mint: Box<Account<'info, Mint>>,
    pub buy_base_royalties: Box<Account<'info, TokenAccount>>,
    pub buy_target_royalties: Box<Account<'info, TokenAccount>>,
    pub sell_base_royalties: Box<Account<'info, TokenAccount>>,  
    pub sell_target_royalties: Box<Account<'info, TokenAccount>>,  
    #[account(address = system_program::ID)]
    system_program: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
    clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]

pub struct InitializeOwnedSocialTokenV0<'info> {
  initialize_args: InitializeSocialTokenV0<'info>,
  #[account(
    address = initialize_args.collective.authority.unwrap_or(Pubkey::default()),
    constraint = initialize_args.collective.config.is_open || authority.is_signer
  )]
  authority: AccountInfo<'info>,
  #[account(mut, signer)]
  payer: AccountInfo<'info>,
  #[account(
    init,
    seeds = [
        b"token-ref",
        initialize_args.collective.key().as_ref(),
        owner.key().as_ref(),
    ],
    bump = args.token_ref_bump_seed,
    payer = payer,
    space = 512
  )]
  token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    init,
    seeds = [
        b"reverse-token-ref",
        initialize_args.collective.key().as_ref(),
        initialize_args.token_bonding.target_mint.as_ref()
    ],
    constraint = verify_authority(initialize_args.token_bonding.authority, &[b"token-bonding-authority", reverse_token_ref.key().as_ref()], args.token_bonding_authority_bump_seed)?,
    bump = args.reverse_token_ref_bump_seed,
    payer = payer,
    space = 512,
  )]
  reverse_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    signer
  )]
  owner: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  system_program: AccountInfo<'info>,
  rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]
pub struct InitializeUnclaimedSocialTokenV0<'info> {
  initialize_args: InitializeSocialTokenV0<'info>,
  #[account(
    signer,
    address = initialize_args.collective.authority.unwrap_or(Pubkey::default())
  )]
  authority: AccountInfo<'info>,
  #[account(mut, signer)]
  payer: AccountInfo<'info>,
  #[account(
    init,
    seeds = [
        b"token-ref",
        initialize_args.collective.key().as_ref(),
        name.key().as_ref()
    ],
    bump = args.token_ref_bump_seed,
    payer = payer,
    space = 512
  )]
  token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    init,
    seeds = [
        b"reverse-token-ref",
        initialize_args.collective.key().as_ref(),
        initialize_args.token_bonding.target_mint.as_ref()
    ],
    bump = args.reverse_token_ref_bump_seed,
    payer = payer,
    space = 512,
    constraint = verify_authority(initialize_args.token_bonding.authority, &[b"token-bonding-authority", reverse_token_ref.key().as_ref()], args.token_bonding_authority_bump_seed)?,
    constraint = verify_authority(Some(initialize_args.token_metadata.update_authority), &[b"token-metadata-authority", reverse_token_ref.key().as_ref()], args.token_metadata_update_authority_bump_seed)?,
  )]
  reverse_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    constraint = (
      token_metadata.data.creators.is_none() &&
      token_metadata.data.seller_fee_basis_points == 0
    ),
    constraint = token_metadata.is_mutable,
  )]
  token_metadata: Box<Account<'info, Metadata>>,
  #[account(
    // Deserialize name account checked in token metadata constraint
    constraint = (*name.to_account_info().owner == system_program::ID && **name.try_borrow_lamports()? == 0_u64) || *name.to_account_info().owner == spl_name_service::ID,
  )]
  #[account(
    // Deserialize name account checked in token metadata constraint
  )]
  name: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  system_program: AccountInfo<'info>,
  rent: Sysvar<'info, Rent>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateTokenBondingV0ArgsWrapper {
  pub token_bonding_authority: Option<Pubkey>,
  /// Percentage of purchases that go to the founder
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub buy_base_royalty_percentage: u32,
  pub buy_target_royalty_percentage: u32,
  pub sell_base_royalty_percentage: u32,
  pub sell_target_royalty_percentage: u32,
  pub buy_frozen: bool,
}


#[derive(Accounts)]
#[instruction(args: UpdateTokenBondingV0ArgsWrapper)]
pub struct UpdateTokenBondingV0Wrapper<'info> {
  collective: Box<Account<'info, CollectiveV0>>,
  #[account(
    address = collective.authority.unwrap_or(Pubkey::default()),
    constraint = collective.config.is_open || authority.is_signer
  )]
  authority: AccountInfo<'info>,
  #[account(
    has_one = token_bonding,
    has_one = collective,
    constraint = owner.key() == reverse_token_ref.owner.ok_or::<ProgramError>(ErrorCode::IncorrectOwner.into())?
  )]
  reverse_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint
  )]
  token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(
    seeds = [
      b"token-bonding-authority", reverse_token_ref.key().as_ref()
    ],
    bump = reverse_token_ref.token_bonding_authority_bump_seed
  )]
  token_bonding_authority: AccountInfo<'info>,
  #[account(
    signer,
  )]
  owner: AccountInfo<'info>,

  #[account(address = spl_token_bonding::id())]
  pub token_bonding_program: AccountInfo<'info>,


  #[account(
    constraint = *base_mint.to_account_info().owner == spl_token::ID
  )]
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = target_mint.is_initialized,
    constraint = *target_mint.to_account_info().owner == *base_mint.to_account_info().owner
  )]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = buy_base_royalties.mint == *base_mint.to_account_info().key
  )]
  pub buy_base_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = buy_target_royalties.mint == *target_mint.to_account_info().key
  )] // Will init for you, since target mint doesn't exist yet.
  pub buy_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = sell_base_royalties.mint == *base_mint.to_account_info().key
  )]
  pub sell_base_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = sell_target_royalties.mint == *target_mint.to_account_info().key
  )] // Will init for you, since target mint doesn't exist yet.
  pub sell_target_royalties: Box<Account<'info, TokenAccount>>,
}

#[derive(Accounts)]
#[instruction(args: ClaimSocialTokenV0Args)]
pub struct ClaimSocialTokenV0<'info> {
  collective: Box<Account<'info, CollectiveV0>>,
  #[account(
    mut,
    has_one = collective,
    has_one = token_bonding,
    has_one = token_metadata,
    seeds = [
        b"token-ref",
        collective.key().as_ref(),
        name.key().as_ref()
    ],
    bump = token_ref.bump_seed,
    close = owner
  )]
  token_ref: Account<'info, TokenRefV0>,
  #[account(
    init,
    seeds = [
        b"token-ref",
        collective.key().as_ref(),
        owner.key().as_ref()
    ],
    bump = args.token_ref_bump_seed,
    payer = owner,
    space = 512,
  )]
  new_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    has_one = collective,
    has_one = token_bonding,
    has_one = token_metadata,
    seeds = [
        b"reverse-token-ref",
        collective.key().as_ref(),
        token_bonding.target_mint.as_ref()
    ],
    bump = reverse_token_ref.bump_seed,
  )]
  reverse_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint,
    constraint = token_bonding.authority.unwrap() == token_bonding_authority.key(),
    has_one = buy_base_royalties,
    has_one = buy_target_royalties,
    has_one = sell_base_royalties,
    has_one = sell_target_royalties
  )]
  token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(mut)]
  token_metadata: Account<'info, Metadata>,
  #[account(
    seeds = [
      b"token-bonding-authority", reverse_token_ref.key().as_ref()
    ],
    bump = token_ref.token_bonding_authority_bump_seed
  )]
  token_bonding_authority: AccountInfo<'info>,
  #[account(
    seeds = [
      b"token-metadata-authority", reverse_token_ref.key().as_ref()
    ],
    bump = token_ref.token_metadata_update_authority_bump_seed
  )]
  metadata_update_authority: AccountInfo<'info>,

  #[account(
    has_one = owner
  )]
  name: Box<Account<'info, NameRecordHeader>>,
  #[account(
    mut,
    signer,
  )]
  owner: AccountInfo<'info>,

  base_mint: Box<Account<'info, Mint>>,
  target_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  buy_base_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  buy_target_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  sell_base_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  sell_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(mut)]
  new_buy_base_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  new_buy_target_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  new_sell_base_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  new_sell_target_royalties: Box<Account<'info, TokenAccount>>,

  royalties_owner: AccountInfo<'info>,

  #[account(address = spl_token_bonding::id())]
  token_bonding_program: AccountInfo<'info>,
  #[account(address = spl_token::ID)]
  token_program: AccountInfo<'info>,
  #[account(address = token_metadata::ID)]
  token_metadata_program: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  system_program: AccountInfo<'info>,
  rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(Default)]
pub struct CollectiveV0 {
    pub mint: Pubkey,
    pub authority: Option<Pubkey>,
    pub config: CollectiveConfigV0,
    pub bump_seed: u8
}

#[account]
#[derive(Default)]
pub struct TokenRefV0 {
    pub collective: Pubkey,
    pub token_metadata: Pubkey,
    pub mint: Pubkey,
    pub token_bonding: Pubkey,
    pub name: Option<Pubkey>,
    pub owner: Option<Pubkey>, // Either the owner wallet, or the name class. Name class on unclaimed has the authority to opt out, etc.
    pub is_claimed: bool,

    pub bump_seed: u8,
    pub token_bonding_authority_bump_seed: u8,
    pub target_royalties_owner_bump_seed: u8,
    pub token_metadata_update_authority_bump_seed: u8,
}

#[error]
pub enum ErrorCode {
    #[msg("Provided account does not have an authority")]
    NoAuthority,

    #[msg("The bump provided did not match the canonical bump")]
    InvalidBump,

    #[msg("Invalid authority passed")]
    InvalidAuthority,

    #[msg("Bonding curve had invalid settings to join this collective")]
    InvalidTokenBondingSettings,

    #[msg("Bonding curve had invalid royalties accounts to join this collective")]
    InvalidTokenBondingRoyalties,

    #[msg("Unclaimed token had invalid metadata settings to join this collective")]
    InvalidTokenMetadataSettings,

    #[msg("Incorrect owner on account")]
    IncorrectOwner
}
