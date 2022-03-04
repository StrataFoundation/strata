use crate::state::*;
use anchor_lang::{
  prelude::*,
  solana_program::{program::invoke, system_instruction},
};
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BuyWrappedSolV0Args {
  pub amount: u64,
}

pub fn buy_wrapped_sol(accounts: &BuyWrappedSolV0, args: &BuyWrappedSolV0Args) -> Result<()> {
  invoke(
    &system_instruction::transfer(
      &accounts.source.key(),
      &accounts.sol_storage.key(),
      args.amount,
    ),
    &[
      accounts.source.to_account_info().clone(),
      accounts.sol_storage.to_account_info().clone(),
      accounts.system_program.to_account_info().clone(),
    ],
  )?;

  token::mint_to(
    CpiContext::new_with_signer(
      accounts.token_program.to_account_info().clone(),
      MintTo {
        mint: accounts.wrapped_sol_mint.to_account_info().clone(),
        to: accounts.destination.to_account_info().clone(),
        authority: accounts.mint_authority.to_account_info().clone(),
      },
      &[&[
        b"wrapped-sol-authority",
        &[accounts.state.mint_authority_bump_seed],
      ]],
    ),
    args.amount,
  )?;

  Ok(())
}

#[derive(Accounts)]
#[instruction(args: BuyWrappedSolV0Args)]
pub struct BuyWrappedSolV0<'info> {
  #[account(
    has_one = sol_storage,
    has_one = wrapped_sol_mint
  )]
  pub state: Box<Account<'info, ProgramStateV0>>,
  #[account(mut, constraint = wrapped_sol_mint.mint_authority.unwrap() == mint_authority.key())]
  pub wrapped_sol_mint: Account<'info, Mint>,
  /// CHECK: Checked by cpi to spl token
  pub mint_authority: AccountInfo<'info>,
  #[account(mut)]
  pub sol_storage: SystemAccount<'info>,
  #[account(mut)]
  pub source: Signer<'info>,
  #[account(
    mut,
    constraint = destination.mint == wrapped_sol_mint.key()
  )]
  pub destination: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<BuyWrappedSolV0>, args: BuyWrappedSolV0Args) -> Result<()> {
  buy_wrapped_sol(ctx.accounts, &args)
}
