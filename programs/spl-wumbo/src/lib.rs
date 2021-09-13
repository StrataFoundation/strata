use {
    anchor_lang::solana_program::program_pack::Pack,
    anchor_lang::{prelude::*, solana_program::system_program},
    anchor_spl::token::{Mint, TokenAccount},
    borsh::{BorshDeserialize, BorshSerialize},
    spl_token_bonding::{CurveV0, TokenBondingV0},
};

pub mod token_metadata;
pub mod name;

use anchor_lang::solana_program::{self, hash::hashv, stake::state::Meta};
use token_metadata::UpdateMetadataAccount;

use crate::token_metadata::{Metadata, UpdateMetadataAccountArgs};
use crate::name::{NameRecordHeader};

declare_id!("Bn6owcizWtLgeKcVyXVgUgTvbLezCVz9Q7oPdZu5bC1H");

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

#[program]
pub mod spl_wumbo {
    use anchor_spl::token::{self, Transfer};
    use spl_token_bonding::{UpdateTokenBondingV0, UpdateTokenBondingV0Args};

    use crate::token_metadata::update_metadata_account;

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
        token_ref.bump_seed = args.token_ref_bump_seed;
        token_ref.owner = owner_opt;
        token_ref.name = name_opt;
        token_ref.is_claimed = owner_opt.is_some();
        token_ref.token_metadata_update_authority_bump_seed = args.token_metadata_update_authority_bump_seed;
        token_ref.token_bonding_authority_bump_seed = args.token_bonding_authority_bump_seed;
        token_ref.target_royalties_owner_bump_seed = args.target_royalties_owner_bump_seed;
        token_ref.token_metadata = ctx.accounts.token_metadata.key();

        reverse_token_ref.wumbo = ctx.accounts.wumbo.key();
        reverse_token_ref.token_bonding = ctx.accounts.token_bonding.key();
        reverse_token_ref.bump_seed = args.reverse_token_ref_bump_seed;
        reverse_token_ref.owner = owner_opt;
        reverse_token_ref.name = name_opt;
        reverse_token_ref.is_claimed = owner_opt.is_some();
        reverse_token_ref.token_metadata_update_authority_bump_seed = args.token_metadata_update_authority_bump_seed;
        reverse_token_ref.token_bonding_authority_bump_seed = args.token_bonding_authority_bump_seed;
        reverse_token_ref.target_royalties_owner_bump_seed = args.target_royalties_owner_bump_seed;
        reverse_token_ref.token_metadata = ctx.accounts.token_metadata.key();

        Ok(())
    }

    pub fn claim_social_token_v0(
      ctx: Context<ClaimSocialTokenV0>
    ) -> ProgramResult {
      let token_program = ctx.accounts.token_program.to_account_info();
      let original_target_royalties = ctx.accounts.target_royalties.to_account_info();
      let new_target_royalties = ctx.accounts.new_target_royalties.to_account_info();
      let target_royalties_owner = ctx.accounts.target_royalties_owner.to_account_info();
      let token_ref = &mut ctx.accounts.token_ref;
      let reverse_token_ref = &mut ctx.accounts.reverse_token_ref;
      let token_bonding_program = ctx.accounts.token_bonding_program.to_account_info();
      let token_bonding = &mut ctx.accounts.token_bonding;

      msg!("Closing standin royalties account");
      token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.clone(),
            Transfer {
              from: original_target_royalties.clone(),
              to: new_target_royalties.clone(),
              authority: target_royalties_owner.clone()
            },
            &[
              &[b"target-royalties-owner", token_ref.key().as_ref(), &[token_ref.target_royalties_owner_bump_seed]]
            ]
        ),
        ctx.accounts.target_royalties.amount
      )?;
      close_token_account(CpiContext::new_with_signer(
        token_program.clone(), 
CloseTokenAccount {
          from: original_target_royalties.clone(),
          to: ctx.accounts.owner.clone(),
          authority: target_royalties_owner.clone()
        },
        &[
          &[b"target-royalties-owner", token_ref.key().as_ref(), &[token_ref.target_royalties_owner_bump_seed]]
        ]
      ))?;

      msg!("Changing royalties on bonding curve");
      spl_token_bonding::cpi::update_token_bonding_v0(CpiContext::new_with_signer(token_bonding_program.clone(), UpdateTokenBondingV0 {
        token_bonding: token_bonding.clone(),
        authority: ctx.accounts.token_bonding_authority.to_account_info().clone(),
      }, &[
        &[b"token-bonding-authority", token_ref.key().as_ref(), &[token_ref.token_bonding_authority_bump_seed]]
      ]), UpdateTokenBondingV0Args {
        token_bonding_authority: token_bonding.authority,
        base_royalty_percentage: token_bonding.base_royalty_percentage,
        target_royalty_percentage: token_bonding.target_royalty_percentage,
        buy_frozen: token_bonding.buy_frozen,
        base_royalties: token_bonding.base_royalties,
        target_royalties: new_target_royalties.key(),
      })?;

      token_ref.owner = Some(ctx.accounts.owner.key());
      token_ref.name = None;
      reverse_token_ref.owner = Some(ctx.accounts.owner.key());
      reverse_token_ref.name = None;

      Ok(())
    }

    pub fn update_token_metadata(
        ctx: Context<UpdateTokenMetadataV0>,
        args: UpdateMetadataAccountArgs
    ) -> ProgramResult {
      let accounts = ctx.accounts;
      let cpi_accounts = UpdateMetadataAccount {
        token_metadata: accounts.token_metadata.clone(),
        update_authority: accounts.update_authority.clone()
      };
      let cpi_program = accounts.token_metadata_program.clone();
      update_metadata_account(
        CpiContext::new_with_signer(
          cpi_program,
          cpi_accounts, 
  &[
          &[b"token-metadata-authority", accounts.token_ref.key().as_ref(), &[accounts.token_ref.token_metadata_update_authority_bump_seed]]
          ]
        ), 
        args
      )
    }

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
    pub uri: String,
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
    pub target_royalties_owner_bump_seed: u8,
    pub base_royalties_owner_bump_seed: u8,
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
  let name_header = spl_name_service::state::NameRecordHeader::unpack_from_slice(name.try_borrow_data()?.as_ref())?;
  let hashed_name: Vec<u8> = hashv(&[("SPL Name Service".to_owned() + expected).as_bytes()]).0.to_vec();

  let (address, _) = spl_name_service::state::get_seeds_and_key(
    &spl_name_service::ID,
    hashed_name,
    Some(&name_header.class),
    Some(&name_header.parent_name),
  );

  Ok(*name.key == address)
}

