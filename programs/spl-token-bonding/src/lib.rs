use anchor_lang::{prelude::*, solana_program::system_program};
use anchor_spl::token::{self, InitializeAccount, TokenAccount, Mint, Transfer, MintTo};
use anchor_lang::solana_program::program_pack::Pack;
use std::convert::TryInto;

pub mod precise_number;
pub mod uint;
pub mod ln;
use ln::NaturalLog;
use precise_number::{PreciseNumber, InnerUint, one};

#[program]
pub mod spl_token_bonding {
    use anchor_lang::{Key};

    use super::*;

    pub fn create_log_curve_v0(
      ctx: Context<InitializeLogCurveV0>,
      args: InitializeLogCurveV0Args
    ) -> ProgramResult {
      let curve = &mut ctx.accounts.curve;
      curve.curve = Curves::LogCurveV0 {
        g: args.g,
        c: args.g,
        taylor_iterations: args.taylor_iterations
      };
      curve.bump_seed = args.bump_seed;

      Ok(())
    }

    pub fn initialize_token_bonding_v0(
      ctx: Context<InitializeTokenBondingV0>,
      args: InitializeTokenBondingV0Args
    ) -> ProgramResult {
      let bonding = &mut ctx.accounts.token_bonding;

      bonding.base_mint = *ctx.accounts.base_mint.to_account_info().key;
      bonding.target_mint = *ctx.accounts.target_mint.to_account_info().key;
      bonding.authority = args.token_bonding_authority;
      bonding.base_storage = *ctx.accounts.base_storage.to_account_info().key;
      bonding.base_royalties = *ctx.accounts.base_royalties.to_account_info().key;
      bonding.target_royalties = *ctx.accounts.target_royalties.to_account_info().key;

      token::initialize_account(CpiContext::new(ctx.accounts.token_program.to_account_info().clone(), InitializeAccount { 
        account: ctx.accounts.target_royalties.to_account_info().clone(), 
        mint: ctx.accounts.base_mint.to_account_info().clone(), 
        authority: ctx.accounts.target_royalty_owner.to_account_info().clone(), 
        rent: ctx.accounts.rent.to_account_info().clone()
      }))?;

      bonding.base_royalty_percentage = args.base_royalty_percentage;
      bonding.target_royalty_percentage = args.target_royalty_percentage;
      bonding.curve = *ctx.accounts.curve.to_account_info().key;
      bonding.mint_cap = args.mint_cap;
      bonding.buy_frozen = false;
      bonding.sell_frozen = false;
      bonding.bump_seed = args.bump_seed;
      bonding.target_mint_bump_seed = args.target_mint_bump_seed;
      bonding.base_storage_bump_seed = args.base_storage_bump_seed;
      bonding.base_storage_authority_bump_seed = args.base_storage_authority_bump_seed;

      Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeLogCurveV0Args {
  g: u128,
  c: u128,
  taylor_iterations: u16,
  bump_seed: u8
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeTokenBondingV0Args {
  /// Percentage of purchases that go to the founder
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub base_royalty_percentage: u32,
  pub target_royalty_percentage: u32,
  // The maximum number of target tokens that can be minted.
  mint_cap: Option<u64>,
  token_bonding_authority: Option<Pubkey>,
  bump_seed: u8,
  target_mint_bump_seed: u8,
  base_storage_bump_seed: u8,
  base_storage_authority_bump_seed: u8,
}

pub fn get_curve_seed(args: &InitializeLogCurveV0Args) -> Vec<u8> {
  let mut buffer: Vec<u8> = Vec::new();
  args.serialize(&mut buffer).unwrap();

  buffer
}

#[derive(Accounts)]
#[instruction(args: InitializeLogCurveV0Args)]
pub struct InitializeLogCurveV0<'info> {
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    init,
    seeds = [b"log-curve", &get_curve_seed(&args) as &[u8]],
    bump = args.bump_seed,
    payer = payer,
    space = 1000
  )]
  pub curve: ProgramAccount<'info, CurveV0>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: InitializeTokenBondingV0Args)]
pub struct InitializeTokenBondingV0<'info> {
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  pub curve: ProgramAccount<'info, CurveV0>,
  #[account(
    init,
    seeds = [b"token-bonding", target_mint.to_account_info().key.as_ref()],
    bump = args.bump_seed,
    payer = payer,
    space = 1000
  )]
  pub token_bonding: ProgramAccount<'info, TokenBondingV0>,
  #[account(
    constraint = *base_mint.to_account_info().owner == token::ID
  )]
  pub base_mint: CpiAccount<'info, Mint>,
  #[account(
    init,
    seeds = [b"target-mint", token_bonding.to_account_info().key.as_ref()],
    payer = payer,
    space = spl_token::state::Mint::LEN,
    bump = args.target_mint_bump_seed,
    owner = token::ID
  )]
  pub target_mint: CpiAccount<'info, Mint>,
  #[account(
    init,
    seeds = [b"base-storage", token_bonding.to_account_info().key.as_ref()],
    space = TokenAccount::LEN,
    token = base_mint,
    authority = base_storage_authority,
    payer = payer,
    bump = args.base_storage_bump_seed
  )]
  pub base_storage: CpiAccount<'info, TokenAccount>,
  #[account(
    seeds = [b"storage-authority", base_storage.to_account_info().key.as_ref()],
    bump = args.base_storage_authority_bump_seed
  )]
  pub base_storage_authority: AccountInfo<'info>,

  #[account(
    constraint = base_royalties.mint == *base_mint.to_account_info().key,
    constraint = *base_royalties.to_account_info().owner == *base_mint.to_account_info().owner
  )]
  pub base_royalties: CpiAccount<'info, TokenAccount>,

  #[account(init, constraint = *target_royalties.to_account_info().owner == token::ID)] // Will init for you, since target mint doesn't exist yet.
  pub target_royalties: AccountInfo<'info>,
  #[account()]
  pub target_royalty_owner: AccountInfo<'info>,

  #[account(address = *base_mint.to_account_info().owner)]
  pub token_program: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Curves {
  /// c * log(1 + (g * x))
  LogCurveV0 {
    // Fixed precision decimal with 12 decimal places. So 1 would be 1_000_000_000_000. 1.5 is 1_500_000_000_000
    g: u128,
    // Fixed precision decimal with 12 decimal places. So 1 would be 1_000_000_000_000. 1.5 is 1_500_000_000_000
    c: u128,
    taylor_iterations: u16,
  }
}

