use anchor_lang::{prelude::*, solana_program};
use anchor_spl::token::{self, SetAuthority, TokenAccount, Mint, Transfer, MintTo};
use {
  borsh::{BorshDeserialize, BorshSerialize}
};
use anchor_lang::solana_program::system_program;
use anchor_lang::solana_program::{program_error::ProgramError};

pub mod uint;
pub mod precise_number;

use crate::precise_number::PreciseNumber;

static TARGET_MINT_AUTHORITY_PREFIX: &str = "target-authority";

pub fn get_period(unix_timestamp: i64, created_timestamp: i64, period_unit: &PeriodUnit, period: u32) -> u64 {
  let diff = (unix_timestamp - created_timestamp) as u64;
  let period_multiplier = match period_unit {
    PeriodUnit::SECOND => 1 * period,
    PeriodUnit::MINUTE => 60 * period,
    PeriodUnit::HOUR => 60 * 60 * period,
    PeriodUnit::DAY => 60 * 60 * 24 * period,
    PeriodUnit::YEAR => 60 * 60 * 24 * 365 * period // Not exactly a year with leaps, but works for this purpose
  } as u64;

  return diff / period_multiplier;
}

pub fn get_staking_period(staking_data: &TokenStakingV0) -> u64 {
  get_period(staking_data.last_calculated_timestamp, staking_data.created_timestamp, &staking_data.period_unit, staking_data.period)
}

pub fn recalculate(staking_data: &mut TokenStakingV0, unix_timestamp: i64) {
  let last_period = get_staking_period(staking_data);
  staking_data.last_calculated_timestamp = unix_timestamp;
  let current_period = get_staking_period(staking_data);

  if last_period != current_period {
    staking_data.target_amount_unredeemed += (current_period - last_period) * staking_data.target_amount_per_period;
  }
}

pub fn get_rewards_per_period(voucher: &StakingVoucherV0, staking: &TokenStakingV0) -> Result<u64> {
  let max_u32 = PreciseNumber::new(u32::MAX as u128).ok_or::<ProgramError>(ErrorCode::ArithmeticError.into())?;
  let ret = PreciseNumber::new(staking.reward_percent_per_period_per_lockup_period as u128)
          .and_then(|reward_percent_per_period_per_lockup_period| 
            reward_percent_per_period_per_lockup_period.checked_div(&max_u32)
          ).and_then(|reward_percent|
            PreciseNumber::new(voucher.base_amount as u128).and_then(|base_amount|
              reward_percent.checked_mul(&base_amount)
            )
          )
          .and_then(|percent_per_lockup_period| 
            PreciseNumber::new(voucher.lockup_periods as u128).and_then(|lockup_periods|
              percent_per_lockup_period.checked_mul(&lockup_periods)
            )
          )
          .and_then(|precise_per_period| precise_per_period.to_imprecise())
          .ok_or::<ProgramError>(ErrorCode::ArithmeticError.into())? as u64;

  Ok(ret)
}

#[derive(Accounts)]
pub struct CloseTokenAccount<'info> {
    pub from: AccountInfo<'info>,
    pub to: AccountInfo<'info>,
    pub authority: AccountInfo<'info>,
}

