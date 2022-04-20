use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeFungibleEntanglerV0Args {
  pub go_live_unix_time: i64,
  pub freeze_swap_base_unix_time: Option<i64>,
  pub freeze_swap_target_unix_time: Option<i64>,
  pub index: u16,
}

#[derive(Accounts)]
#[instruction(args: InitializeFungibleEntanglerV0Args)]
pub struct InitializeFungibleEntanglerV0<'info> {
  #[account(mut)] 
  pub payer: Signer<'info>,
  #[account(
    init, 
    seeds = [b"fungible-entangler", base_mint.key().as_ref(), &args.index.to_le_bytes()],
    bump,
    payer = payer,
    space = 512
  )]
  pub entangler: Box<Account<'info, FungibleEntanglerV0>>,
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
  // make entangler auth on both storage accounts  
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
  ctx: Context<InitializeFungibleEntanglerV0>,
  args: InitializeFungibleEntanglerV0Args,
) -> Result<()> {
  let entangler = &mut ctx.accounts.entangler;

  entangler.created_at_unix_time = ctx.accounts.clock.unix_timestamp;
  entangler.freeze_swap_base_unix_time = args.freeze_swap_base_unix_time;
  entangler.freeze_swap_target_unix_time = args.freeze_swap_target_unix_time;
  entangler.base_mint = ctx.accounts.base_mint.key();
  entangler.target_mint = ctx.accounts.target_mint.key();
  entangler.base_storage = ctx.accounts.base_storage.key();
  entangler.target_storage = ctx.accounts.target_storage.key();
  entangler.bump_seed = *ctx.bumps.get("fungible_entangler").unwrap();
  entangler.index = args.index;

  Ok(()) 
}