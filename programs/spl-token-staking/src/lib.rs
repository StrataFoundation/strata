use anchor_lang::{prelude::*};
use anchor_spl::token::{self, SetAuthority, TokenAccount, Mint, Transfer};
use {
  borsh::{BorshDeserialize, BorshSerialize}
};
use anchor_lang::solana_program::system_program;
use anchor_lang::solana_program::{program_error::ProgramError};

static TARGET_MINT_AUTHORITY_PREFIX: &str = "target-authority";

#[program]
pub mod spl_token_staking {
    use std::borrow::{Borrow, BorrowMut};

    use anchor_lang::solana_program::program::invoke_signed;
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
      token_staking.authority = *ctx.accounts.authority.to_account_info().key;

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

      let unix_time = ctx.accounts.clock.unix_timestamp;
      data.base_amount = args.base_amount;
      data.created_timestamp = unix_time;
      data.last_withdrawn_timestamp = unix_time;
      data.lockup_periods = args.lockup_periods;
      data.voucher_number = args.voucher_number;
      data.bump_seed = args.bump_seed;

      Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeTokenStakingV0Args {
  period_unit: PeriodUnit,
  period: u32,
  // reward_percent_per_period on each contract is derived from lockup_periods * reward_percent_per_period_per_lockup_period
  reward_percent_per_period_per_lockup_period: u32, // Percent, as taken by this value / u32.MAX_VALUEÒ
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
  #[account()]
  pub base_mint: CpiAccount<'info, Mint>,
  #[account()]
  pub target_mint: CpiAccount<'info, Mint>,
  #[account()]
  pub authority: AccountInfo<'info>,
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
    constraint = purchase_account.owner == *owner.to_account_info().key
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
  #[account(address = token::ID)]
  pub token_program: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
  pub rent: Sysvar<'info, Rent>,
  pub clock: Sysvar<'info, Clock>,
}

// #[account(seeds = ["target-authority".as_bytes(), target_mint.to_account_info().key.as_ref(), &[token_staking.target_mint_authority_bump_seed]])]
// pub target_authority: AccountInfo<'info>,

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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct Bumps {
  pub voucher_number: u16,
  pub bump_seed: u8,
  pub target_mint_authority_bump_seed: u8
}

#[account]
#[derive(Default)]
pub struct TokenStakingV0 {
  pub authority: Pubkey,
  pub base_mint: Pubkey,
  pub target_mint: Pubkey,
  pub period_unit: PeriodUnit,
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
  pub target_mint_authority_bump_seed: u8,
  pub bumps: Bumps
}

#[account]
#[derive(Default)]
pub struct StakingVoucherV0 {
  pub token_staking: Pubkey,
  pub staking_voucher: Pubkey,
  pub owner: Pubkey,
  pub base_amount: u64,
  pub created_timestamp: i64,
  pub last_withdrawn_timestamp: i64,
  pub lockup_periods: u64,

  // Needed to derive the PDA of this instance
  pub voucher_number: u16,
  pub bump_seed: u8
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
  InvalidStakingVoucherPDA
}