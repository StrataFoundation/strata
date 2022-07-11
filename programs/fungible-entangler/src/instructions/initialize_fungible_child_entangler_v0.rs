use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

pub const CHILD_ENTANGLER_SIZE: usize = 1 + // key
32 + // authority
32 + // parent entangler
32 + // mint
32 + // storage
8 + // go live
8 + // freeze swap
8 + // created
1 + // bump
1 + // storage bump
80; // padding

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeFungibleChildEntanglerV0Args {
  pub go_live_unix_time: i64,
  pub freeze_swap_unix_time: Option<i64>,
}

#[derive(Accounts)]
#[instruction(args: InitializeFungibleChildEntanglerV0Args)]
pub struct InitializeFungibleChildEntanglerV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  pub authority: Signer<'info>,
  #[account(
    mut,
    constraint = parent_entangler.authority.ok_or(error!(ErrorCode::NoAuthority))? == authority.key(),
    constraint = parent_entangler.parent_mint != child_mint.key()
  )]
  pub parent_entangler: Box<Account<'info, FungibleParentEntanglerV0>>,
  #[account(
    init,
    payer = payer,
    space = CHILD_ENTANGLER_SIZE,
    seeds = [b"entangler", parent_entangler.key().as_ref(), child_mint.key().as_ref()],
    bump,
  )]
  pub entangler: Box<Account<'info, FungibleChildEntanglerV0>>,
  #[account(
    init,
    payer = payer,
    seeds = [b"storage", entangler.key().as_ref()],
    bump,
    token::mint = child_mint,
    token::authority = entangler,
  )]
  pub child_storage: Box<Account<'info, TokenAccount>>,
  #[account(
    constraint = child_mint.is_initialized,
    constraint = child_mint.key() != parent_entangler.parent_mint
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
  let entangler = &mut ctx.accounts.entangler;

  entangler.parent_entangler = ctx.accounts.parent_entangler.key();
  entangler.child_mint = ctx.accounts.child_mint.key();
  entangler.child_storage = ctx.accounts.child_storage.key();
  entangler.go_live_unix_time = if args.go_live_unix_time < ctx.accounts.clock.unix_timestamp {
    ctx.accounts.clock.unix_timestamp
  } else {
    args.go_live_unix_time
  };
  entangler.freeze_swap_unix_time = args.freeze_swap_unix_time;
  entangler.created_at_unix_time = ctx.accounts.clock.unix_timestamp;
  entangler.bump_seed = *ctx.bumps.get("entangler").unwrap();
  entangler.storage_bump_seed = *ctx.bumps.get("child_storage").unwrap();

  ctx.accounts.parent_entangler.num_children += 1;

  Ok(())
}
