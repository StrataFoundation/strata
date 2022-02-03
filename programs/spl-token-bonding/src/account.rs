#![allow(clippy::or_fun_call)]

use crate::arg::*;
use crate::error::ErrorCode;
use crate::state::*;
use anchor_lang::{prelude::*, solana_program};
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct CloseTokenAccount<'info> {
  pub from: AccountInfo<'info>,
  pub to: AccountInfo<'info>,
  pub authority: AccountInfo<'info>,
}

pub fn close_token_account<'a, 'b, 'c, 'info>(
  ctx: CpiContext<'a, 'b, 'c, 'info, CloseTokenAccount<'info>>,
) -> ProgramResult {
  let ix = spl_token::instruction::close_account(
    &spl_token::ID,
    ctx.accounts.from.key,
    ctx.accounts.to.key,
    ctx.accounts.authority.key,
    &[],
  )?;
  solana_program::program::invoke_signed(
    &ix,
    &[
      ctx.accounts.from.clone(),
      ctx.accounts.to.clone(),
      ctx.accounts.authority.clone(),
      ctx.program.clone(),
    ],
    ctx.signer_seeds,
  )
}

#[derive(Accounts)]
#[instruction(args: InitializeSolStorageV0Args)]
pub struct InitializeSolStorageV0<'info> {
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    init,
    space = 212,
    seeds = ["state".as_bytes()],
    bump = args.bump_seed,
    payer = payer
  )]
  pub state: Account<'info, ProgramStateV0>,
  #[account(
    seeds = ["sol-storage".as_bytes()],
    bump = args.sol_storage_bump_seed,
  )]
  pub sol_storage: AccountInfo<'info>,
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
  pub mint_authority: AccountInfo<'info>,
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
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
  pub mint_authority: AccountInfo<'info>,
  #[account(mut)]
  pub sol_storage: AccountInfo<'info>,
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
  pub sol_storage: AccountInfo<'info>,
  #[account(
    mut,
    has_one = owner,
    constraint = source.mint == wrapped_sol_mint.key()
  )]
  pub source: Box<Account<'info, TokenAccount>>,
  #[account(signer)]
  pub owner: AccountInfo<'info>,
  #[account(mut)]
  pub destination: AccountInfo<'info>,
  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: PiecewiseCurve)]
pub struct InitializeCurveV0<'info> {
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(zero)]
  pub curve: Account<'info, CurveV0>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: InitializeTokenBondingV0Args)]
pub struct InitializeTokenBondingV0<'info> {
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  pub curve: Box<Account<'info, CurveV0>>,
  #[account(
    init,
    seeds = [b"token-bonding", target_mint.key().as_ref(), &args.index.to_le_bytes()],
    bump = args.bump_seed,
    // Index 0 is reserved for the primary bonding curve, the one with which new tokens can be minted
    constraint = args.index != 0 || target_mint.mint_authority.unwrap() == token_bonding.key(),
    payer = payer,
    space = 512
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(
    constraint = base_mint.is_initialized
  )]
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = target_mint.is_initialized
  )]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = base_storage.mint == base_mint.key(),
    constraint = base_storage.delegate.is_none(),
    constraint = base_storage.close_authority.is_none(),
    constraint = base_storage.owner == token_bonding.key()
  )]
  pub base_storage: Box<Account<'info, TokenAccount>>,

  pub buy_base_royalties: UncheckedAccount<'info>,
  pub buy_target_royalties: UncheckedAccount<'info>,
  pub sell_base_royalties: UncheckedAccount<'info>,
  pub sell_target_royalties: UncheckedAccount<'info>,

  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct CloseTokenBondingV0<'info> {
  #[account(mut)]
  pub refund: AccountInfo<'info>, // Will receive the reclaimed SOL
  #[account(
    mut,
    close = refund,
    constraint = token_bonding.general_authority.ok_or::<ProgramError>(ErrorCode::NoAuthority.into())? == general_authority.key(),
    has_one = target_mint,
    has_one = base_storage
  )]
  pub token_bonding: Account<'info, TokenBondingV0>,
  #[account(
    // Bonding can be closed by the authority if reserves are empty
    constraint = base_storage.amount == 0
  )]
  pub general_authority: Signer<'info>,

  #[account(mut)]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferReservesV0Common<'info> {
  #[account(
    mut,
    constraint = token_bonding.reserve_authority.ok_or::<ProgramError>(ErrorCode::NoAuthority.into())? == reserve_authority.key(),
    has_one = base_mint,
    has_one = base_storage
  )]
  pub token_bonding: Account<'info, TokenBondingV0>,
  pub reserve_authority: Signer<'info>,
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(args: TransferReservesV0Args)]
pub struct TransferReservesV0<'info> {
  pub common: TransferReservesV0Common<'info>,
  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,
}

#[derive(Accounts)]
#[instruction(args: TransferReservesV0Args)]
pub struct TransferReservesNativeV0<'info> {
  pub common: TransferReservesV0Common<'info>,
  #[account(mut)]
  pub destination: UncheckedAccount<'info>,

  #[account(
    has_one = sol_storage,
    has_one = wrapped_sol_mint
  )]
  pub state: Box<Account<'info, ProgramStateV0>>,
  #[account(
    mut,
    constraint = wrapped_sol_mint.mint_authority.unwrap() == mint_authority.key(),
    constraint = wrapped_sol_mint.key() == common.base_mint.key()
  )]
  pub wrapped_sol_mint: Account<'info, Mint>,
  pub mint_authority: AccountInfo<'info>,
  #[account(mut)]
  pub sol_storage: AccountInfo<'info>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(args: UpdateTokenBondingV0Args)]
