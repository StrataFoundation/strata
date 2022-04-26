use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeFungibleEntanglerV0Args {
  pub authority: Pubkey,
  pub entangler_seed: Vec<u8>,
  pub go_live_unix_time: i64,
  pub freeze_swap_unix_time: Option<i64>,
}

#[derive(Accounts)]
#[instruction(args: InitializeFungibleEntanglerV0Args)]
pub struct InitializeFungibleEntanglerV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    init,
    payer = payer,
    space = 8 + 122,
    seeds = [b"entangler", &args.entangler_seed],
    bump
  )]
  pub entangler: Box<Account<'info, FungibleEntanglerV0>>,
  #[account(
    init,
    payer = payer,
    seeds = [b"storage", entangler.key().as_ref()]
    bump,
    token::mint = target_mint,
    token::authority = entangler,
  )]
  pub storage: Box<Account<'info, TokenAccount>>,
  #[account( constraint = mint.is_initialized)]
  pub mint: Box<Account<'info, Mint>>,
    
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

  entangler.authority = ctx.accounts.authority;
  entangler.mint = ctx.accounts.mint.key();
  entangler.storage = ctx.accounts.storage.key();
  entangler.go_live_unix_time = if args.go_live_unix_time < ctx.accounts.clock.unix_timestamp {
    ctx.accounts.clock.unix_timestamp
  } else {
    args.go_live_unix_time
  };
  entangler.freeze_swap_unix_time = args.freeze_swap_unix_time;
  entangler.created_at_unix_time = ctx.accounts.clock.unix_timestamp;
  entangler.bump_seed = *ctx.bumps.get("entangler").unwrap();
  entangler.storage_bump_seed = *ctx.bumps.get("storage").unwrap();

  Ok(())
}