#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]
pub struct InitializeSocialTokenV0<'info> {
    #[account(seeds = [b"wumbo", wumbo.mint.as_ref()], bump = wumbo.bump_seed)]
    wumbo: Box<Account<'info, Wumbo>>,
    #[account(
      has_one = target_mint,
      has_one = base_royalties,
      has_one = target_royalties,
      constraint = verify_authority(token_bonding.authority, &[b"token-bonding-authority", token_ref.key().as_ref()], args.token_bonding_authority_bump_seed)?,
      constraint = token_bonding.curve == wumbo.token_bonding_defaults.curve && 
                    token_bonding.base_royalty_percentage == wumbo.token_bonding_defaults.base_royalty_percentage &&
                    token_bonding.target_royalty_percentage == wumbo.token_bonding_defaults.target_royalty_percentage &&
                    token_bonding.buy_frozen == wumbo.token_bonding_defaults.buy_frozen &&
                    token_bonding.go_live_unix_time <= clock.unix_timestamp &&
                    token_bonding.base_mint == wumbo.mint
    )]
    token_bonding: Box<Account<'info, TokenBondingV0>>,
    #[account(
      constraint =  verify_authority(Some(base_royalties.owner), &[b"base-royalties-owner", token_ref.key().as_ref()], args.base_royalties_owner_bump_seed)?,
    )]
    base_royalties: Box<Account<'info, TokenAccount>>,
    #[account(
      constraint = owner.is_signer || verify_authority(Some(target_royalties.owner), &[b"target-royalties-owner", token_ref.key().as_ref()], args.target_royalties_owner_bump_seed)?,
    )]
    target_royalties: Box<Account<'info, TokenAccount>>,
    // Bonding target mint
    #[account(
      constraint = target_mint.decimals == wumbo.token_bonding_defaults.target_mint_decimals
    )]
    target_mint: Box<Account<'info, Mint>>,
    /* SAVE FOR LATER, will be a separate contract call */
    // #[account(
    //   constraint = token_staking.target_mint == staking_target_mint.key(),
    //   has_one = target_mint,
    //   constraint = verify_authority(token_staking.authority, &[b"token-staking-authority", token_ref.key().as_ref()], args.token_staking_authority_bump_seed)?,
    //   constraint = token_staking.base_mint == token_bonding.base_mint,
    //   constraint = token_staking.period_unit == spl_token_staking::PeriodUnit::from(wumbo.token_staking_defaults.period_unit) &&
    //                token_staking.reward_percent_per_period_per_lockup_period == wumbo.token_staking_defaults.reward_percent_per_period_per_lockup_period &&
    //                token_staking.period == wumbo.token_staking_defaults.period
                   
    // )]
    // token_staking: Box<Account<'info, TokenStakingV0>>,
    // Staking target mint (cred)
    // #[account(
    //   constraint = staking_target_mint.decimals == wumbo.token_staking_defaults.target_mint_decimals
    // )]
    // staking_target_mint: Box<Account<'info, Mint>>,
    // #[account(
    //   has_one = token_staking,
    //   constraint = token_account_split.token_account == token_bonding.base_royalties,
    //   constraint = token_account_split.token_staking == token_staking.key(),
    // )]
    // token_account_split: Box<Account<'info, TokenAccountSplitV0>>,
    #[account(
        init,
        seeds = [
            b"token-ref",
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
        // One of name or owner must be provided, but not both
        constraint = owner.key() == Pubkey::default() || name.key() == Pubkey::default()
    )]
    owner: AccountInfo<'info>,

    #[account(
      constraint = name.key() == Pubkey::default() || (
        verify_name(&name, &str::replace(&token_metadata.data.name, "\u{0000}", ""))? &&
        str::replace(&token_metadata.data.symbol, "\u{0000}", "") == wumbo.token_metadata_defaults.symbol &&
        str::replace(&token_metadata.data.uri, "\u{0000}", "") == wumbo.token_metadata_defaults.uri &&
        token_metadata.data.creators.is_none() &&
        token_metadata.data.seller_fee_basis_points == 0
      ),
      constraint = verify_authority(Some(token_metadata.update_authority), &[b"token-metadata-authority", token_ref.key().as_ref()], args.token_metadata_update_authority_bump_seed)?,
      constraint = token_metadata.is_mutable,
    )]
    token_metadata: Box<Account<'info, Metadata>>,

    #[account(mut, signer)]
    payer: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    system_program: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
    clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct ClaimSocialTokenV0<'info> {
  wumbo: Box<Account<'info, Wumbo>>,
  #[account(
    mut,
    has_one = wumbo,
    has_one = token_bonding,
    seeds = [
        b"token-ref",
        name.key().as_ref()
    ],
    bump = token_ref.bump_seed,
  )]
  token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    has_one = wumbo,
    has_one = token_bonding,
    seeds = [
        b"reverse-token-ref",
        wumbo.key().as_ref(),
        token_bonding.target_mint.as_ref()
    ],
    bump = reverse_token_ref.bump_seed,
  )]
  reverse_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    has_one = target_royalties
  )]
  token_bonding: Account<'info, TokenBondingV0>,
  #[account(
    seeds = [
      b"token-bonding-authority", token_ref.key().as_ref()
    ],
    bump = token_ref.token_bonding_authority_bump_seed
  )]
  token_bonding_authority: AccountInfo<'info>,
  #[account(
    seeds =  [b"target-royalties-owner", token_ref.key().as_ref()],
    bump = token_ref.target_royalties_owner_bump_seed
  )]
  target_royalties_owner: AccountInfo<'info>,
  #[account()]
  name: Box<Account<'info, NameRecordHeader>>,
  #[account(
    signer,
    // One of name or owner must be provided, but not both
    // constraint = owner.key() == name.owner
  )]
  owner: AccountInfo<'info>,

  #[account(
    mut,
    constraint = new_target_royalties.owner == owner.key(),
    constraint = new_target_royalties.mint == target_royalties.mint,
    // Ensure it's an associated token account.
    constraint = new_target_royalties.key() == Pubkey::find_program_address(
      &[
        owner.key().as_ref(),
        spl_token::ID.as_ref(),
        new_target_royalties.mint.as_ref(),
      ],
      &spl_associated_token_account::ID
    ).0
  )]
  new_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    mut
  )]
  target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(address = spl_token::ID)]
  pub token_program: AccountInfo<'info>,

  #[account(address = spl_token_bonding::id())]
  pub token_bonding_program: AccountInfo<'info>
}

