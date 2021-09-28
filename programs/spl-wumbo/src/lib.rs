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
  token_ref.wumbo = accounts.wumbo.key();
  token_ref.token_bonding = accounts.token_bonding.key();
  token_ref.mint = accounts.target_mint.key();
  token_ref.bump_seed = args.token_ref_bump_seed;
  token_ref.token_metadata_update_authority_bump_seed = args.token_metadata_update_authority_bump_seed;
  token_ref.token_bonding_authority_bump_seed = args.token_bonding_authority_bump_seed;
  token_ref.target_royalties_owner_bump_seed = args.target_royalties_owner_bump_seed;
  token_ref.token_metadata = accounts.token_metadata.key();

  reverse_token_ref.wumbo = accounts.wumbo.key();
  reverse_token_ref.token_bonding = accounts.token_bonding.key();
  reverse_token_ref.bump_seed = args.reverse_token_ref_bump_seed;
  reverse_token_ref.mint = accounts.target_mint.key();

  reverse_token_ref.token_metadata_update_authority_bump_seed = args.token_metadata_update_authority_bump_seed;
  reverse_token_ref.token_bonding_authority_bump_seed = args.token_bonding_authority_bump_seed;
  reverse_token_ref.target_royalties_owner_bump_seed = args.target_royalties_owner_bump_seed;
  reverse_token_ref.token_metadata = accounts.token_metadata.key();

  Ok(())
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
        wumbo.authority = args.authority;
        wumbo.token_metadata_defaults = args.token_metadata_defaults;
        wumbo.token_bonding_defaults = args.token_bonding_defaults;
        wumbo.token_staking_defaults = args.token_staking_defaults;
        wumbo.bump_seed = args.bump_seed;

        Ok(())
    }

    pub fn initialize_owned_social_token_v0(
      ctx: Context<InitializeOwnedSocialTokenV0>,
      args: InitializeSocialTokenV0Args,
    ) -> ProgramResult {
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
      initialize_social_token_v0(&mut ctx.accounts.initialize_args, &mut ctx.accounts.token_ref,&mut ctx.accounts.reverse_token_ref, args)?;
      let token_ref = &mut ctx.accounts.token_ref;
      let reverse_token_ref = &mut ctx.accounts.reverse_token_ref;

      token_ref.name = Some(ctx.accounts.name.key());
      reverse_token_ref.name = Some(ctx.accounts.name.key());
      reverse_token_ref.is_claimed = false;
      token_ref.is_claimed = false;

      Ok(())
    }

    pub fn claim_social_token_v0(
      ctx: Context<ClaimSocialTokenV0>,
      token_ref_bump_seed: u8
    ) -> ProgramResult {
      let token_program = ctx.accounts.token_program.to_account_info();
      let original_target_royalties = ctx.accounts.target_royalties.to_account_info();
      let new_target_royalties = ctx.accounts.new_target_royalties.to_account_info();
      let target_royalties_owner = ctx.accounts.target_royalties_owner.to_account_info();
      let token_ref = &mut ctx.accounts.token_ref;
      let new_token_ref = &mut ctx.accounts.new_token_ref;
      let reverse_token_ref = &mut ctx.accounts.reverse_token_ref;
      let token_bonding_program = ctx.accounts.token_bonding_program.to_account_info();
      let token_bonding = &mut ctx.accounts.token_bonding;

      new_token_ref.wumbo = token_ref.wumbo;
      new_token_ref.token_bonding = token_ref.token_bonding;
      new_token_ref.bump_seed = token_ref_bump_seed;
      new_token_ref.token_metadata_update_authority_bump_seed = token_ref.token_metadata_update_authority_bump_seed;
      new_token_ref.token_bonding_authority_bump_seed = token_ref.token_bonding_authority_bump_seed;
      new_token_ref.target_royalties_owner_bump_seed = token_ref.target_royalties_owner_bump_seed;
      new_token_ref.token_metadata = token_ref.token_metadata;
      new_token_ref.token_staking = token_ref.token_staking;
      new_token_ref.owner = Some(ctx.accounts.owner.key());
      new_token_ref.mint = token_ref.mint;

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
              &[b"target-royalties-owner", reverse_token_ref.key().as_ref(), &[token_ref.target_royalties_owner_bump_seed]]
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
          &[b"target-royalties-owner", reverse_token_ref.key().as_ref(), &[token_ref.target_royalties_owner_bump_seed]]
        ]
      ))?;

      msg!("Changing royalties on bonding curve");
      spl_token_bonding::cpi::update_token_bonding_v0(CpiContext::new_with_signer(token_bonding_program.clone(), UpdateTokenBondingV0 {
        token_bonding: token_bonding.clone(),
        authority: ctx.accounts.token_bonding_authority.to_account_info().clone(),
      }, &[
        &[b"token-bonding-authority", reverse_token_ref.key().as_ref(), &[token_ref.token_bonding_authority_bump_seed]]
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
      new_token_ref.is_claimed = true;
      reverse_token_ref.is_claimed = true;
      
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
          &[b"token-metadata-authority", accounts.reverse_token_ref.key().as_ref(), &[accounts.reverse_token_ref.token_metadata_update_authority_bump_seed]]
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
    pub authority: Option<Pubkey>,
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
  pub name_parent: Option<Pubkey>,
  pub name_class: Option<Pubkey>,
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
    #[account(init, seeds = [
      b"wumbo", 
      mint.key().as_ref()], 
      payer=payer,
      bump=args.bump_seed, 
      space=512
    )]
    wumbo: Account<'info, WumboV0>,
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

