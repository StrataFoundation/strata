use {
    anchor_lang::solana_program::program_pack::Pack,
    anchor_lang::{prelude::*, solana_program::system_program},
    anchor_spl::token::{self, InitializeAccount, Mint, TokenAccount},
    borsh::{BorshDeserialize, BorshSerialize},
    spl_token_metadata::{
        instruction::{update_metadata_accounts},
        state::{MAX_NAME_LENGTH, MAX_SYMBOL_LENGTH, MAX_URI_LENGTH}
    },
    spl_name_service::state::NameRecordHeader,
    spl_token_bonding::{CurveV0, TokenBondingV0},
    spl_token_staking::{TokenStakingV0},
    spl_token_account_split::{TokenAccountSplitV0},
    sha2::Sha256
};

pub mod token_metadata;

use sha2::{Digest, digest::generic_array::{GenericArray, typenum::{UInt, UTerm, bit::{B0, B1}}}};
use spl_token_staking::PeriodUnit;

use crate::token_metadata::{Metadata};

declare_id!("Bn6owcizWtLgeKcVyXVgUgTvbLezCVz9Q7oPdZu5bC1H");

#[program]
pub mod spl_wumbo {
    use super::*;

    pub fn initialize_wumbo(
        ctx: Context<InitializeWumbo>,
        args: InitializeWumboArgs,
    ) -> ProgramResult {
        let wumbo = &mut ctx.accounts.wumbo;

        wumbo.mint = ctx.accounts.mint.key();
        wumbo.curve = ctx.accounts.curve.key();
        wumbo.token_metadata_defaults = args.token_metadata_defaults;
        wumbo.token_bonding_defaults = args.token_bonding_defaults;
        wumbo.token_staking_defaults = args.token_staking_defaults;
        wumbo.bump_seed = args.bump_seed;

        Ok(())
    }

    pub fn initialize_social_token_v0(
        ctx: Context<InitializeSocialTokenV0>,
        args: InitializeSocialTokenV0Args,
    ) -> ProgramResult {
        let token_ref = &mut ctx.accounts.token_ref;
        let reverse_token_ref = &mut ctx.accounts.reverse_token_ref;

        let owner = ctx.accounts.owner.key();
        let name = ctx.accounts.name.key();
        let owner_opt = if owner == Pubkey::default() { None } else { Some(owner) };
        let name_opt = if name == Pubkey::default() { None } else { Some(name) };

        token_ref.wumbo = ctx.accounts.wumbo.key();
        token_ref.token_bonding = ctx.accounts.token_bonding.key();
        token_ref.token_staking = ctx.accounts.token_staking.key();
        token_ref.bump_seed = args.token_ref_bump_seed;
        token_ref.owner = owner_opt;
        token_ref.name = name_opt;

        reverse_token_ref.wumbo = ctx.accounts.wumbo.key();
        reverse_token_ref.token_bonding = ctx.accounts.token_bonding.key();
        reverse_token_ref.token_staking = ctx.accounts.token_staking.key();
        reverse_token_ref.bump_seed = args.reverse_token_ref_bump_seed;
        reverse_token_ref.owner = owner_opt;
        reverse_token_ref.name = name_opt;

        Ok(())
    }

    // pub fn update_token_metadata(
    //     ctx: Context<UpdateSocialTokenMetadata>,
    //     args: UpdateSocialTokenMetadataArgs
    // ) -> ProgramResult {
    //     Ok(())
    // }

