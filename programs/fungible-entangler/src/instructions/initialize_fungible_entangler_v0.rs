use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeFungibleEntanglerV0Args {
  pub authority: Pubkey,
  pub go_live_unix_time: i64,
  pub freeze_swap_base_unix_time: Option<i64>,
  pub freeze_swap_target_unix_time: Option<i64>,
  pub target_storage_bump_seed: u8,
  pub index: u16,
}

#[derive(Accounts)]
#[instruction(args: InitializeFungibleEntanglerV0Args)]
pub struct InitializeFungibleEntanglerV0<'info> {
  #[account(mut)] 
  pub payer: Signer<'info>,
  #[account(
    init, 
    payer = payer,
    space = 512,
    seeds = [b"fungible-entangler", base_mint.key().as_ref(), ],
    bump,    
  )]
  pub entangler: Box<Account<'info, FungibleEntanglerV0>>,
  #[account(
    constraint = base_mint.is_initialized,
    constraint = base_mint.key() !== target_mint.key()
  )]
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = target_mint.is_initialized,
    constraint = target_mint.key() !== base_mint.key()
  )]
  pub target_mint: Box<Account<'info, Mint>>,  
  #[account(
    init,
    payer = payer,
    space = 512,
    seeds = [b"base-storage", base_mint.key().as_ref(), &args.index.to_le_bytes()]
    bump,
    token::mint = base_mint,
    token::authority = entangler,
  )]
  pub base_storage: Box<Account<'info, TokenAccount>>,
#[account(
    init,
    payer = payer,
    space = 512,
    seeds = [b"target-storage", base_mint.key().as_ref(), &args.index.to_le_bytes()]
    bump,
    token::mint = target_mint,
    token::authority = entangler,
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

  entangler.authority = ctx.accounts.authority;
  entangler.created_at_unix_time = ctx.accounts.clock.unix_timestamp;
  entangler.freeze_swap_base_unix_time = args.freeze_swap_base_unix_time;
  entangler.freeze_swap_target_unix_time = args.freeze_swap_target_unix_time;
  entangler.base_mint = ctx.accounts.base_mint.key();
  entangler.target_mint = ctx.accounts.target_mint.key();
  entangler.base_storage = ctx.accounts.base_storage.key();
  entangler.target_storage = ctx.accounts.target_storage.key();
  entangler.index = args.index;
  entangler.bump_seed = *ctx.bumps.get("entangler").unwrap();
  entangler.base_storage_bump_seed = *ctx.bumps.get("base_storage").unwrap();
  entangler.target_storage_bump_seed = *ctx.bumps.get("target_storage").unwrap();

  Ok(()) 
}