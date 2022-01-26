#![allow(clippy::or_fun_call)]

use crate::arg::*;
use crate::error::*;
use crate::name::NameRecordHeader;
use crate::state::*;
use crate::util::*;
use crate::{token_metadata, token_metadata::Metadata};
use anchor_lang::{prelude::*, solana_program, solana_program::system_program};
use anchor_spl::token::{Mint, Token, TokenAccount};
use spl_token_bonding::state::TokenBondingV0;

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

#[derive(Accounts)]
#[instruction(args: InitializeCollectiveV0Args)]
pub struct InitializeCollectiveV0<'info> {
  #[account(init, seeds = [
    b"collective", 
    mint.key().as_ref()],
    payer=payer,
    bump=args.bump_seed,
    space=312
  )]
  pub collective: Box<Account<'info, CollectiveV0>>,
  #[account(
    constraint = mint.mint_authority.unwrap() == mint_authority.key()
  )]
  pub mint: Box<Account<'info, Mint>>,
  #[account(signer)]
  pub mint_authority: AccountInfo<'info>,

  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: UpdateCollectiveV0Args)]
pub struct UpdateCollectiveV0<'info> {
  #[account(
    mut,
    constraint = authority.key() == collective.authority.ok_or::<ProgramError>(ErrorCode::InvalidAuthority.into())?
  )]
  pub collective: Box<Account<'info, CollectiveV0>>,
  pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeSocialTokenV0<'info> {
  pub authority: UncheckedAccount<'info>,
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    seeds = [
      b"collective", 
      base_mint.key().as_ref()
   ],
    bump
  )]
  pub collective: UncheckedAccount<'info>,
  #[account(
    has_one = base_mint,
    has_one = target_mint,
    has_one = buy_base_royalties,
    has_one = buy_target_royalties,
    has_one = sell_base_royalties,
    has_one = sell_target_royalties,
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(
    constraint = (
      token_metadata.data.creators.is_none() &&
      token_metadata.data.seller_fee_basis_points == 0
    ),
    constraint = token_metadata.is_mutable,
  )]
  pub token_metadata: Box<Account<'info, Metadata>>,
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = target_mint.supply == 0
  )]
  pub target_mint: Box<Account<'info, Mint>>,
  pub buy_base_royalties: Box<Account<'info, TokenAccount>>,
  pub buy_target_royalties: Box<Account<'info, TokenAccount>>,
  pub sell_base_royalties: Box<Account<'info, TokenAccount>>,
  pub sell_target_royalties: Box<Account<'info, TokenAccount>>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]
pub struct InitializeOwnedSocialTokenV0<'info> {
  pub initialize_args: InitializeSocialTokenV0<'info>,
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    init,
    seeds = [
        b"owner-token-ref",
        owner.key().as_ref(),
        initialize_args.base_mint.key().as_ref()
    ],
    bump = args.owner_token_ref_bump_seed,
    payer = payer,
    space = 312
  )]
  pub owner_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    init,
    seeds = [
        b"mint-token-ref",
        initialize_args.token_bonding.target_mint.as_ref()
    ],
    constraint = verify_bonding_authorities(&initialize_args.token_bonding, &mint_token_ref.key())?,
    bump = args.mint_token_ref_bump_seed,
    payer = payer,
    space = 312,
  )]
  pub mint_token_ref: Box<Account<'info, TokenRefV0>>,
  pub owner: Signer<'info>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]