#[derive(Accounts)]
pub struct InitializeSocialTokenV0<'info> {
    #[account(mut, signer)]
    payer: AccountInfo<'info>,
    #[account(seeds = [b"wumbo", wumbo.mint.as_ref()], bump = wumbo.bump_seed)]
    wumbo: Box<Account<'info, WumboV0>>,
    #[account(
      has_one = target_mint,
      has_one = base_royalties,
      has_one = target_royalties,
      constraint = token_bonding.curve == wumbo.token_bonding_defaults.curve && 
                    token_bonding.base_royalty_percentage == wumbo.token_bonding_defaults.base_royalty_percentage &&
                    token_bonding.target_royalty_percentage == wumbo.token_bonding_defaults.target_royalty_percentage &&
                    token_bonding.buy_frozen == wumbo.token_bonding_defaults.buy_frozen &&
                    token_bonding.go_live_unix_time <= clock.unix_timestamp &&
                    token_bonding.base_mint == wumbo.mint &&
                    token_bonding.purchase_cap.is_none() &&
                    token_bonding.mint_cap.is_none()
    )]
    token_bonding: Box<Account<'info, TokenBondingV0>>,
    #[account()]
    base_royalties: Box<Account<'info, TokenAccount>>,

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
      constraint = (
        token_metadata.data.creators.is_none() &&
        token_metadata.data.seller_fee_basis_points == 0
      ),
      constraint = token_metadata.is_mutable,
    )]
    token_metadata: Box<Account<'info, Metadata>>,
    #[account(address = system_program::ID)]
    system_program: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
    clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]