pub fn close_token_account<'a, 'b, 'c, 'info>(
  ctx: CpiContext<'a, 'b, 'c, 'info, CloseTokenAccount<'info>>
) -> ProgramResult {
  let ix = spl_token::instruction::close_account(
      &spl_token::ID,
      ctx.accounts.from.key,
      ctx.accounts.to.key,
      ctx.accounts.authority.key,
      &[]
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
pub mod spl_token_staking {
    use std::{borrow::{Borrow, BorrowMut}};

    use anchor_lang::{Key, solana_program::{program::invoke_signed, system_instruction::{self, SystemInstruction}}};
    use anchor_spl::token::InitializeAccount;

    use super::*;
    pub fn initialize_token_staking_v0(
      ctx: Context<InitializeTokenStakingV0>,
      args: InitializeTokenStakingV0Args
    ) -> ProgramResult {
      let mint_pda = Pubkey::create_program_address(
        &[
          TARGET_MINT_AUTHORITY_PREFIX.as_bytes(), 
          ctx.accounts.target_mint.to_account_info().key.as_ref(),
          &[args.target_mint_authority_bump_seed]
        ], 
        ctx.program_id
      )?;
      let target_mint = &ctx.accounts.target_mint;
      if mint_pda != target_mint.mint_authority.ok_or::<ProgramError>(ErrorCode::NoMintAuthority.into())?
       || (target_mint.freeze_authority.is_some() && mint_pda != target_mint.freeze_authority.ok_or::<ProgramError>(ErrorCode::NoMintAuthority.into())?)  {
        return Err(ErrorCode::InvalidMintAuthority.into());
      }

      let token_staking = &mut ctx.accounts.token_staking;
      token_staking.period = args.period;
      token_staking.period_unit = args.period_unit;
      token_staking.reward_percent_per_period_per_lockup_period = args.reward_percent_per_period_per_lockup_period;
      token_staking.bump_seed = args.bump_seed;
      token_staking.created_timestamp = ctx.accounts.clock.unix_timestamp;
      token_staking.last_calculated_timestamp = ctx.accounts.clock.unix_timestamp;
      token_staking.target_mint_authority_bump_seed = args.target_mint_authority_bump_seed;
      token_staking.base_mint = *ctx.accounts.base_mint.to_account_info().key;
      token_staking.target_mint = *ctx.accounts.target_mint.to_account_info().key;
      token_staking.authority = args.authority;

      Ok(())
    }

    pub fn stake_v0(
      ctx: Context<StakeV0>,
      args: StakeV0Args
    ) -> ProgramResult {
      let data = &mut ctx.accounts.staking_voucher;
      token::transfer(CpiContext::new(ctx.accounts.token_program.clone(), Transfer {
        from: ctx.accounts.purchase_account.to_account_info(),
        to: ctx.accounts.base_holding.to_account_info(),
        authority: ctx.accounts.owner.to_account_info()
      }), args.base_amount)?;

      // Make sure the ata bump seed is valid
      Pubkey::create_program_address(
        &[
          ctx.accounts.owner.to_account_info().key.as_ref(), 
          ctx.accounts.base_mint.to_account_info().owner.as_ref(), 
          ctx.accounts.token_staking.target_mint.as_ref(), 
          &[args.ata_bump_seed]
        ],
        &spl_associated_token_account::ID
      )?;


      let unix_time = ctx.accounts.clock.unix_timestamp;
      data.base_amount = args.base_amount;
      data.created_timestamp = unix_time;
      data.last_collected_timestamp = unix_time;
      data.lockup_periods = args.lockup_periods;
      data.voucher_number = args.voucher_number;
      data.bump_seed = args.bump_seed;
      data.base_holding = ctx.accounts.base_holding.to_account_info().key();
      data.owner = ctx.accounts.owner.to_account_info().key();
      data.token_staking = ctx.accounts.token_staking.to_account_info().key();
      data.ata_bump_seed = args.ata_bump_seed;
      data.holding_bump_seed = args.holding_bump_seed;
      data.holding_authority_bump_seed = args.holding_authority_bump_seed;

      let staking_data = &mut ctx.accounts.token_staking;
      staking_data.total_base_amount_staked += data.base_amount;
      recalculate(staking_data, ctx.accounts.clock.unix_timestamp);
      
      let rewards_per_period: u64 = get_rewards_per_period(data, staking_data)?;
      staking_data.target_amount_per_period += rewards_per_period;
      
      Ok(())
    }

    pub fn collect_rewards_v0(
      ctx: Context<CollectRewardsV0>
    ) -> ProgramResult {
      let voucher = &mut ctx.accounts.staking_voucher;
      let staking = &mut ctx.accounts.token_staking;
      let unix_timestamp = ctx.accounts.clock.unix_timestamp;
      let last_period = get_period(voucher.last_collected_timestamp, staking.created_timestamp, &staking.period_unit, staking.period);
      let this_period = get_period(unix_timestamp, staking.created_timestamp, &staking.period_unit, staking.period);

      voucher.last_collected_timestamp = unix_timestamp;

      recalculate(staking, unix_timestamp);

      if last_period != this_period {
        let rewards_due: u64 = (this_period - last_period) * get_rewards_per_period(voucher, staking)?;
        staking.target_amount_unredeemed -= rewards_due;
        token::mint_to(
          CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info().clone(), 
    MintTo {
              mint: ctx.accounts.target_mint.to_account_info().clone(),
              to: ctx.accounts.destination.to_account_info().clone(),
              authority: ctx.accounts.mint_authority.to_account_info().clone()
            },
&[&[
              TARGET_MINT_AUTHORITY_PREFIX.as_bytes(), 
              ctx.accounts.target_mint.to_account_info().key.as_ref(),
              &[staking.target_mint_authority_bump_seed]
            ]]
          ),
  rewards_due
        )?;
      }

      Ok(())
    }

    pub fn unstake_v0(ctx: Context<UnstakeV0>) -> ProgramResult {
      let voucher = &mut ctx.accounts.staking_voucher;
      let base_holding = ctx.accounts.base_holding.to_account_info();
      let staking = &mut ctx.accounts.token_staking;
      let unix_timestamp = ctx.accounts.clock.unix_timestamp;

      let current_period = get_period(unix_timestamp, staking.created_timestamp, &staking.period_unit, staking.period);
      let staking_start_period = get_period(voucher.created_timestamp, staking.created_timestamp, &staking.period_unit, staking.period);

      if (current_period - staking_start_period) < voucher.lockup_periods {
        return Err(ErrorCode::LockupNotPassed.into());
      }

      let last_period = get_period(voucher.last_collected_timestamp, staking.created_timestamp, &staking.period_unit, staking.period);
      let this_period = get_period(unix_timestamp, staking.created_timestamp, &staking.period_unit, staking.period);
      if this_period != last_period {
        return Err(ErrorCode::CollectBeforeUnstake.into())
      }

      recalculate(staking, unix_timestamp);
      let rewards_per_period: u64 = get_rewards_per_period(voucher, staking)?;
      staking.target_amount_per_period -= rewards_per_period;

       // Transfer them their holding
      token::transfer(CpiContext::new_with_signer(
        ctx.accounts.token_program.clone(), 
Transfer {
          from: base_holding.clone(),
          to: ctx.accounts.destination.to_account_info().clone(),
          authority: ctx.accounts.base_holding_authority.to_account_info().clone()
        }, 
&[
          &[b"holding-authority", base_holding.key.as_ref(), &[voucher.holding_authority_bump_seed]]
        ]
      ), voucher.base_amount)?;

      close_token_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.clone(), 
        CloseTokenAccount {
          from: base_holding.clone(),
          to: ctx.accounts.owner.to_account_info().clone(),
          authority: ctx.accounts.base_holding_authority.to_account_info().clone()
        }, 
&[
          &[b"holding-authority", base_holding.key.as_ref(), &[voucher.holding_authority_bump_seed]]
        ]
      ))?;

      Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeTokenStakingV0Args {
  period_unit: PeriodUnit,
  period: u32,
  // reward_percent_per_period on each contract is derived from lockup_periods * reward_percent_per_period_per_lockup_period
  reward_percent_per_period_per_lockup_period: u32, // Percent, as taken by this value / u32.MAX_VALUEÒ
  authority: Option<Pubkey>,
  bump_seed: u8,
  target_mint_authority_bump_seed: u8
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct StakeV0Args {
  voucher_number: u16,
  // Base amount to stake
  base_amount: u64,
  // Number of periods to lockup for. Will decide the rewards characteristics
  lockup_periods: u64,
  bump_seed: u8,
  holding_bump_seed: u8,
  holding_authority_bump_seed: u8,
  ata_bump_seed: u8
}

#[derive(Accounts)]
#[instruction(args: InitializeTokenStakingV0Args)]
pub struct InitializeTokenStakingV0<'info> {
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    init,
    seeds = [b"token-staking", base_mint.to_account_info().key.as_ref(), target_mint.to_account_info().key.as_ref()],
    bump = args.bump_seed,
    payer = payer,
    space = 1000
  )]
  pub token_staking: ProgramAccount<'info, TokenStakingV0>,
  #[account(
    constraint = *base_mint.to_account_info().owner == token::ID
  )]
  pub base_mint: CpiAccount<'info, Mint>,
  #[account(
    constraint = *target_mint.to_account_info().owner == *base_mint.to_account_info().owner
  )]
  pub target_mint: CpiAccount<'info, Mint>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
  pub rent: Sysvar<'info, Rent>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
