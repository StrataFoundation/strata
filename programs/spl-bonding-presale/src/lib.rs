use anchor_lang::{prelude::*, solana_program::{system_program, system_instruction, program::{invoke_signed, invoke}}};
use anchor_spl::{token, token::{Mint, Token, TokenAccount, Transfer}};
use spl_token_bonding::{curve::{ONE_PREC, Curve}, state::CurveV0, state::TokenBondingV0, util::get_percent, precise_number::PreciseNumber, util::{precise_supply, precise_supply_amt, to_mint_amount}};

declare_id!("7qjwGzGaQshSgD1QiNRrVtxBfqrsBAXwPfoHHN58v4oG");

trait OrArithError {
  fn or_arith_error(self) -> Result<PreciseNumber>;
}

impl OrArithError for Option<PreciseNumber> {
  fn or_arith_error(self) -> Result<PreciseNumber> {
    self.ok_or(ErrorCode::ArithmeticError.into())
  }
}

#[program]
pub mod spl_bonding_presale {
  use super::*;
  pub fn initialize_token_bonding_presale_v0(ctx: Context<InitializeTokenBondingPresaleV0>, args: InitializeTokenBondingPresaleV0Args) -> ProgramResult {
    let presale = &mut ctx.accounts.presale;
    presale.token_bonding = ctx.accounts.token_bonding.key();
    presale.presale_token_bonding = ctx.accounts.presale_token_bonding.key();
    presale.post_token_bonding = ctx.accounts.post_token_bonding.key();
    presale.bump_seed = args.bump_seed;
    presale.token_bonding_authority_bump_seed = args.token_bonding_authority_bump_seed;
    presale.post_launch_token_bonding_authority = args.post_launch_token_bonding_authority;
    presale.go_live_unix_time = ctx.accounts.token_bonding.go_live_unix_time;
    presale.base_storage_authority_bump_seed = args.base_storage_authority_bump_seed;
    presale.launched = false;

    Ok(())
  }