pub struct InitializeOwnedSocialTokenV0<'info> {
  initialize_args: InitializeSocialTokenV0<'info>,
  #[account(mut, signer)]
  payer: AccountInfo<'info>,
  #[account(
    init,
    seeds = [
        b"token-ref",
        initialize_args.wumbo.key().as_ref(),
        owner.key().as_ref()
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
        initialize_args.wumbo.key().as_ref(),
        initialize_args.token_bonding.target_mint.as_ref()
    ],
    bump = args.reverse_token_ref_bump_seed,
    payer = payer,
    space = 512,
    constraint = verify_authority(Some(initialize_args.base_royalties.owner), &[b"base-royalties-owner", reverse_token_ref.key().as_ref()], args.base_royalties_owner_bump_seed)?,
    constraint = verify_authority(initialize_args.token_bonding.authority, &[b"token-bonding-authority", reverse_token_ref.key().as_ref()], args.token_bonding_authority_bump_seed)?,
    constraint = verify_authority(Some(initialize_args.token_metadata.update_authority), &[b"token-metadata-authority", reverse_token_ref.key().as_ref()], args.token_metadata_update_authority_bump_seed)?,
  )]
  reverse_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    signer,
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
  #[account(mut, signer)]
  payer: AccountInfo<'info>,
  #[account(
    init,
    seeds = [
        b"token-ref",
        initialize_args.wumbo.key().as_ref(),
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
        initialize_args.wumbo.key().as_ref(),
        initialize_args.token_bonding.target_mint.as_ref()
    ],
    bump = args.reverse_token_ref_bump_seed,
    payer = payer,
    space = 512,
    constraint = verify_authority(Some(initialize_args.base_royalties.owner), &[b"base-royalties-owner", reverse_token_ref.key().as_ref()], args.base_royalties_owner_bump_seed)?,
    constraint = verify_authority(initialize_args.token_bonding.authority, &[b"token-bonding-authority", reverse_token_ref.key().as_ref()], args.token_bonding_authority_bump_seed)?,
    constraint = verify_authority(Some(initialize_args.token_metadata.update_authority), &[b"token-metadata-authority", reverse_token_ref.key().as_ref()], args.token_metadata_update_authority_bump_seed)?,
    constraint = verify_authority(Some(initialize_args.target_royalties.owner), &[b"target-royalties-owner", reverse_token_ref.key().as_ref()], args.target_royalties_owner_bump_seed)?,
  )]
  reverse_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    // Deserialize name account checked in token metadata constraint
    constraint = *name.to_account_info().owner == system_program::ID || *name.to_account_info().owner == spl_name_service::ID,
    constraint = verify_name(&name, args.name_class, args.name_parent, &str::replace(&initialize_args.token_metadata.data.name, "\u{0000}", ""))?,
    constraint = str::replace(&initialize_args.token_metadata.data.symbol, "\u{0000}", "") == initialize_args.wumbo.token_metadata_defaults.symbol &&
                 str::replace(&initialize_args.token_metadata.data.uri, "\u{0000}", "") == initialize_args.wumbo.token_metadata_defaults.uri
  )]
  name: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  system_program: AccountInfo<'info>,
  rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(token_ref_bump_seed: u8)]
pub struct ClaimSocialTokenV0<'info> {
  wumbo: Box<Account<'info, WumboV0>>,
  #[account(
    mut,
    has_one = wumbo,
    has_one = token_bonding,
    seeds = [
        b"token-ref",
        wumbo.key().as_ref(),
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
        wumbo.key().as_ref(),
        owner.key().as_ref()
    ],
    bump = token_ref_bump_seed,
    payer = owner,
    space = 512,
  )]
  new_token_ref: Box<Account<'info, TokenRefV0>>,
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
      b"token-bonding-authority", reverse_token_ref.key().as_ref()
    ],
    bump = token_ref.token_bonding_authority_bump_seed
  )]
  token_bonding_authority: AccountInfo<'info>,
  #[account(
    seeds =  [b"target-royalties-owner", reverse_token_ref.key().as_ref()],
    bump = token_ref.target_royalties_owner_bump_seed
  )]
  target_royalties_owner: AccountInfo<'info>,
  #[account()]
  name: Box<Account<'info, NameRecordHeader>>,
  #[account(
    signer,
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
  pub token_bonding_program: AccountInfo<'info>,

  #[account(address = system_program::ID)]
  system_program: AccountInfo<'info>,
  rent: Sysvar<'info, Rent>,
}


#[derive(Accounts)]
#[instruction(args: UpdateMetadataAccountArgs)]
pub struct UpdateTokenMetadataV0<'info> {
    #[account(
      has_one = token_metadata,
      constraint = reverse_token_ref.owner.unwrap() == owner.key(),
    )]
    pub reverse_token_ref: Account<'info, TokenRefV0>,
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
pub struct WumboV0 {
    pub mint: Pubkey,
    pub curve: Pubkey,
    pub authority: Option<Pubkey>,
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
    pub mint: Pubkey,
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
