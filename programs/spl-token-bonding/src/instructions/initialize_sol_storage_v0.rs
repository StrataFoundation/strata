use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeSolStorageV0Args {
  pub mint_authority_bump_seed: u8,
  pub sol_storage_bump_seed: u8,
  pub bump_seed: u8,
}

#[derive(Accounts)]
#[instruction(args: InitializeSolStorageV0Args)]
pub struct InitializeSolStorageV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    init,
    space = 212,
    seeds = ["state".as_bytes()],
    bump,
    payer = payer
  )]
  pub state: Account<'info, ProgramStateV0>,
  #[account(
    seeds = ["sol-storage".as_bytes()],
    bump = args.sol_storage_bump_seed,
  )]
  pub sol_storage: SystemAccount<'info>,
  #[account(
    constraint = wrapped_sol_mint.mint_authority.unwrap() == mint_authority.key() &&
                 wrapped_sol_mint.decimals == spl_token::native_mint::DECIMALS &&
                 wrapped_sol_mint.freeze_authority.unwrap() == mint_authority.key() &&
                 wrapped_sol_mint.supply == 0
  )]
  pub wrapped_sol_mint: Account<'info, Mint>,
  #[account(
    seeds = ["wrapped-sol-authority".as_bytes()],
    bump = args.mint_authority_bump_seed
  )]
  /// CHECK: Authority, used in CPIs
  pub mint_authority: AccountInfo<'info>,
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
  ctx: Context<InitializeSolStorageV0>,
  args: InitializeSolStorageV0Args,
) -> Result<()> {
  let state = &mut ctx.accounts.state;
  state.bump_seed = *ctx.bumps.get("state").unwrap();
  state.mint_authority_bump_seed = args.mint_authority_bump_seed;
  state.sol_storage_bump_seed = args.sol_storage_bump_seed;
  state.sol_storage = ctx.accounts.sol_storage.key();
  state.wrapped_sol_mint = ctx.accounts.wrapped_sol_mint.key();

  Ok(())
}