    // pub fn opt_out_v0() -> ProgramResult {}
    // pub fn opt_in_v0() -> ProgramResult {}
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeWumboArgs {
    pub bump_seed: u8,
    pub token_metadata_defaults: TokenMetadataDefaults,
    pub token_bonding_defaults: TokenBondingDefaults,
    pub token_staking_defaults: TokenStakingDefaults,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenMetadataDefaults {
    pub symbol: String,
    pub arweave_uri: String,
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenBondingDefaults {
    pub curve: Pubkey,
    pub base_royalty_percentage: u32,
    pub target_royalty_percentage: u32,
    pub target_mint_decimals: u8,
    pub buy_frozen: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenStakingDefaults {
    pub period_unit: PeriodUnit,
    pub period: u32,
    pub target_mint_decimals: u8,
    pub reward_percent_per_period_per_lockup_period: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeSocialTokenV0Args {
    pub wumbo_bump_seed: u8,
    pub token_bonding_authority_bump_seed: u8,
    pub token_staking_authority_bump_seed: u8,
    pub token_ref_bump_seed: u8,
    pub reverse_token_ref_bump_seed: u8,
    pub token_metadata_update_authority_bump_seed: u8,
}

#[derive(Accounts)]
#[instruction(args: InitializeWumboArgs)]
pub struct InitializeWumbo<'info> {
    #[account(init, seeds = [b"wumbo", mint.key().as_ref()], payer=payer, bump=args.bump_seed, space=1000)]
    wumbo: Account<'info, Wumbo>,
    #[account(
      constraint = *mint.to_account_info().owner == spl_token::id()
    )]
    mint: Account<'info, Mint>,
    #[account(constraint = curve.key() == args.token_bonding_defaults.curve)]
    curve: Account<'info, CurveV0>,

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

fn verify_name(name: &AccountInfo, expected: &String) -> Result<bool> {
  let mut hasher = Sha256::default();
  hasher.update(expected.as_bytes());
  let data = hasher.finalize();
  let name_header = NameRecordHeader::unpack_from_slice(name.try_borrow_data()?.as_ref())?;

  let (address, _) = Pubkey::find_program_address(&[
    data.as_ref(),
    name_header.class.as_ref(),
    name_header.parent_name.as_ref()
  ], &spl_name_service::ID);

  Ok(*name.key == address)
}

#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]
pub struct InitializeSocialTokenV0<'info> {
    #[account(seeds = [b"wumbo", wumbo.mint.as_ref()], bump = wumbo.bump_seed)]
    wumbo: Box<Account<'info, Wumbo>>,
    #[account(
      has_one = target_mint,
      constraint = verify_authority(token_bonding.authority, &[b"token-bonding-authority", token_ref.key().as_ref()], args.token_bonding_authority_bump_seed)?,
      constraint = token_bonding.curve == wumbo.token_bonding_defaults.curve && 
                    token_bonding.base_royalty_percentage == wumbo.token_bonding_defaults.base_royalty_percentage &&
                    token_bonding.target_royalty_percentage == wumbo.token_bonding_defaults.target_royalty_percentage &&
                    token_bonding.buy_frozen == wumbo.token_bonding_defaults.buy_frozen
    )]
    token_bonding: Box<Account<'info, TokenBondingV0>>,
    // Bonding base mint
    #[account(
      constraint = target_mint.decimals == wumbo.token_bonding_defaults.target_mint_decimals
    )]
    target_mint: Box<Account<'info, Mint>>,
    #[account(
      constraint = token_staking.target_mint == staking_target_mint.key(),
      has_one = target_mint,
      constraint = verify_authority(token_staking.authority, &[b"token-staking-authority", token_ref.key().as_ref()], args.token_staking_authority_bump_seed)?,
      constraint = token_staking.base_mint == token_bonding.base_mint,
      constraint = token_staking.period_unit == wumbo.token_staking_defaults.period_unit &&
                   token_staking.reward_percent_per_period_per_lockup_period == wumbo.token_staking_defaults.reward_percent_per_period_per_lockup_period &&
                   token_staking.period == wumbo.token_staking_defaults.period
                   
    )]
    token_staking: Box<Account<'info, TokenStakingV0>>,
    // Staking target mint (cred)
    #[account(
      constraint = staking_target_mint.decimals == wumbo.token_staking_defaults.target_mint_decimals
    )]
    staking_target_mint: Box<Account<'info, Mint>>,
    #[account(
      has_one = token_staking,
      constraint = token_account_split.token_account == token_bonding.base_royalties,
      constraint = token_account_split.token_staking == token_staking.key(),
    )]
    token_account_split: Box<Account<'info, TokenAccountSplitV0>>,
    #[account(
        init,
        seeds = [
            b"token-ref",
            wumbo.key().as_ref(),
            (if name.key() == Pubkey::default() { owner.key() } else { name.key() }).as_ref()
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
            wumbo.key().as_ref(),
            token_bonding.target_mint.as_ref()
        ],
        bump = args.reverse_token_ref_bump_seed,
        payer = payer,
        space = 512
    )]
    reverse_token_ref: Box<Account<'info, TokenRefV0>>,
    #[account(
      // Deserialize name account checked in token metadata constraint
      constraint = (*name.to_account_info().owner == spl_name_service::ID) || 
                  name.key() == Pubkey::default(),
    )]
    name: AccountInfo<'info>,
    // if creating a claimed token just need the owner.
    #[account(
        constraint = owner.is_signer || owner.key() == Pubkey::default(),
    )]
    owner: AccountInfo<'info>,

    #[account(
      constraint = name.key() == Pubkey::default() || (
        verify_name(&name, &token_metadata.data.name)? &&
        token_metadata.data.uri == wumbo.token_metadata_defaults.symbol &&
        token_metadata.data.uri == wumbo.token_metadata_defaults.arweave_uri &&
        token_metadata.data.creators.is_none() &&
        token_metadata.data.seller_fee_basis_points == 0
      ),
      constraint = verify_authority(Some(token_metadata.update_authority), &[b"token-metadata-authority", wumbo.key().as_ref()], args.token_metadata_update_authority_bump_seed)?,
      constraint = token_metadata.is_mutable,
    )]
    token_metadata: Box<Account<'info, Metadata>>,

    #[account(mut, signer)]
    payer: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    system_program: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(Default)]
