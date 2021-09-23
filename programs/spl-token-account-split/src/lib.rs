use anchor_lang::{prelude::*, solana_program::system_program};
use spl_token_staking::{get_period, get_staking_period, TokenStakingV0};
use anchor_spl::token::{self, Burn, TokenAccount, Mint, Transfer, MintTo};
use spl_token::state::AccountState;

static TOKEN_ACCOUNT_AUTHORITY_PREFIX: &str = "token-account-authority";

declare_id!("Sp1it1Djn2NmQvXLPnGM4zAXArxuchvSdytNt5n76Hm");

#[program]
pub mod spl_token_account_split {
  use std::convert::TryInto;


use super::*;
  pub fn initialize_token_account_split_v0(
    ctx: Context<InitializeTokenAccountSplitV0>,
    args: InitializeTokenAccountSplitV0Args
  ) -> ProgramResult {
    let (owner_pda, token_account_authority_bump_seed) = Pubkey::find_program_address(
      &[
        TOKEN_ACCOUNT_AUTHORITY_PREFIX.as_bytes(), 
        ctx.accounts.token_account.to_account_info().key.as_ref(),
      ],
      ctx.program_id
    );
    if args.token_account_authority_bump_seed != token_account_authority_bump_seed || owner_pda != ctx.accounts.token_account.owner {
      return Err(ErrorCode::InvalidTokenAccountAuthority.into());
    }

    let token_account_split = &mut ctx.accounts.token_account_split;
    token_account_split.token_account = *ctx.accounts.token_account.to_account_info().key;
    token_account_split.token_staking = *ctx.accounts.token_staking.to_account_info().key;
    token_account_split.token_account_authority_bump_seed = args.token_account_authority_bump_seed;
    token_account_split.bump_seed = args.bump_seed;
    token_account_split.slot_number = args.slot_number;

    Ok(())
  }
  
  pub fn collect_tokens_v0(
    ctx: Context<CollectTokensV0>,
    args: CollectTokensV0Args
  ) -> ProgramResult {
    let staking = &ctx.accounts.token_staking;
    let target_mint = &ctx.accounts.target_mint;
    let source = ctx.accounts.staking_rewards_source.to_account_info();
    let source_authority = ctx.accounts.staking_rewards_authority.to_account_info();
    let token_program = ctx.accounts.token_program.to_account_info();
    token::burn(CpiContext::new(token_program.clone(), Burn {
      mint: target_mint.to_account_info().clone(),
      to: source.clone(),
      authority: source_authority.clone()
    }), args.staking_rewards_amount)?;

    let last_period = get_staking_period(&staking);
    let this_period = get_period(ctx.accounts.clock.unix_timestamp, staking.created_timestamp, &staking.period_unit, staking.period, true);
    let total_staking_reward_supply = target_mint.supply + (this_period - last_period) * staking.target_amount_per_period + staking.target_amount_unredeemed;
    // (staking_rewards_amount / total_supply) * token_account_balance
    let numerator: u128 = args.staking_rewards_amount as u128 * ctx.accounts.token_account.amount as u128;

    let amount = numerator.checked_div(total_staking_reward_supply as u128).ok_or::<ProgramError>(ErrorCode::ArithmeticError.into())?;
    let amount_u64 = amount.try_into().ok().ok_or::<ProgramError>(ErrorCode::ArithmeticError.into())?;

    token::transfer(CpiContext::new_with_signer(
      token_program.clone(), 
Transfer {
        from: ctx.accounts.token_account.to_account_info().clone(),
        to: ctx.accounts.destination.to_account_info().clone(),
        authority: ctx.accounts.token_account_authority.to_account_info().clone()
      },
      &[
        &[
          TOKEN_ACCOUNT_AUTHORITY_PREFIX.as_bytes(), 
          ctx.accounts.token_account.to_account_info().key.as_ref(),
          &[ctx.accounts.token_account_split.token_account_authority_bump_seed]
        ]
      ]
    ), amount_u64)?;
    
    Ok(())
  }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeTokenAccountSplitV0Args {
  slot_number: u16, // For easy token => splits access, allow multiple pdas
  bump_seed: u8,
  token_account_authority_bump_seed: u8
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct CollectTokensV0Args {
  staking_rewards_amount: u64
}

#[derive(Accounts)]
#[instruction(args: InitializeTokenAccountSplitV0Args)]
pub struct InitializeTokenAccountSplitV0<'info> {
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    init,
    seeds = [
      b"token-account-split", 
      token_staking.to_account_info().key.as_ref(),
      &args.slot_number.to_le_bytes()
    ],
    bump = args.bump_seed,
    payer = payer,
    space = 512
  )]
  pub token_account_split: Account<'info, TokenAccountSplitV0>,
  #[account(
    constraint = token_account.delegate.is_none() && 
                 token_account.close_authority.is_none() && 
                 token_account.state == AccountState::Initialized
  )]
  pub token_account: Account<'info, TokenAccount>,
  #[account()]
  pub token_staking: Account<'info, TokenStakingV0>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: CollectTokensV0Args)]
pub struct CollectTokensV0<'info> {
  #[account(
    seeds = [b"token-account-split", token_staking.to_account_info().key.as_ref(), &token_account_split.slot_number.to_le_bytes()],
    bump = token_account_split.bump_seed,
    has_one = token_account,
    has_one = token_staking
  )]
  pub token_account_split: Box<Account<'info, TokenAccountSplitV0>>,
  #[account(mut)]
  pub token_account: Box<Account<'info, TokenAccount>>,
  #[account(
    seeds = [TOKEN_ACCOUNT_AUTHORITY_PREFIX.as_bytes(), token_account.to_account_info().key.as_ref()],
    bump = token_account_split.token_account_authority_bump_seed,
  )]
  pub token_account_authority: AccountInfo<'info>,
  #[account(
    has_one = target_mint
  )]
  pub token_staking: Box<Account<'info, TokenStakingV0>>,
  #[account(mut)]
  pub target_mint: Account<'info, Mint>,
  #[account(mut)]
  pub staking_rewards_source: Account<'info, TokenAccount>,
  #[account(signer)]
  pub staking_rewards_authority: AccountInfo<'info>,
  #[account(mut)]
  pub destination: Account<'info, TokenAccount>,
  #[account()]
  pub token_program: AccountInfo<'info>,
  pub clock: Sysvar<'info, Clock>,
}

#[account]
#[derive(Default)]
pub struct TokenAccountSplitV0 {
  pub token_account: Pubkey,
  pub token_staking: Pubkey,
  pub slot_number: u16,
  pub bump_seed: u8,
  pub token_account_authority_bump_seed: u8
}

#[error]
pub enum ErrorCode {
  #[msg("Invalid token accountn authority")]
  InvalidTokenAccountAuthority,

  #[msg("Overflow or other checked arithmetic error")]
  ArithmeticError
}