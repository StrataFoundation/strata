use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeFungibleChildEntanglerV0Args {
  pub authority: Pubkey,
  pub go_live_unix_time: i64,
  pub freeze_swap_unix_time: Option<i64>,
}

#[derive(Accounts)]
#[instruction(args: InitializeFungibleChildEntanglerV0Args)]
pub struct InitializeFungibleChildEntanglerV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    constraint = parent_entangler.mint != child_mint.key()
  )]
  pub parent_entangler: Box<Account<'info, FungibleEntanglerV0>>,
  #[account(
    init, 
    payer = payer,
    space = 8 + 154,
    seeds = [b"entangler", parent_entangler.key().as_ref(), child_mint.key().as_ref()],
    bump,
    has_one = parent_entangler,
  )]
  pub child_entangler: Box<Account<'info, FungibleChildEntanglerV0>>,
  #[account(
    init,
    payer = payer,
    seeds = [b"storage", parent_entangler.key().as_ref()],
    bump,
    token::mint = child_mint,
    token::authority = child_entangler,
  )]
  pub child_storage: Box<Account<'info, TokenAccount>>,      
  #[account(
    constraint = child_mint.is_initialized,
    constraint = child_mint.key() != parent_entangler.mint
  )]
  pub child_mint: Box<Account<'info, Mint>>,

  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
  pub clock: Sysvar<'info, Clock>,  
}

pub fn handler(
  ctx: Context<InitializeFungibleChildEntanglerV0>,  
  args: InitializeFungibleChildEntanglerV0Args,
) -> Result<()> {
  let child_entangler = &mut ctx.accounts.child_entangler;

  child_entangler.authority = args.authority;
  child_entangler.parent_entangler = ctx.accounts.parent_entangler.key();
  child_entangler.mint = ctx.accounts.child_mint.key();
  child_entangler.storage = ctx.accounts.child_storage.key();
  child_entangler.go_live_unix_time = if args.go_live_unix_time < ctx.accounts.clock.unix_timestamp {
    ctx.accounts.clock.unix_timestamp
  } else {
    args.go_live_unix_time
  };
  child_entangler.freeze_swap_unix_time = args.freeze_swap_unix_time;
  child_entangler.created_at_unix_time = ctx.accounts.clock.unix_timestamp;
  child_entangler.bump_seed = *ctx.bumps.get("child_entangler").unwrap();
  child_entangler.storage_bump_seed = *ctx.bumps.get("child_storage").unwrap();

  Ok(())
}