#[derive(Accounts)]
#[instruction(args: UpdateMetadataAccountArgs)]
pub struct UpdateTokenMetadataV0<'info> {
    #[account(
      has_one = token_metadata,
      constraint = token_ref.owner.unwrap() == owner.key(),
    )]
    pub token_ref: Account<'info, TokenRefV0>,
    #[account(signer)]
    pub owner: AccountInfo<'info>,
    #[account(mut)]
    pub token_metadata: AccountInfo<'info>,
    #[account()]
    pub update_authority: AccountInfo<'info>,
    #[account(address = spl_token_metadata::ID)]
    pub token_metadata_program: AccountInfo<'info>
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
    pub token_metadata: Pubkey,
    pub token_bonding: Pubkey,
    pub token_staking: Option<Pubkey>,
    pub name: Option<Pubkey>,
    pub owner: Option<Pubkey>,
    pub is_claimed: bool,

    pub bump_seed: u8,
    pub token_bonding_authority_bump_seed: u8,
    pub target_royalties_owner_bump_seed: u8,
    pub token_metadata_update_authority_bump_seed: u8,
    pub staking_authority_bump_seed: Option<u8>,
}

// // Unfortunate duplication so that IDL picks it up.
#[repr(C)]
#[derive(Copy)]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Debug, Clone)]
pub enum PeriodUnit {
    SECOND,
    MINUTE,
    HOUR,
    DAY,
    YEAR,
}

impl From<PeriodUnit> for spl_token_staking::PeriodUnit {
    fn from(unit: PeriodUnit) -> Self {
      match unit {
        PeriodUnit::SECOND => spl_token_staking::PeriodUnit::SECOND,
        PeriodUnit::MINUTE => spl_token_staking::PeriodUnit::MINUTE,
        PeriodUnit::HOUR => spl_token_staking::PeriodUnit::HOUR,
        PeriodUnit::DAY => spl_token_staking::PeriodUnit::DAY,
        PeriodUnit::YEAR => spl_token_staking::PeriodUnit::YEAR,
      }
    }
}

impl Default for PeriodUnit {
    fn default() -> Self {
        PeriodUnit::HOUR
    }
}

#[error]
pub enum ErrorCode {
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