pub struct InitializeUnclaimedSocialTokenV0<'info> {
  pub initialize_args: InitializeSocialTokenV0<'info>,
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    init,
    seeds = [
        b"owner-token-ref",
        name.key().as_ref(),
        initialize_args.base_mint.key().as_ref(),
    ],
    bump = args.owner_token_ref_bump_seed,
    payer = payer,
    space = 312
  )]
  pub owner_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    init,
    seeds = [
        b"mint-token-ref",
        initialize_args.token_bonding.target_mint.as_ref()
    ],
    bump = args.mint_token_ref_bump_seed,
    payer = payer,
    space = 312,
    constraint = verify_bonding_authorities(&initialize_args.token_bonding, &mint_token_ref.key())?,
    constraint = verify_authority(Some(initialize_args.token_metadata.update_authority), &mint_token_ref.key())?,
  )]
  pub mint_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    constraint = (
      token_metadata.data.creators.is_none() &&
      token_metadata.data.seller_fee_basis_points == 0
    ),
    constraint = token_metadata.is_mutable,
    constraint = token_metadata.update_authority == mint_token_ref.key() @ ErrorCode::InvalidAuthority
  )]
  pub token_metadata: Box<Account<'info, Metadata>>,
  #[account(
    // Deserialize name account checked in token metadata constraint
    constraint = (*name.to_account_info().owner == system_program::ID && **name.try_borrow_lamports()? == 0_u64) || *name.to_account_info().owner == spl_name_service::ID,
  )]
  pub name: AccountInfo<'info>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: SetAsPrimaryV0Args)]
pub struct SetAsPrimaryV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  pub owner: Signer<'info>,
  #[account(
    constraint = owner.key() == token_ref.owner.ok_or::<ProgramError>(ErrorCode::IncorrectOwner.into())?
  )]
  pub token_ref: Account<'info, TokenRefV0>,
  #[account(
    init_if_needed,
    seeds = [
        b"owner-token-ref",
        owner.key().as_ref()
    ],
    bump = args.bump_seed,
    payer = payer,
    space = 312,
  )]
  pub primary_token_ref: Account<'info, TokenRefV0>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: UpdateTokenBondingV0ArgsWrapper)]
pub struct UpdateTokenBondingV0Wrapper<'info> {
  pub collective: Box<Account<'info, CollectiveV0>>,
  #[account(
    address = collective.authority.unwrap_or(Pubkey::default()),
    constraint = collective.config.is_open || authority.is_signer
  )]
  pub authority: AccountInfo<'info>,
  #[account(
    // For now, social tokens without a bonding curve are not supported. We may support them later
    constraint = mint_token_ref.token_bonding.ok_or::<ProgramError>(ErrorCode::NoBonding.into())? == token_bonding.key(),
    constraint = mint_token_ref.collective.is_none() || collective.key() == mint_token_ref.collective.unwrap() @ ErrorCode::InvalidCollective,
    constraint = token_ref_authority.key() == mint_token_ref.authority.ok_or::<ProgramError>(ErrorCode::IncorrectOwner.into())?,
  )]
  pub mint_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub token_ref_authority: Signer<'info>,

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
  pub payer: Signer<'info>,
  pub collective: UncheckedAccount<'info>,
  #[account(
    mut,
    constraint = owner_token_ref.collective.is_none() || collective.key() == owner_token_ref.collective.unwrap() @ ErrorCode::InvalidCollective,
    // For now, social tokens without a bonding curve are not supported. We may support them later
    constraint = owner_token_ref.token_bonding.ok_or::<ProgramError>(ErrorCode::NoBonding.into())? == token_bonding.key(),
    has_one = token_metadata,
    seeds = [
        b"owner-token-ref",
        name.key().as_ref(),
        base_mint.key().as_ref()
    ],
    bump = owner_token_ref.bump_seed,
    close = payer
  )]
  pub owner_token_ref: Account<'info, TokenRefV0>,
  #[account(
    init,
    seeds = [
        b"owner-token-ref",
        owner.key().as_ref(),
        base_mint.key().as_ref()
    ],
    bump = args.owner_token_ref_bump_seed,
    payer = payer,
    space = 312,
  )]
  pub new_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    constraint = mint_token_ref.collective.is_none() || collective.key() == mint_token_ref.collective.unwrap() @ ErrorCode::InvalidCollective,
    // For now, social tokens without a bonding curve are not supported. We may support them later
    constraint = mint_token_ref.token_bonding.unwrap() == token_bonding.key(),
    has_one = token_metadata,
    seeds = [
        b"mint-token-ref",
        token_bonding.target_mint.as_ref()
    ],
    bump = mint_token_ref.bump_seed,
  )]
  pub mint_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint,
    constraint = token_bonding.general_authority.unwrap() == mint_token_ref.key(),
    has_one = buy_base_royalties,
    has_one = buy_target_royalties,
    has_one = sell_base_royalties,
    has_one = sell_target_royalties
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(mut)]
  pub token_metadata: Account<'info, Metadata>,
  #[account(
    has_one = owner
  )]
  pub name: Box<Account<'info, NameRecordHeader>>,
  #[account(mut)]
  pub owner: Signer<'info>,

  pub base_mint: Box<Account<'info, Mint>>,
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub buy_base_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub buy_target_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub sell_base_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub sell_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(mut)]
  pub new_buy_base_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub new_buy_target_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub new_sell_base_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub new_sell_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(address = spl_token_bonding::id())]
  pub token_bonding_program: AccountInfo<'info>,
  pub token_program: Program<'info, Token>,
  #[account(address = token_metadata::ID)]
  pub token_metadata_program: AccountInfo<'info>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct StaticUpdateTokenBondingV0<'info> {
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint,
    has_one = buy_base_royalties,
    has_one = sell_base_royalties,
    has_one = buy_target_royalties,
    has_one = sell_target_royalties,
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub base_mint: Box<Account<'info, Mint>>,
  pub target_mint: Box<Account<'info, Mint>>,
  pub buy_base_royalties: Box<Account<'info, TokenAccount>>,
  pub buy_target_royalties: Box<Account<'info, TokenAccount>>,
  pub sell_base_royalties: Box<Account<'info, TokenAccount>>,
  pub sell_target_royalties: Box<Account<'info, TokenAccount>>,
}

