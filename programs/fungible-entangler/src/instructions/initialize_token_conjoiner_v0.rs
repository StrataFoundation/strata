use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeTokenConjoinerV0Args {
  pub go_live_unix_time: i64,
  pub freeze_swap_base_unix_time: Option<i64>,
  pub freeze_swap_target_unix_time: Option<i64>,
  pub index: u16,
}

#[derive(Accounts)]
#[instruction(args: InitializeTokenConjoinerV0Args)]
pub struct InitializeTokenConjoinerV0<'info> {
  #[account(mut)] 
  pub payer: Signer<'info>,
  #[account(
    init, 
    seeds = [b"token-conjoiner", base_mint.key().as_ref(), &args.index.to_le_bytes()],
    bump,
    payer = payer,
    space = 512
  )]
  pub token_conjoiner: Box<Account<'info, TokenConjoinerV0>>,
  // mints cant be same
  #[account(
    constraint = base_mint.is_initialized
  )]
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = target_mint.is_initialized
  )]
  pub target_mint: Box<Account<'info, Mint>>,  
  // seeds
  // make conjoiner auth on both storage accounts  
  #[account(
    init
  )]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  #[account(
    init
  )]
  pub target_storage: Box<Account<'info, TokenAccount>>,
  
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
  pub clock: Sysvar<'info, Clock>,
}

pub fn handler(
  ctx: Context<InitializeTokenConjoinerV0>,
  args: InitializeTokenConjoinerV0Args,
) -> Result<()> {
  let conjoiner = &mut ctx.accounts.token_conjoiner;

  conjoiner.created_at_unix_time = ctx.accounts.clock.unix_timestamp;
  conjoiner.freeze_swap_base_unix_time = args.freeze_swap_base_unix_time;
  conjoiner.freeze_swap_target_unix_time = args.freeze_swap_target_unix_time;
  conjoiner.base_mint = ctx.accounts.base_mint.key();
  conjoiner.target_mint = ctx.accounts.target_mint.key();
  conjoiner.base_storage = ctx.accounts.base_storage.key();
  conjoiner.target_storage = ctx.accounts.target_storage.key();
  conjoiner.bump_seed = *ctx.bumps.get("token_conjoiner").unwrap();
  conjoiner.index = args.index;

  Ok(()) 
}