#[instruction(args: StakeV0Args)]
pub struct StakeV0<'info> {
  #[account(signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    mut,
    has_one = base_mint
  )]
  pub token_staking: ProgramAccount<'info, TokenStakingV0>,
  #[account(
    init,
    seeds = [
      b"stake-voucher", 
      owner.to_account_info().key.as_ref(), 
      token_staking.to_account_info().key.as_ref(),
      &args.voucher_number.to_le_bytes()
    ],
    bump = args.bump_seed,
    payer = payer,
    space = 1000
  )]
  pub staking_voucher: ProgramAccount<'info, StakingVoucherV0>,
  #[account()]
  pub base_mint: CpiAccount<'info, Mint>,
  #[account(
    mut,
    constraint = purchase_account.mint == *base_mint.to_account_info().key,
    constraint = purchase_account.owner == *owner.to_account_info().key,
  )]
  pub purchase_account: CpiAccount<'info, TokenAccount>,
  #[account(signer)]
  pub owner: AccountInfo<'info>,
  #[account(
    init,
    seeds = [b"holding", staking_voucher.to_account_info().key.as_ref()],
    space = TokenAccount::LEN,
    token = base_mint,
    authority = base_holding_authority,
    payer = payer,
    bump = args.holding_bump_seed
  )]
  pub base_holding: CpiAccount<'info, TokenAccount>,
  #[account(
    seeds = [b"holding-authority", base_holding.to_account_info().key.as_ref()],
    bump = args.holding_authority_bump_seed
  )]
  pub base_holding_authority: AccountInfo<'info>,
  #[account(address = *base_mint.to_account_info().owner)]
  pub token_program: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
  pub rent: Sysvar<'info, Rent>,
  pub clock: Sysvar<'info, Clock>,
}

