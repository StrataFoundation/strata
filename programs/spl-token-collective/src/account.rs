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

#[derive(Clone)]
pub struct OptionalCollectiveV0 {
  pub collective: Option<CollectiveV0>
}

impl AccountDeserialize for OptionalCollectiveV0 {
  fn try_deserialize(buf: &mut &[u8]) -> core::result::Result<Self, ProgramError> {
    if buf.len() == 0 {
      Ok(OptionalCollectiveV0 {
        collective: None
      })
    } else {
      Ok(OptionalCollectiveV0 {
        collective: Some(CollectiveV0::try_deserialize(buf)?)
      })
    }
  }

  fn try_deserialize_unchecked(buf: &mut &[u8]) -> core::result::Result<Self, ProgramError> {
    if buf.len() == 0 {
      Ok(OptionalCollectiveV0 {
        collective: None
      })
    } else {
      Ok(OptionalCollectiveV0 {
        collective: Some(CollectiveV0::try_deserialize_unchecked(buf)?)
      })
    }
  }
}

impl AccountSerialize for OptionalCollectiveV0 {
  fn try_serialize<W: std::io::Write>(&self, writer: &mut W) -> core::result::Result<(), ProgramError> {
    CollectiveV0::try_serialize(&self.collective.to_owned().unwrap(), writer)
  }
}

impl Owner for OptionalCollectiveV0 {
  fn owner() -> Pubkey {
    crate::id()
  }
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
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    seeds = [
      b"collective", 
      base_mint.key().as_ref()
   ],
    bump, 
    constraint = collective.collective.is_none() || token_bonding.base_mint.key() == collective.collective.as_ref().unwrap().mint.key(),
  )]
  pub collective: Box<Account<'info, OptionalCollectiveV0>>,
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
  pub clock: Sysvar<'info, Clock>
}



#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]
pub struct InitializeOwnedSocialTokenV0<'info> {
  pub initialize_args: InitializeSocialTokenV0<'info>,
  #[account(
    address = initialize_args.collective.collective.as_ref().and_then(|c| c.authority).unwrap_or(Pubkey::default()),
    constraint = initialize_args.collective.collective.as_ref().map(|c| c.config.is_open).unwrap_or(true) || authority.is_signer
  )]
  pub authority: AccountInfo<'info>,
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
  #[account(
    signer,
    address = initialize_args.collective.collective.as_ref().and_then(|c| c.authority).unwrap_or(Pubkey::default()),
    constraint = initialize_args.collective.collective.as_ref().map(|c| c.config.is_open).unwrap_or(true) || authority.is_signer
  )]
  pub authority: AccountInfo<'info>,
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
#[instruction(args: SetAsPrimaryV0Args)]
pub struct SetAsPrimaryV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  pub owner: Signer<'info>,
  #[account(
    constraint = owner.key() == owner_token_ref.owner.ok_or::<ProgramError>(ErrorCode::IncorrectOwner.into())?
  )]
  pub owner_token_ref: Account<'info, TokenRefV0>,
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
    constraint = owner_token_ref_authority.key() == mint_token_ref.authority.ok_or::<ProgramError>(ErrorCode::IncorrectOwner.into())?,
  )]
  pub mint_token_ref: Box<Account<'info, TokenRefV0>>,
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub owner_token_ref_authority: Signer<'info>,

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

fn owner_token_ref_final_seed<'a>(collective: &'a Pubkey, is_primary: bool) -> Vec<u8> {
  msg!("Is primary {}", is_primary);
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
  pub collective: Box<Account<'info, OptionalCollectiveV0>>,
  #[account(
    mut,
    constraint = owner_token_ref.collective.is_none() || collective.key() == owner_token_ref.collective.unwrap() @ ErrorCode::InvalidCollective,
    // For now, social tokens without a bonding curve are not supported. We may support them later
    constraint = mint_token_ref.token_bonding.ok_or::<ProgramError>(ErrorCode::NoBonding.into())? == token_bonding.key(),
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
  #[account(
    mut
  )]
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

  pub royalties_owner: AccountInfo<'info>,

  #[account(address = spl_token_bonding::id())]
  pub token_bonding_program: AccountInfo<'info>,
  pub token_program: Program<'info, Token>,
  #[account(address = token_metadata::ID)]
  pub token_metadata_program: AccountInfo<'info>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}