#[derive(Accounts)]
#[instruction(args: ChangeOptStatusUnclaimedV0Args)]
pub struct ChangeOptStatusUnclaimedV0<'info> {
  #[account(
    mut,
    seeds = [
      b"owner-token-ref",
      name.key().as_ref(),
      token_bonding_update_accounts.base_mint.key().as_ref()
    ],
    constraint = mint_token_ref.mint == owner_token_ref.mint,
    bump = owner_token_ref.bump_seed,
  )]
  pub owner_token_ref: Account<'info, TokenRefV0>,
  #[account(
    mut,
    seeds = [
      b"mint-token-ref",
      token_bonding_update_accounts.target_mint.key().as_ref()
    ],
    bump = mint_token_ref.bump_seed
  )]
  pub mint_token_ref: Account<'info, TokenRefV0>,
  #[account(
    constraint = mint_token_ref.name.is_none() || (
      // name is the name on the token ref
      mint_token_ref.name.unwrap() == name.key()
    ) @ ErrorCode::InvalidNameAuthority
  )]
  pub name: UncheckedAccount<'info>,
  pub token_bonding_update_accounts: StaticUpdateTokenBondingV0<'info>,
  #[account(address = spl_token_bonding::id())]
  pub token_bonding_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(args: ChangeOptStatusClaimedV0Args)]
pub struct ChangeOptStatusClaimedV0<'info> {
  #[account(
    mut,
    seeds = [
      b"owner-token-ref",
      owner.key().as_ref(),
      token_bonding_update_accounts.base_mint.key().as_ref()
    ],
    bump = owner_token_ref.bump_seed,
    constraint = mint_token_ref.mint == owner_token_ref.mint,
    constraint = owner.key() == owner_token_ref.owner.ok_or::<ProgramError>(ErrorCode::InvalidAuthority.into())?
  )]
  pub owner_token_ref: Account<'info, TokenRefV0>,
  #[account(
    mut,
    seeds = [
      b"owner-token-ref",
      owner.key().as_ref()
    ],
    bump = primary_token_ref.bump_seed,
    constraint = mint_token_ref.mint == primary_token_ref.mint,
    constraint = owner.key() == primary_token_ref.owner.ok_or::<ProgramError>(ErrorCode::InvalidAuthority.into())?
  )]
  pub primary_token_ref: Account<'info, TokenRefV0>,
  pub owner: Signer<'info>,
  #[account(
    mut,
    seeds = [
      b"mint-token-ref",
      token_bonding_update_accounts.target_mint.key().as_ref()
    ],
    constraint = owner.key() == mint_token_ref.owner.ok_or::<ProgramError>(ErrorCode::InvalidAuthority.into())?,
    bump = mint_token_ref.bump_seed
  )]
  pub mint_token_ref: Account<'info, TokenRefV0>,
  pub token_bonding_update_accounts: StaticUpdateTokenBondingV0<'info>,
  #[account(address = spl_token_bonding::id())]
  pub token_bonding_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(args: UpdateOwnerV0Args)]