/// Collect rewards for a given staking voucher. This operation is permissionless.
#[derive(Accounts)]
pub struct CollectRewardsV0<'info> {
  #[account(
    mut,
    has_one = target_mint
  )]
  pub token_staking: ProgramAccount<'info, TokenStakingV0>,
  #[account(
    mut,
    has_one = token_staking
  )]
  pub staking_voucher: ProgramAccount<'info, StakingVoucherV0>,
  #[account(
    mut,
    address = Pubkey::create_program_address(
      &[staking_voucher.owner.as_ref(), &token::ID.to_bytes(), token_staking.target_mint.as_ref(), &[staking_voucher.ata_bump_seed]],
      &spl_associated_token_account::ID
    )?
  )]
  pub destination: CpiAccount<'info, TokenAccount>,
  #[account(
    mut,
    constraint = target_mint.mint_authority.map(|a| a == *mint_authority.to_account_info().key).unwrap_or(false),
  )]
  pub target_mint: CpiAccount<'info, Mint>,
  #[account()]
  pub mint_authority: AccountInfo<'info>,
  #[account(address = *target_mint.to_account_info().owner)]
  pub token_program: AccountInfo<'info>,
  pub clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct UnstakeV0<'info> {
  #[account(
    mut
  )]
  pub token_staking: ProgramAccount<'info, TokenStakingV0>,
  #[account(
    mut,
    has_one = token_staking,
    has_one = owner,
    close = owner
  )]
  pub staking_voucher: ProgramAccount<'info, StakingVoucherV0>,
  #[account(
    mut,
    signer
  )]
  pub owner: AccountInfo<'info>,
  #[account(
    mut,
    constraint = destination.mint == token_staking.base_mint
  )]
  pub destination: CpiAccount<'info, TokenAccount>,
  #[account(
    mut,
    seeds = [b"holding", staking_voucher.to_account_info().key.as_ref()],
    bump = staking_voucher.holding_bump_seed
  )]
  pub base_holding: CpiAccount<'info, TokenAccount>,
  #[account(
    seeds = [b"holding-authority", base_holding.to_account_info().key.as_ref()],
    bump = staking_voucher.holding_authority_bump_seed
  )]
  pub base_holding_authority: AccountInfo<'info>,
  pub clock: Sysvar<'info, Clock>,
  #[account(address = *base_holding.to_account_info().owner)]
  pub token_program: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
}

