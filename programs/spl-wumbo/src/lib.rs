use {
    anchor_lang::{prelude::*, solana_program::system_program},
    anchor_spl::token::{Mint, TokenAccount},
    borsh::{BorshDeserialize, BorshSerialize},
    spl_token_bonding::{CurveV0, TokenBondingV0},
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
pub mod spl_wumbo {

    use crate::token_metadata::update_metadata_account;

    use super::*;

    pub fn initialize_collective_v0(
        ctx: Context<InitializeCollectiveV0>,
        args: InitializeCollectiveArgs,
    ) -> ProgramResult {
        let collective = &mut ctx.accounts.collective;

        collective.mint = ctx.accounts.mint.key();
        collective.is_open = args.is_open;
        collective.authority = args.authority;
        collective.bump_seed = args.bump_seed;

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
          buy_base_royalties: ctx.accounts.buy_base_royalties.to_account_info().clone(),
          buy_target_royalties: ctx.accounts.buy_target_royalties.to_account_info().clone(),
          sell_base_royalties: ctx.accounts.sell_base_royalties.to_account_info().clone(),
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
        buy_base_royalty_percentage: token_bonding.buy_base_royalty_percentage,
        buy_target_royalty_percentage: token_bonding.buy_target_royalty_percentage,
        sell_base_royalty_percentage: token_bonding.sell_base_royalty_percentage,
        sell_target_royalty_percentage: token_bonding.sell_target_royalty_percentage,
        buy_frozen: token_bonding.buy_frozen,
      })?;

      Ok(())
    }
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct ClaimSocialTokenV0Args {
  pub token_ref_bump_seed: u8,
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeCollectiveArgs {
    pub bump_seed: u8,
    pub authority: Option<Pubkey>,
    pub is_open: bool
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
#[instruction(args: InitializeCollectiveArgs)]
pub struct InitializeCollectiveV0<'info> {
    #[account(init, seeds = [
      b"collective", 
      mint.key().as_ref()], 
      payer=payer,
      bump=args.bump_seed, 
      space=512
    )]
    collective: Account<'info, CollectiveV0>,
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

#[derive(Accounts)]
pub struct InitializeSocialTokenV0<'info> {
    #[account(mut, signer)]
    payer: AccountInfo<'info>,
    #[account(seeds = [b"collective", collective.mint.as_ref()], bump = collective.bump_seed)]
    collective: Box<Account<'info, CollectiveV0>>,
    #[account(
      constraint = token_bonding.base_mint.key() == collective.mint.key()
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
    constraint = initialize_args.collective.is_open || authority.is_signer
  )]
  authority: AccountInfo<'info>,
  #[account(mut, signer)]
  payer: AccountInfo<'info>,
  #[account(
    init,
    seeds = [
        b"token-ref",
        initialize_args.collective.key().as_ref(),
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
        initialize_args.collective.key().as_ref(),
        initialize_args.token_bonding.target_mint.as_ref()
    ],
    bump = args.reverse_token_ref_bump_seed,
    payer = payer,
    space = 512,
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
    // Deserialize name account checked in token metadata constraint
    constraint = (*name.to_account_info().owner == system_program::ID && **name.try_borrow_lamports()? == 0_u64) || *name.to_account_info().owner == spl_name_service::ID
  )]
  name: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  system_program: AccountInfo<'info>,
  rent: Sysvar<'info, Rent>,
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
    constraint = token_bonding.authority.unwrap() == token_bonding_authority.key()
  )]
  token_bonding: Account<'info, TokenBondingV0>,
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
    signer,
  )]
  owner: AccountInfo<'info>,

  base_mint: Box<Account<'info, Mint>>,
  target_mint: Box<Account<'info, Mint>>,
  buy_base_royalties: Box<Account<'info, TokenAccount>>,
  buy_target_royalties: Box<Account<'info, TokenAccount>>,
  sell_base_royalties: Box<Account<'info, TokenAccount>>,
  sell_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(address = spl_token_bonding::id())]
  token_bonding_program: AccountInfo<'info>,
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
    pub is_open: bool,
    pub authority: Option<Pubkey>,
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
    InvalidAuthority
}

    use spl_token_bonding::UpdateTokenBondingV0Args;