pub struct UpdateOwnerV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  pub new_owner: Signer<'info>,
  pub base_mint: Box<Account<'info, Mint>>,
  pub owner: Signer<'info>,
  #[account(
    mut,
    close = payer,
    seeds = [
      b"owner-token-ref",
      owner.key().as_ref(),
      base_mint.key().as_ref()
    ],
    bump = old_owner_token_ref.bump_seed,
    constraint = owner.key() == old_owner_token_ref.owner.ok_or::<ProgramError>(ErrorCode::InvalidAuthority.into())?,
  )]
  pub old_owner_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    init,
    seeds = [
      b"owner-token-ref",
      new_owner.key().as_ref(),
      base_mint.key().as_ref()
    ],
    bump = args.owner_token_ref_bump_seed,
    payer = payer,
    space = 312,
  )]
  pub new_owner_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    seeds = [
      b"mint-token-ref",
      mint_token_ref.mint.key().as_ref()
    ],
    constraint = owner.key() == mint_token_ref.owner.ok_or::<ProgramError>(ErrorCode::InvalidAuthority.into())?,
    constraint = old_owner_token_ref.mint == mint_token_ref.mint,
    bump = mint_token_ref.bump_seed
  )]
  pub mint_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    seeds = [
      b"owner-token-ref",
      owner.key().as_ref()
    ],
    bump = old_primary_token_ref.bump_seed,
    constraint = owner.key() == old_primary_token_ref.owner.ok_or::<ProgramError>(ErrorCode::InvalidAuthority.into())?
  )]
  pub old_primary_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    init_if_needed,
    seeds = [
      b"owner-token-ref",
      new_owner.key().as_ref(),
    ],
    bump = args.primary_token_ref_bump_seed,
    payer = payer,
    space = 312,
  )]
  pub new_primary_token_ref: Box<Account<'info, TokenRefV0>>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: UpdateAuthorityV0Args)]
pub struct UpdateAuthorityV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  pub base_mint: Account<'info, Mint>,
  pub authority: Signer<'info>,
  #[account(
    mut,
    seeds = [
      b"owner-token-ref",
      owner_token_ref.owner.unwrap().key().as_ref(),
      base_mint.key().as_ref()
    ],
    bump = owner_token_ref.bump_seed,
    constraint = authority.key() == owner_token_ref.authority.ok_or::<ProgramError>(ErrorCode::InvalidAuthority.into())?,
  )]
  pub owner_token_ref: Account<'info, TokenRefV0>,
  #[account(
    mut,
    seeds = [
      b"mint-token-ref",
      mint_token_ref.mint.key().as_ref()
    ],
    constraint = authority.key() == mint_token_ref.authority.ok_or::<ProgramError>(ErrorCode::InvalidAuthority.into())?,
    constraint = owner_token_ref.mint == mint_token_ref.mint,
    bump = mint_token_ref.bump_seed
  )]
  pub mint_token_ref: Account<'info, TokenRefV0>,
  #[account(
    mut,
    seeds = [
      b"owner-token-ref",
      owner_token_ref.owner.unwrap().key().as_ref(),
    ],
    bump = primary_token_ref.bump_seed
  )]
  pub primary_token_ref: Account<'info, TokenRefV0>,
}