pub struct Wumbo {
    pub mint: Pubkey,
    pub curve: Pubkey,
    pub token_metadata_defaults: TokenMetadataDefaults,
    pub token_bonding_defaults: TokenBondingDefaults,
    pub token_staking_defaults: TokenStakingDefaults,

    pub bump_seed: u8,
}

#[account]
#[derive(Default)]
pub struct TokenRefV0 {
    pub wumbo: Pubkey,
    pub token_bonding: Pubkey,
    pub token_staking: Pubkey,
    pub name: Option<Pubkey>,
    pub owner: Option<Pubkey>,
    pub is_claimed: bool,

    pub bump_seed: u8,
}


// // Unfortunate duplication so that IDL picks it up.
// #[repr(C)]
// #[derive(BorshSerialize, BorshDeserialize, PartialEq, Debug, Clone)]
// pub enum PeriodUnit {
//     SECOND,
//     MINUTE,
//     HOUR,
//     DAY,
//     YEAR,
// }

// impl Default for PeriodUnit {
//     fn default() -> Self {
//         PeriodUnit::HOUR
//     }
// }

#[error]
pub enum ErrorCode {
    #[msg("Invalid token ref prefix")]
    InvalidTokenRefPrefix,

    #[msg("Invalid token ref seed")]
    InvalidTokenRefSeed,

    #[msg("Provided account does not have an authority")]
    NoAuthority,

    #[msg("Token bonding does not have an authority")]
    NoStakingAuthority,

    #[msg("Name program id did not match expected for this wumbo instance")]
    InvalidNameProgramId,

    #[msg("Account does not have correct owner!")]
    IncorrectOwner,

    #[msg("The bump provided did not match the canonical bump")]
    InvalidBump,

    #[msg("Invalid authority passed")]
    InvalidAuthority,

    #[msg("The provided name owner is not the owner of the name record")]
    InvalidNameOwner
}