  pub fn launch_v0(ctx: Context<LaunchV0>, args: LaunchV0Args) -> ProgramResult {
    let token_bonding = &mut ctx.accounts.token_bonding;

    ctx.accounts.presale.launched = true;

    // Reopen bonding curve
    msg!("Reopening bonding curve");
    spl_token_bonding::cpi::update_token_bonding_v0(CpiContext::new_with_signer(
      ctx.accounts.spl_token_bonding_program.to_account_info().clone(), 
      spl_token_bonding::cpi::accounts::UpdateTokenBondingV0 {
        token_bonding: token_bonding.to_account_info().clone(),
        authority: ctx.accounts.token_bonding_authority.to_account_info().clone(),
        base_mint: ctx.accounts.base_mint.to_account_info().clone(),
        target_mint: ctx.accounts.target_mint.to_account_info().clone(),
        buy_base_royalties: ctx.accounts.buy_base_royalties.to_account_info().clone(),
        buy_target_royalties: ctx.accounts.buy_target_royalties.to_account_info().clone(),
        sell_base_royalties: ctx.accounts.sell_base_royalties.to_account_info().clone(),
        sell_target_royalties: ctx.accounts.sell_target_royalties.to_account_info().clone()
      },
      &[
        &[b"token-bonding-authority", ctx.accounts.presale.key().as_ref(), &[ctx.accounts.presale.token_bonding_authority_bump_seed]]
      ]
    ), spl_token_bonding::arg::UpdateTokenBondingV0Args {
      token_bonding_authority: Some(ctx.accounts.presale.post_launch_token_bonding_authority),
      buy_base_royalty_percentage: token_bonding.buy_base_royalty_percentage,
      buy_target_royalty_percentage: token_bonding.buy_target_royalty_percentage,
      sell_base_royalty_percentage: token_bonding.sell_base_royalty_percentage,
      sell_target_royalty_percentage: token_bonding.sell_target_royalty_percentage,
      buy_frozen: false
    })?;

    let base_storage_seeds: &[&[&[u8]]] = &[
      &[b"base-storage-authority", ctx.accounts.presale.to_account_info().key.as_ref(), &[ctx.accounts.presale.base_storage_authority_bump_seed]]
    ];
    msg!("Dumping {} presale base storage into bonding curve", ctx.accounts.presale_base_storage.amount);
    let presale_base_storage = ctx.accounts.presale_base_storage.to_account_info();
    spl_token_bonding::cpi::buy_v0(CpiContext::new_with_signer(
      ctx.accounts.spl_token_bonding_program.to_account_info().clone(),
      spl_token_bonding::cpi::accounts::BuyV0 {
        token_bonding: token_bonding.to_account_info().clone(),
        curve: ctx.accounts.curve.to_account_info().clone(),
        base_mint: ctx.accounts.base_mint.to_account_info().clone(),
        target_mint: ctx.accounts.target_mint.to_account_info().clone(),
        target_mint_authority: ctx.accounts.target_mint_authority.to_account_info().clone(),
        base_storage: ctx.accounts.base_storage.to_account_info().clone(),
        buy_base_royalties: ctx.accounts.buy_base_royalties.to_account_info().clone(),
        buy_target_royalties: ctx.accounts.buy_target_royalties.to_account_info().clone(),
        source: presale_base_storage.clone(),
        source_authority: ctx.accounts.presale_base_storage_authority.to_account_info().clone(),
        destination: ctx.accounts.post_base_storage.to_account_info().clone(),
        token_program: ctx.accounts.token_program.to_account_info().clone(),
        clock: ctx.accounts.clock.to_account_info().clone()
      }, 
      base_storage_seeds
    ), spl_token_bonding::arg::BuyV0Args {
      buy_with_base: Some(spl_token_bonding::arg::BuyWithBaseV0Args {
        base_amount: ctx.accounts.presale_base_storage.amount,
        minimum_target_amount: 1
      }),
      buy_target_amount: None,
      root_estimates: args.root_estimates
    })?;

    msg!("Cleaning up presale token bonding");
    spl_token_bonding::cpi::close_token_bonding_v0(CpiContext::new_with_signer(
      ctx.accounts.spl_token_bonding_program.to_account_info().clone(),
      spl_token_bonding::cpi::accounts::CloseTokenBondingV0 {
        refund: ctx.accounts.refund.to_account_info().clone(),
        token_bonding: ctx.accounts.presale_token_bonding.to_account_info().clone(),
        authority: ctx.accounts.presale_token_bonding_authority.to_account_info().clone(),
        target_mint: ctx.accounts.presale_target_mint.to_account_info().clone(),
        target_mint_authority: ctx.accounts.presale_target_mint_authority.to_account_info().clone(),
        base_storage: ctx.accounts.presale_base_storage.to_account_info().clone(),
        base_storage_authority: ctx.accounts.presale_base_storage_authority.to_account_info().clone(),
        token_program: ctx.accounts.token_program.to_account_info().clone()
      },
      &[
        &[b"token-bonding-authority", ctx.accounts.presale.key().as_ref(), &[ctx.accounts.presale.token_bonding_authority_bump_seed]]
      ]
    ))?;

    Ok(())
  }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeTokenBondingPresaleV0Args {
  pub post_launch_token_bonding_authority: Pubkey,
  pub bump_seed: u8,
  pub token_bonding_authority_bump_seed: u8,
  pub base_storage_authority_bump_seed: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct LaunchV0Args {
  pub root_estimates: Option<[u128; 2]> // Required when computing an exponential, sent to buy_v0 of the bonding curve. Greatly assists with newtonian root approximation, saving compute units
}

fn verify_authority(authority: Option<Pubkey>, seeds: &[&[u8]], bump: u8) -> Result<bool> {
  let (key, canonical_bump) = Pubkey::find_program_address(seeds, &self::id());

  if bump != canonical_bump {
    return Err(ErrorCode::InvalidBump.into());
  }

  if key != authority.ok_or::<ProgramError>(ErrorCode::NoAuthority.into())? {
    return Err(ErrorCode::InvalidAuthority.into());
  }

  Ok(true)
}

#[derive(Accounts)]
#[instruction(args: InitializeTokenBondingPresaleV0Args)]
pub struct InitializeTokenBondingPresaleV0<'info> {
  #[account(mut)]
  payer: Signer<'info>,
  #[account(
    init,
    space = 212,
    seeds = [b"presale", token_bonding.key().as_ref()],
    bump = args.bump_seed,
    payer = payer
  )]
  presale: Box<Account<'info, TokenBondingPresaleV0>>,
  #[account(
    constraint = verify_authority(token_bonding.authority, &[b"token-bonding-authority", presale.key().as_ref()], args.token_bonding_authority_bump_seed)?,
    constraint = !token_bonding.sell_frozen,
    constraint = token_bonding.buy_frozen,
    constraint = token_bonding.go_live_unix_time > clock.unix_timestamp
  )]
  token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(
    constraint = post_token_bonding.go_live_unix_time == presale_token_bonding.freeze_buy_unix_time.ok_or::<ProgramError>(ErrorCode::PresaleMustFreeze.into())?,
    constraint = verify_authority(presale_token_bonding.authority, &[b"token-bonding-authority", presale.key().as_ref()], args.token_bonding_authority_bump_seed)?,
    constraint = token_bonding.base_mint == presale_token_bonding.base_mint,
    constraint = presale_token_bonding.target_mint == post_token_bonding.target_mint,
    has_one = base_storage
  )]
  presale_token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(
    constraint = verify_authority(Some(base_storage.owner), &[b"base-storage-authority", presale.key().as_ref()], args.base_storage_authority_bump_seed)?
  )]
  base_storage: Box<Account<'info, TokenAccount>>,
  #[account(
    constraint = verify_authority(post_token_bonding.authority, &[b"token-bonding-authority", presale.key().as_ref()], args.token_bonding_authority_bump_seed)?,
    constraint = token_bonding.target_mint == post_token_bonding.base_mint,
    constraint = post_token_bonding.go_live_unix_time == token_bonding.go_live_unix_time,
  )]
  post_token_bonding: Box<Account<'info, TokenBondingV0>>,

  system_program: Program<'info, System>,
  rent: Sysvar<'info, Rent>,
  clock: Sysvar<'info, Clock>
}