pub struct UpdateTokenBondingV0<'info> {
  #[account(
    mut,
    constraint = token_bonding.general_authority.ok_or::<ProgramError>(ErrorCode::NoAuthority.into())? == general_authority.key(),
    has_one = base_mint,
    has_one = target_mint
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(signer)]
  pub general_authority: AccountInfo<'info>,
  pub base_mint: Box<Account<'info, Mint>>,
  pub target_mint: Box<Account<'info, Mint>>,

  pub buy_base_royalties: UncheckedAccount<'info>,
  pub buy_target_royalties: UncheckedAccount<'info>,
  pub sell_base_royalties: UncheckedAccount<'info>,
  pub sell_target_royalties: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct BuyV0<'info> {
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint,
    has_one = base_storage,
    has_one = buy_base_royalties,
    has_one = buy_target_royalties,
    has_one = curve
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub curve: Box<Account<'info, CurveV0>>,
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  // Token account could have been closed. This is fine if royalties are 0
  pub buy_base_royalties: AccountInfo<'info>,
  #[account(mut)]
  // Token account could have been closed. This is fine if royalties are 0
  pub buy_target_royalties: AccountInfo<'info>,
  #[account(mut)]
  pub source: Box<Account<'info, TokenAccount>>,
  pub source_authority: Signer<'info>,
  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct BuyV1<'info> {
  pub common: BuyCommonV0<'info>,
  // This endpoint is only for non wrapped sol
  #[account(
    constraint = state.wrapped_sol_mint != common.base_mint.key()
  )]
  pub state: Box<Account<'info, ProgramStateV0>>,
  #[account(mut)]
  pub source: Box<Account<'info, TokenAccount>>,
  pub source_authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct BuyCommonV0<'info> {
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint,
    has_one = base_storage,
    has_one = buy_base_royalties,
    has_one = buy_target_royalties,
    has_one = curve
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub curve: Box<Account<'info, CurveV0>>,
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  // Token account could have been closed. This is fine if royalties are 0
  pub buy_base_royalties: AccountInfo<'info>,
  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  // Token account could have been closed. This is fine if royalties are 0
  pub buy_target_royalties: AccountInfo<'info>,
  pub token_program: Program<'info, Token>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct BuyNativeV0<'info> {
  pub common: BuyCommonV0<'info>,
  #[account(mut)]
  pub source: Signer<'info>,

  #[account(
    has_one = sol_storage,
    has_one = wrapped_sol_mint,
    constraint = common.base_mint.key() == state.wrapped_sol_mint
  )]
  pub state: Box<Account<'info, ProgramStateV0>>,
  #[account(mut, constraint = wrapped_sol_mint.mint_authority.unwrap() == mint_authority.key())]
  pub wrapped_sol_mint: Account<'info, Mint>,
  pub mint_authority: AccountInfo<'info>,
  #[account(mut)]
  pub sol_storage: AccountInfo<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SellV0<'info> {
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint,
    has_one = base_storage,
    has_one = curve,
    has_one = sell_base_royalties,
    has_one = sell_target_royalties,
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub curve: Box<Account<'info, CurveV0>>,
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  // Token account could have been closed. Royalties are not sent if the account has been closed, but we also don't want to fail to parse here
  pub sell_base_royalties: AccountInfo<'info>,
  #[account(mut)]
  // Token account could have been closed. Royalties are not sent if the account has been closed, but we also don't want to fail to parse here
  pub sell_target_royalties: AccountInfo<'info>,

  #[account(mut)]
  pub source: Box<Account<'info, TokenAccount>>,
  #[account(signer)]
  pub source_authority: AccountInfo<'info>,

  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,

  pub token_program: Program<'info, Token>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct SellV1<'info> {
  pub common: SellCommonV0<'info>,

  #[account(
    constraint = state.wrapped_sol_mint != common.base_mint.key()
  )]
  pub state: Box<Account<'info, ProgramStateV0>>,

  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,
}

#[derive(Accounts)]
pub struct SellCommonV0<'info> {
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint,
    has_one = base_storage,
    has_one = curve,
    has_one = sell_base_royalties,
    has_one = sell_target_royalties,
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub curve: Box<Account<'info, CurveV0>>,
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  // Token account could have been closed. Royalties are not sent if the account has been closed, but we also don't want to fail to parse here
  pub sell_base_royalties: AccountInfo<'info>,
  #[account(mut)]
  pub source: Box<Account<'info, TokenAccount>>,
  #[account(signer)]
  pub source_authority: AccountInfo<'info>,
  #[account(mut)]
  // Token account could have been closed. Royalties are not sent if the account has been closed, but we also don't want to fail to parse here
  pub sell_target_royalties: AccountInfo<'info>,
  pub token_program: Program<'info, Token>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct SellNativeV0<'info> {
  pub common: SellCommonV0<'info>,

  #[account(mut)]
  pub destination: AccountInfo<'info>,

  #[account(
    has_one = sol_storage,
    has_one = wrapped_sol_mint
  )]
  pub state: Box<Account<'info, ProgramStateV0>>,
  #[account(mut, constraint = wrapped_sol_mint.mint_authority.unwrap() == mint_authority.key())]
  pub wrapped_sol_mint: Account<'info, Mint>,
  pub mint_authority: AccountInfo<'info>,
  #[account(mut)]
  pub sol_storage: AccountInfo<'info>,
  pub system_program: Program<'info, System>,
}
