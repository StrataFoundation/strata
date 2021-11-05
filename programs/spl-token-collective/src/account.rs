use anchor_lang::{prelude::*, solana_program, solana_program::system_program};
use spl_token_bonding::state::TokenBondingV0;
use crate::arg::*;
use crate::name::NameRecordHeader;
use crate::{token_metadata, token_metadata::Metadata};
use crate::util::*;
use crate::state::*;
use crate::error::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

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
    space=512
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
pub struct InitializeSocialTokenV0<'info> {
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(seeds = [b"collective", collective.mint.as_ref()], bump = collective.bump_seed)]
  pub collective: Box<Account<'info, CollectiveV0>>,
  #[account(
    constraint = token_bonding.base_mint.key() == collective.mint.key(),
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
  pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]
pub struct InitializeOwnedSocialTokenV0<'info> {
  pub initialize_args: InitializeSocialTokenV0<'info>,
  #[account(
    address = initialize_args.collective.authority.unwrap_or(Pubkey::default()),
    constraint = initialize_args.collective.config.is_open || authority.is_signer
  )]
  pub authority: AccountInfo<'info>,
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    init,
    seeds = [
        b"token-ref",
        owner.key().as_ref(),
        &token_ref_final_seed(&initialize_args.collective.key(), args.is_primary)
    ],
    bump = args.token_ref_bump_seed,
    payer = payer,
    space = 512
  )]
  pub token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    init,
    seeds = [
        b"reverse-token-ref",
        initialize_args.token_bonding.target_mint.as_ref()
    ],
    constraint = verify_authority(initialize_args.token_bonding.authority, &[b"token-bonding-authority", reverse_token_ref.key().as_ref()], args.token_bonding_authority_bump_seed)?,
    bump = args.reverse_token_ref_bump_seed,
    payer = payer,
    space = 512,
  )]
  pub reverse_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    signer
  )]
  pub owner: AccountInfo<'info>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]
pub struct InitializeUnclaimedSocialTokenV0<'info> {
  pub initialize_args: InitializeSocialTokenV0<'info>,
  #[account(
    signer,
    address = initialize_args.collective.authority.unwrap_or(Pubkey::default())
  )]
  pub authority: AccountInfo<'info>,
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    init,
    seeds = [
        b"token-ref",
        name.key().as_ref(),
        initialize_args.collective.key().as_ref(),
    ],
    bump = args.token_ref_bump_seed,
    payer = payer,
    space = 512
  )]
  pub token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    init,
    seeds = [
        b"reverse-token-ref",
        initialize_args.token_bonding.target_mint.as_ref()
    ],
    bump = args.reverse_token_ref_bump_seed,
    payer = payer,
    space = 512,
    constraint = verify_authority(initialize_args.token_bonding.authority, &[b"token-bonding-authority", reverse_token_ref.key().as_ref()], args.token_bonding_authority_bump_seed)?,
    constraint = verify_authority(Some(initialize_args.token_metadata.update_authority), &[b"token-metadata-authority", reverse_token_ref.key().as_ref()], args.token_metadata_update_authority_bump_seed)?,
  )]
  pub reverse_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    constraint = (
      token_metadata.data.creators.is_none() &&
      token_metadata.data.seller_fee_basis_points == 0
    ),
    constraint = token_metadata.is_mutable,
  )]
  pub token_metadata: Box<Account<'info, Metadata>>,
  #[account(
    // Deserialize name account checked in token metadata constraint
    constraint = (*name.to_account_info().owner == system_program::ID && **name.try_borrow_lamports()? == 0_u64) || *name.to_account_info().owner == spl_name_service::ID,
  )]
  #[account(
    // Deserialize name account checked in token metadata constraint
  )]
  pub name: AccountInfo<'info>,
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
    has_one = token_bonding,
    has_one = collective,
    constraint = owner.key() == reverse_token_ref.owner.ok_or::<ProgramError>(ErrorCode::IncorrectOwner.into())?
  )]
  pub reverse_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(
    seeds = [
      b"token-bonding-authority", reverse_token_ref.key().as_ref()
    ],
    bump = reverse_token_ref.token_bonding_authority_bump_seed
  )]
  pub token_bonding_authority: AccountInfo<'info>,
  #[account(
    signer,
  )]
  pub owner: AccountInfo<'info>,

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

fn token_ref_final_seed<'a>(collective: &'a Pubkey, is_primary: bool) -> Vec<u8> {
  if is_primary {
    Pubkey::default().as_ref().to_vec()
  } else { 
    collective.as_ref().to_vec()
  }
}

#[derive(Accounts)]
#[instruction(args: ClaimSocialTokenV0Args)]
pub struct ClaimSocialTokenV0<'info> {
  pub payer: Signer<'info>,
  pub collective: Box<Account<'info, CollectiveV0>>,
  #[account(
    mut,
    has_one = collective,
    has_one = token_bonding,
    has_one = token_metadata,
    seeds = [
        b"token-ref",
        name.key().as_ref(),
        collective.key().as_ref()
    ],
    bump = token_ref.bump_seed,
    close = payer
  )]
  pub token_ref: Account<'info, TokenRefV0>,
  #[account(
    init,
    seeds = [
        b"token-ref",
        owner.key().as_ref(),
        &token_ref_final_seed(&collective.key(), args.is_primary)
    ],
    bump = args.token_ref_bump_seed,
    payer = payer,
    space = 512,
  )]
  pub new_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    has_one = collective,
    has_one = token_bonding,
    has_one = token_metadata,
    seeds = [
        b"reverse-token-ref",
        token_bonding.target_mint.as_ref()
    ],
    bump = reverse_token_ref.bump_seed,
  )]
  pub reverse_token_ref: Box<Account<'info, TokenRefV0>>,
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
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(mut)]
  pub token_metadata: Account<'info, Metadata>,
  #[account(
    seeds = [
      b"token-bonding-authority", reverse_token_ref.key().as_ref()
    ],
    bump = token_ref.token_bonding_authority_bump_seed
  )]
  pub token_bonding_authority: AccountInfo<'info>,
  #[account(
    seeds = [
      b"token-metadata-authority", reverse_token_ref.key().as_ref()
    ],
    bump = token_ref.token_metadata_update_authority_bump_seed
  )]
  pub metadata_update_authority: AccountInfo<'info>,

  #[account(
    has_one = owner
  )]
  pub name: Box<Account<'info, NameRecordHeader>>,
  #[account(
    mut,
    signer,
  )]
  pub owner: AccountInfo<'info>,

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

  pub royalties_owner: AccountInfo<'info>,

  #[account(address = spl_token_bonding::id())]
  pub token_bonding_program: AccountInfo<'info>,
  pub token_program: Program<'info, Token>,
  #[account(address = token_metadata::ID)]
  pub token_metadata_program: AccountInfo<'info>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}
