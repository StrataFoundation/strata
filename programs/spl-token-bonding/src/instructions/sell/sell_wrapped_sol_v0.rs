use crate::state::*;
use anchor_lang::{
  prelude::*,
  solana_program::{program::invoke_signed, system_instruction},
};
use anchor_spl::token::{self, Burn, Mint, Token, TokenAccount};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SellWrappedSolV0Args {
  pub amount: u64,
  pub all: bool, // Optional flag to just sell all of it.
}

#[derive(Accounts)]
#[instruction(args: SellWrappedSolV0Args)]
pub struct SellWrappedSolV0<'info> {
  #[account(
    has_one = sol_storage,
    has_one = wrapped_sol_mint
  )]
  pub state: Box<Account<'info, ProgramStateV0>>,
  #[account(mut)]
  pub wrapped_sol_mint: Account<'info, Mint>,
  #[account(mut)]
  pub sol_storage: SystemAccount<'info>,
  #[account(
    mut,
    has_one = owner,
    constraint = source.mint == wrapped_sol_mint.key()
  )]
  pub source: Box<Account<'info, TokenAccount>>,
  /// CHECK: Manually check signer here instead of using Signer so it can be used in internal CPI
  #[account(signer)]
  pub owner: AccountInfo<'info>,
  #[account(mut)]
  pub destination: SystemAccount<'info>,
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
}

pub fn sell_wrapped_sol(
  accounts: &SellWrappedSolV0,
  args: &SellWrappedSolV0Args,
  seeds: Option<&[&[&[u8]]]>,
) -> Result<()> {
  let amount = if args.all {
    accounts.source.amount
  } else {
    args.amount
  };

  invoke_signed(
    &system_instruction::transfer(
      &accounts.sol_storage.key(),
      &accounts.destination.key(),
      amount,
    ),
    &[
      accounts.sol_storage.to_account_info().clone(),
      accounts.destination.to_account_info().clone(),
      accounts.system_program.to_account_info().clone(),
    ],
    &[&[
      "sol-storage".as_bytes(),
      &[accounts.state.sol_storage_bump_seed],
    ]],
  )?;

  let token_program = accounts.token_program.to_account_info().clone();
  let command = Burn {
    mint: accounts.wrapped_sol_mint.to_account_info().clone(),
    from: accounts.source.to_account_info().clone(),
    authority: accounts.owner.to_account_info().clone(),
  };
  let context = match seeds {
    Some(seeds) => CpiContext::new_with_signer(token_program, command, seeds),
    None => CpiContext::new(token_program, command),
  };
  token::burn(context, amount)?;

  Ok(())
}

pub fn handler(ctx: Context<SellWrappedSolV0>, args: SellWrappedSolV0Args) -> Result<()> {
  sell_wrapped_sol(ctx.accounts, &args, None)
}