impl Default for Curves {
    fn default() -> Self {
        Curves::LogCurveV0 {
          g: 0,
          c: 0,
          taylor_iterations: 0,
        }
    }
}

#[account]
#[derive(Default)]
pub struct CurveV0 {
  curve: Curves,
  bump_seed: u8
}

pub trait Curve {
  fn price(&self, target_supply: &PreciseNumber, amount: &PreciseNumber) -> Option<PreciseNumber>;
}

/// https://www.wolframalpha.com/input/?i=c+*+log%281+%2B+g+*+x%29+dx
pub fn log_curve(c: &PreciseNumber, g: &PreciseNumber, a: &PreciseNumber, b: &PreciseNumber, log_num_iterations: u16) -> Option<PreciseNumber> {
  let general = |x: &PreciseNumber| {
    let inv_g = ONE_PREC.checked_div(g)?;
    let inside = ONE_PREC.checked_add(&g.checked_mul(&x)?)?;
    let log = inside.ln(log_num_iterations)?;
    let log_mult = log.checked_mul(&inv_g.checked_add(&x)?)?;
    Some(c.checked_mul(&log_mult.checked_sub(&x)?)?)
  };

  general(b)?.checked_sub(&general(a)?)
}

static ONE_PREC: PreciseNumber =  PreciseNumber { value: one() };

impl Curve for Curves {
  fn price(&self, target_supply: &PreciseNumber, amount: &PreciseNumber) -> Option<PreciseNumber> {
    match self {
      Self::LogCurveV0 { g, c, taylor_iterations } => {
        let g_prec = PreciseNumber { value: InnerUint::from(*g) };
        log_curve(
            &PreciseNumber { value: InnerUint::from(*c) },
            &g_prec, 
            target_supply, 
            &target_supply.checked_add(&amount)?,
            *taylor_iterations
        )
      }
    }
  }
}


#[account]
#[derive(Default)]
pub struct TokenBondingV0 {
  pub base_mint: Pubkey,
  pub target_mint: Pubkey,
  pub authority: Option<Pubkey>,
  pub base_storage: Pubkey,
  pub base_royalties: Pubkey,
  pub target_royalties: Pubkey,
  /// Percentage of purchases that go to royalties
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub base_royalty_percentage: u32,
  pub target_royalty_percentage: u32,
  /// The bonding curve to use 
  pub curve: Pubkey,
  pub mint_cap: Option<u64>,
  pub buy_frozen: bool,
  pub sell_frozen: bool,
  
  // Needed to derive the PDA of this instance
  pub bump_seed: u8,
  pub target_mint_bump_seed: u8,
  pub base_storage_bump_seed: u8,
  pub base_storage_authority_bump_seed: u8,
}