#[repr(C)]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Debug, Clone)]
pub enum PeriodUnit {
  SECOND,
  MINUTE,
  HOUR,
  DAY,
  YEAR
}

impl Default for PeriodUnit {
  fn default() -> Self { PeriodUnit::HOUR }
}

#[account]
#[derive(Default)]
pub struct TokenStakingV0 {
  pub base_mint: Pubkey,
  pub target_mint: Pubkey,
  pub period_unit: PeriodUnit,
  pub authority: Option<Pubkey>,
  pub period: u32,
  // reward_percent_per_period on each contract is derived from lockup_periods * reward_percent_per_period_per_lockup_period
  pub reward_percent_per_period_per_lockup_period: u32, // Percent, as taken by this value / u32.MAX_VALUE

  // Calculated values, used to calculate the total target supply included unwithdrawn rewards
  pub total_base_amount_staked: u64, // Useful to have, not necessary.
  pub target_amount_per_period: u64,
  pub target_amount_unredeemed: u64,
  pub last_calculated_timestamp: i64,
  pub created_timestamp: i64,

  // Needed to derive the PDA of this instance
  pub voucher_number: u16,
  pub bump_seed: u8,
  pub target_mint_authority_bump_seed: u8
}

#[account]
#[derive(Default)]
pub struct StakingVoucherV0 {
  pub token_staking: Pubkey,
  pub base_holding: Pubkey,
  pub owner: Pubkey,
  pub base_amount: u64,
  pub created_timestamp: i64,
  pub last_collected_timestamp: i64,
  pub lockup_periods: u64,

  // Needed to derive the PDA of this instance
  pub voucher_number: u16,
  pub holding_bump_seed: u8,
  pub holding_authority_bump_seed: u8,
  pub bump_seed: u8,
  pub ata_bump_seed: u8
}

#[error]
pub enum ErrorCode {
  #[msg("Target mint must have an authority")]
  NoMintAuthority,

  #[msg("Target mint must have an authority that is a pda of this program")]
  InvalidMintAuthority,

  #[msg("Staking is already initialized")]
  StakingAlreadyInitialized,

  #[msg("Invalid pda for staking voucher, should be [stake-voucher, owner, token staking, voucher number]")]
  InvalidStakingVoucherPDA,

  #[msg("Error in precise number arithmetic")]
  ArithmeticError,

  #[msg("This voucher is still in the lockup period")]
  LockupNotPassed,

  #[msg("You must collect on this voucher before unstaking it. You should do both in the same transaction")]
  CollectBeforeUnstake,

  #[msg("Account did not serialize while closing")]
  AccountDidNotSerialize
}