use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

pub const PARENT_ENTANGLER_SIZE: usize = 1 + // key
32 + // authority
32 + // mint
32 + // dynamicSeed
32 + // storage
8 + // go live
8 + // freeze swap
8 + // created
1 + // bump
1 + // storage bump
80; // padding

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeFungibleParentEntanglerV0Args {
  pub authority: Option<Pubkey>,
  pub dynamic_seed: Vec<u8>,
  pub go_live_unix_time: i64,
  pub freeze_swap_unix_time: Option<i64>,
}

#[derive(Accounts)]
#[instruction(args: InitializeFungibleParentEntanglerV0Args)]
pub struct InitializeFungibleParentEntanglerV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    init,
    payer = payer,
    space = PARENT_ENTANGLER_SIZE,
    seeds = [b"entangler", parent_mint.key().as_ref(), &args.dynamic_seed],
    bump,
  )]
  pub entangler: Box<Account<'info, FungibleParentEntanglerV0>>,
  #[account(
    init,
    payer = payer,
    seeds = [b"storage", entangler.key().as_ref()],
    bump,
    token::mint = parent_mint,
    token::authority = entangler,
  )]
  pub parent_storage: Box<Account<'info, TokenAccount>>,
  #[account( constraint = parent_mint.is_initialized)]
  pub parent_mint: Box<Account<'info, Mint>>,

  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
  pub clock: Sysvar<'info, Clock>,
}

pub fn handler(
  ctx: Context<InitializeFungibleParentEntanglerV0>,
  args: InitializeFungibleParentEntanglerV0Args,
) -> Result<()> {
  let entangler = &mut ctx.accounts.entangler;

  entangler.authority = args.authority;
  entangler.parent_mint = ctx.accounts.parent_mint.key();
  entangler.parent_storage = ctx.accounts.parent_storage.key();
  entangler.go_live_unix_time = if args.go_live_unix_time < ctx.accounts.clock.unix_timestamp {
    ctx.accounts.clock.unix_timestamp
  } else {
    args.go_live_unix_time
  };
  entangler.freeze_swap_unix_time = args.freeze_swap_unix_time;
  entangler.created_at_unix_time = ctx.accounts.clock.unix_timestamp;
  entangler.dynamic_seed = args.dynamic_seed;
  entangler.bump_seed = *ctx.bumps.get("entangler").unwrap();
  entangler.storage_bump_seed = *ctx.bumps.get("parent_storage").unwrap();

  Ok(())
}