#[derive(Accounts)]
pub struct LaunchV0<'info> {
  #[account(mut)]
  refund: AccountInfo<'info>, // Will receive the reclaimed SOL
  #[account(
    mut,
    has_one = token_bonding,
    has_one = presale_token_bonding,
    has_one = post_token_bonding
  )]
  pub presale: Box<Account<'info, TokenBondingPresaleV0>>,
  #[account(
    mut,
    constraint = presale_token_bonding.base_storage == presale_base_storage.key()
  )]
  pub presale_token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(
    constraint = presale_token_bonding_authority.key() == presale_token_bonding.authority.unwrap()
  )]
  pub presale_token_bonding_authority: AccountInfo<'info>,
  #[account(mut, constraint = presale_base_storage.owner == presale_base_storage_authority.key())]
  pub presale_base_storage: Box<Account<'info, TokenAccount>>,
  pub presale_base_storage_authority: AccountInfo<'info>,
  #[account(mut)]
  pub presale_target_mint: Box<Account<'info, Mint>>,
  pub presale_target_mint_authority: AccountInfo<'info>,
  #[account(
    constraint = post_token_bonding.base_storage == post_base_storage.key()
  )]
  pub post_token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(mut)]
  pub post_base_storage: Box<Account<'info, TokenAccount>>,
  #[account(
    mut,
    has_one = base_mint,
    has_one = target_mint,
    has_one = buy_base_royalties,
    has_one = buy_target_royalties,
    has_one = curve,
    has_one = base_storage
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub token_bonding_authority: AccountInfo<'info>,
  #[account(
    constraint = sell_base_royalties.key() == token_bonding.sell_base_royalties
  )]
  pub sell_base_royalties: Box<Account<'info, TokenAccount>>,
  #[account(
    constraint = sell_target_royalties.key() == token_bonding.sell_target_royalties
  )]
  pub sell_target_royalties: Box<Account<'info, TokenAccount>>,
  pub curve: Box<Account<'info, CurveV0>>,
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub target_mint: Box<Account<'info, Mint>>,
  pub target_mint_authority: AccountInfo<'info>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut,
    constraint = buy_base_royalties.key() == token_bonding.buy_base_royalties
  )]
  pub buy_base_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut,
    constraint = buy_target_royalties.key() == token_bonding.buy_target_royalties
  )]
  pub buy_target_royalties: Box<Account<'info, TokenAccount>>,
  #[account(address = spl_token_bonding::id())]
  pub spl_token_bonding_program: AccountInfo<'info>,
  pub token_program: Program<'info, Token>,
  pub clock: Sysvar<'info, Clock>,
}

#[account]
#[derive(Default)]
pub struct TokenBondingPresaleV0 {
  pub token_bonding: Pubkey,
  pub presale_token_bonding: Pubkey,
  pub post_token_bonding: Pubkey,
  pub post_launch_token_bonding_authority: Pubkey,

  pub go_live_unix_time: i64,

  pub launched: bool,

  pub bump_seed: u8,
  pub token_bonding_authority_bump_seed: u8,
  pub base_storage_authority_bump_seed: u8,
}

#[error]
pub enum ErrorCode {
    #[msg("Provided account does not have an authority")]
    NoAuthority,

    #[msg("The bump provided did not match the canonical bump")]
    InvalidBump,

    #[msg("Invalid authority passed")]
    InvalidAuthority,

    #[msg("Presale token bonding must freeze when token bonding opens")]
    PresaleMustFreeze,

    #[msg("Error in precise number arithmetic")]
    ArithmeticError,
}
