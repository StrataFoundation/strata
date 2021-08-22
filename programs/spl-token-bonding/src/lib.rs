use anchor_lang::{prelude::*, solana_program::system_program};
use anchor_spl::token::{self, InitializeAccount, TokenAccount, Mint, Transfer, MintTo};
use anchor_lang::solana_program::program_pack::Pack;
use std::convert::TryInto;

pub mod precise_number;
pub mod uint;
pub mod ln;
use ln::NaturalLog;
use precise_number::{PreciseNumber, InnerUint, one};

static TARGET_MINT_AUTHORITY_PREFIX: &str = "target-authority";

#[program]
pub mod spl_token_bonding {
    use anchor_lang::{Key};
    use anchor_spl::token::Burn;

    use super::*;

    pub fn create_log_curve_v0(
      ctx: Context<InitializeLogCurveV0>,
      args: InitializeLogCurveV0Args
    ) -> ProgramResult {
      let curve = &mut ctx.accounts.curve;
      curve.curve = Curves::LogCurveV0 {
        g: args.g,
        c: args.c,
        taylor_iterations: args.taylor_iterations
      };

      Ok(())
    }

    pub fn initialize_token_bonding_v0(
      ctx: Context<InitializeTokenBondingV0>,
      args: InitializeTokenBondingV0Args
    ) -> ProgramResult {
      let bonding = &mut ctx.accounts.token_bonding;

      let mint_pda = Pubkey::create_program_address(
        &[
          TARGET_MINT_AUTHORITY_PREFIX.as_bytes(), 
          ctx.accounts.target_mint.to_account_info().key.as_ref(),
          &[args.target_mint_authority_bump_seed]
        ], 
        ctx.program_id
      )?;
      let target_mint = &ctx.accounts.target_mint;
      if mint_pda != target_mint.mint_authority.ok_or::<ProgramError>(ErrorCode::NoMintAuthority.into())?
       || (target_mint.freeze_authority.is_some() && mint_pda != target_mint.freeze_authority.ok_or::<ProgramError>(ErrorCode::NoMintAuthority.into())?)  {
        return Err(ErrorCode::InvalidMintAuthority.into());
      }

      bonding.base_mint = *ctx.accounts.base_mint.to_account_info().key;
      bonding.target_mint = *ctx.accounts.target_mint.to_account_info().key;
      bonding.authority = args.token_bonding_authority;
      bonding.base_storage = *ctx.accounts.base_storage.to_account_info().key;
      bonding.base_royalties = *ctx.accounts.base_royalties.to_account_info().key;
      bonding.target_royalties = *ctx.accounts.target_royalties.to_account_info().key;
      bonding.base_royalty_percentage = args.base_royalty_percentage;
      bonding.target_royalty_percentage = args.target_royalty_percentage;
      bonding.curve = *ctx.accounts.curve.to_account_info().key;
      bonding.mint_cap = args.mint_cap;
      bonding.buy_frozen = args.buy_frozen;
      bonding.bump_seed = args.bump_seed;
      bonding.base_storage_bump_seed = args.base_storage_bump_seed;
      bonding.base_storage_authority_bump_seed = args.base_storage_authority_bump_seed;
      bonding.target_mint_authority_bump_seed = args.target_mint_authority_bump_seed;

      Ok(())
    }

    pub fn update_token_bonding_v0(
      ctx: Context<UpdateTokenBondingV0>,
      args: UpdateTokenBondingV0Args
    ) -> ProgramResult {
      let bonding = &mut ctx.accounts.token_bonding;

      bonding.base_royalty_percentage = args.base_royalty_percentage;
      bonding.target_royalty_percentage = args.target_royalty_percentage;
      bonding.authority = args.token_bonding_authority;
      bonding.buy_frozen = args.buy_frozen;

      Ok(())
    }

    pub fn buy_v0(ctx: Context<BuyV0>, args: BuyV0Args) -> ProgramResult {
      let token_bonding = &ctx.accounts.token_bonding;
      let base_mint = &ctx.accounts.base_mint;
      let target_mint = &ctx.accounts.target_mint;
      let amount = args.target_amount;
      let curve = &ctx.accounts.curve;
      let amount_prec = precise_supply_amt(amount, target_mint);
      let target_supply = precise_supply(target_mint);
      
      let price_prec = curve.curve.price(
        &target_supply,
        &amount_prec,
      ).unwrap();

      let base_royalties_percent = get_percent(token_bonding.base_royalty_percentage)?;
      let target_royalties_percent = get_percent(token_bonding.base_royalty_percentage)?;

      let target_royalties_prec = target_royalties_percent.checked_mul(&amount_prec).or_arith_error()?;
      let base_royalties_prec = base_royalties_percent.checked_mul(&price_prec).or_arith_error()?;
      let total_price_prec = price_prec.checked_add(&base_royalties_prec).or_arith_error()?;
      let total_price = to_lamports(
        &total_price_prec,
        base_mint,
      );
      let price = to_lamports(
        &price_prec,
        base_mint,
      );
      let base_royalties = to_lamports(
        &base_royalties_prec,
        base_mint
      );
      let target_royalties = to_lamports(
        &target_royalties_prec,
        target_mint,
      );

      msg!("Total price is {}, with {} to base royalties and {} to target royalties", total_price, base_royalties, target_royalties);
      if total_price > args.maximum_price {
        return Err(ErrorCode::PriceToHigh.into());
      }

      let token_program = ctx.accounts.token_program.to_account_info();
      let source = ctx.accounts.source.to_account_info();
      let base_storage_account = ctx.accounts.base_storage.to_account_info();
      let base_royalties_account = ctx.accounts.base_royalties.to_account_info();
      let target_royalties_account = ctx.accounts.target_royalties.to_account_info();
      let target_mint_authority = ctx.accounts.target_mint_authority.to_account_info();
      let source_authority = ctx.accounts.source_authority.to_account_info();
      let mint_signer_seeds: &[&[&[u8]]] = &[&[
        TARGET_MINT_AUTHORITY_PREFIX.as_bytes(), 
        ctx.accounts.target_mint.to_account_info().key.as_ref(),
        &[token_bonding.target_mint_authority_bump_seed]
      ]];

      msg!("Paying out {} base royalties", base_royalties);
      token::transfer(CpiContext::new(
        token_program.clone(), 
Transfer {
          from: source.clone(),
          to: base_royalties_account.clone(),
          authority: source_authority.clone()
        }
      ), base_royalties)?;

      msg!("Paying out {} to base storage", price);
      token::transfer(CpiContext::new(
        token_program.clone(), 
Transfer {
          from: source.clone(),
          to: base_storage_account.clone(),
          authority: source_authority.clone()
        }
      ), price)?;

      msg!("Minting {} to target royalties", target_royalties);
      token::mint_to(
        CpiContext::new_with_signer(
          token_program.clone(), 
  MintTo {
            mint: target_mint.to_account_info().clone(),
            to: target_royalties_account.clone(),
            authority: target_mint_authority.clone()
          },
          mint_signer_seeds
        ),
        target_royalties
      )?;

      msg!("Minting {} to destination", amount - target_royalties);
      token::mint_to(
        CpiContext::new_with_signer(
          token_program.clone(), 
  MintTo {
            mint: target_mint.to_account_info().clone(),
            to: target_royalties_account.clone(),
            authority: target_mint_authority.clone()
          },
          mint_signer_seeds
        ),
        amount - target_royalties
      )?;
      
      Ok(())
    }

    pub fn sell_v0(ctx: Context<SellV0>, args: SellV0Args) -> ProgramResult {
      let token_bonding = &ctx.accounts.token_bonding;
      let base_mint = &ctx.accounts.base_mint;
      let target_mint = &ctx.accounts.target_mint;
      let amount = args.target_amount;
      let curve = &ctx.accounts.curve;
      let amount_prec = precise_supply_amt(amount, target_mint);
      let target_supply = precise_supply(target_mint);

      let reclaimed_prec = curve.curve.price(
        &target_supply.checked_sub(&amount_prec).ok_or::<ProgramError>(ErrorCode::MintSupplyToLow.into())?,
        &amount_prec,
      ).unwrap();

      let reclaimed = to_lamports(
        &reclaimed_prec,
        base_mint,
      );

      msg!("Total reclaimed is {}", reclaimed);
      if reclaimed < args.minimum_price {
        return Err(ErrorCode::PriceToLow.into());
      }

      let token_program = ctx.accounts.token_program.to_account_info();
      let source = ctx.accounts.source.to_account_info();
      let base_storage_account = ctx.accounts.base_storage.to_account_info();
      let base_storage_authority = ctx.accounts.base_storage_authority.to_account_info();
      let source_authority = ctx.accounts.source_authority.to_account_info();
      let destination = ctx.accounts.destination.to_account_info();

      msg!("Burning {}", reclaimed);
      token::burn(CpiContext::new(token_program.clone(), Burn {
        mint: target_mint.to_account_info().clone(),
        to: source.clone(),
        authority: source_authority.clone()
      }), amount)?;

      msg!("Paying out {} to base storage", reclaimed);
      token::transfer(CpiContext::new_with_signer(
        token_program.clone(), 
Transfer {
          from: base_storage_account.clone(),
          to: destination.clone(),
          authority: base_storage_authority.clone()
        },
        &[
          &[b"storage-authority", base_storage_account.key.as_ref(), &[token_bonding.base_storage_authority_bump_seed]]
        ]
      ), reclaimed)?;

      Ok(())
    }
}

trait OrArithError {
  fn or_arith_error(self) -> Result<PreciseNumber>;
}

impl OrArithError for Option<PreciseNumber> {
  fn or_arith_error(self) -> Result<PreciseNumber> {
    self.ok_or(ErrorCode::ArithmeticError.into())
  }
}

fn get_percent(percent: u32) -> Result<PreciseNumber> {
  let max_u32 = PreciseNumber::new(u32::MAX as u128).or_arith_error()?;
  let percent_prec = PreciseNumber::new(percent as u128).or_arith_error()?;

  Ok(percent_prec.checked_div(&max_u32).or_arith_error()?)
}

fn precise_supply(mint: &CpiAccount<Mint>) -> PreciseNumber {
  precise_supply_amt(mint.supply, mint)
}

fn precise_supply_amt(amt: u64, mint: &CpiAccount<Mint>) -> PreciseNumber {
  PreciseNumber {
      value: InnerUint::from((amt as u128) * 10_u128.pow(12_u32 - mint.decimals as u32))
  }
}

fn to_lamports(amt: &PreciseNumber, mint: &CpiAccount<Mint>) -> u64 {
  amt.checked_mul(
      &PreciseNumber::new(10_u128).unwrap().checked_pow(mint.decimals as u128).unwrap()
  ).unwrap().ceiling().unwrap().to_imprecise().unwrap() as u64
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeLogCurveV0Args {
  g: u128,
  c: u128,
  taylor_iterations: u16
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeTokenBondingV0Args {
  /// Percentage of purchases that go to the founder
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub base_royalty_percentage: u32,
  pub target_royalty_percentage: u32,
  // The maximum number of target tokens that can be minted.
  pub mint_cap: Option<u64>,
  pub token_bonding_authority: Option<Pubkey>,
  pub buy_frozen: bool,
  pub bump_seed: u8,
  pub base_storage_bump_seed: u8,
  pub base_storage_authority_bump_seed: u8,
  pub target_mint_authority_bump_seed: u8
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateTokenBondingV0Args {
  /// Percentage of purchases that go to the founder
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub token_bonding_authority: Option<Pubkey>,
  pub base_royalty_percentage: u32,
  pub target_royalty_percentage: u32,
  pub buy_frozen: bool
}

pub fn get_curve_seed(args: &InitializeLogCurveV0Args) -> Vec<u8> {
  let mut buffer: Vec<u8> = Vec::new();
  args.serialize(&mut buffer).unwrap();

  buffer
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BuyV0Args {
  // Number to purchase. This is including the decimal value. So 1 is the lowest possible fraction of a coin
  // Note that you will receive this amount, less target_royalties.
  // Target royalties are taken out of the total purchased amount. Base royalties inflate the purchase price.
  pub target_amount: u64,
  // Maximum price to pay for this amount. Allows users to account and fail-fast for slippage.
  pub maximum_price: u64
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SellV0Args {
  // Number to sell. This is including the decimal value. So 1 is the lowest possible fraction of a coin
  pub target_amount: u64,
  // Minimum price to receive for this amount. Allows users to account and fail-fast for slippage.
  pub minimum_price: u64
}

#[derive(Accounts)]
#[instruction(args: InitializeLogCurveV0Args)]
pub struct InitializeLogCurveV0<'info> {
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    init
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
    constraint = target_mint.supply == 0,
    constraint = target_mint.is_initialized,
    constraint = *target_mint.to_account_info().owner == *base_mint.to_account_info().owner
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

  #[account(
    constraint = target_royalties.mint == *target_mint.to_account_info().key,
    constraint = *target_royalties.to_account_info().owner == token::ID,
  )] // Will init for you, since target mint doesn't exist yet.
  pub target_royalties: CpiAccount<'info, TokenAccount>,

  #[account(address = *base_mint.to_account_info().owner)]
  pub token_program: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: UpdateTokenBondingV0Args)]
pub struct UpdateTokenBondingV0<'info> {
  #[account(
    mut,
    constraint = token_bonding.authority.ok_or::<ProgramError>(ErrorCode::NoAuthority.into())? == *authority.to_account_info().key
  )]
  pub token_bonding: ProgramAccount<'info, TokenBondingV0>,
  #[account(signer)]
  pub authority: AccountInfo<'info>
}


#[derive(Accounts)]
pub struct BuyV0<'info> {
  #[account(
    has_one = target_mint,
    has_one = base_storage,
    has_one = base_royalties,
    has_one = target_royalties,
    has_one = curve
  )]
  pub token_bonding: ProgramAccount<'info, TokenBondingV0>,
  #[account()]
  pub curve: ProgramAccount<'info, CurveV0>,
  #[account()]
  pub base_mint: CpiAccount<'info, Mint>,
  #[account(mut)]
  pub target_mint: CpiAccount<'info, Mint>,
  #[account(
    seeds = [
      TARGET_MINT_AUTHORITY_PREFIX.as_bytes(), 
      token_bonding.target_mint.as_ref()
    ],
    bump = token_bonding.target_mint_authority_bump_seed
  )]
  pub target_mint_authority: AccountInfo<'info>,
  #[account(mut)]
  pub base_storage: CpiAccount<'info, TokenAccount>,
  #[account(mut)]
  pub base_royalties: CpiAccount<'info, TokenAccount>,
  #[account(mut)]
  pub target_royalties: CpiAccount<'info, TokenAccount>,

  #[account(mut)]
  pub source: CpiAccount<'info, TokenAccount>,
  #[account(signer)]
  pub source_authority: AccountInfo<'info>,
  #[account(mut)]
  pub destination: CpiAccount<'info, TokenAccount>,
  #[account(address = *base_mint.to_account_info().owner)]
  pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct SellV0<'info> {
  #[account(
    has_one = target_mint,
    has_one = base_storage,
    has_one = curve
  )]
  pub token_bonding: ProgramAccount<'info, TokenBondingV0>,
  #[account()]
  pub curve: ProgramAccount<'info, CurveV0>,
  #[account()]
  pub base_mint: CpiAccount<'info, Mint>,
  #[account(mut)]
  pub target_mint: CpiAccount<'info, Mint>,
  #[account(mut)]
  pub base_storage: CpiAccount<'info, TokenAccount>,

  #[account(
    seeds = [b"storage-authority", base_storage.to_account_info().key.as_ref()],
    bump = token_bonding.base_storage_authority_bump_seed
  )]
  pub base_storage_authority: AccountInfo<'info>,

  #[account(mut)]
  pub source: CpiAccount<'info, TokenAccount>,
  #[account(signer)]
  pub source_authority: AccountInfo<'info>,

  #[account(mut)]
  pub destination: CpiAccount<'info, TokenAccount>,

  #[account(address = *base_mint.to_account_info().owner)]
  pub token_program: AccountInfo<'info>,
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
  curve: Curves
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
  
  // Needed to derive the PDA of this instance
  pub bump_seed: u8,
  pub base_storage_bump_seed: u8,
  pub base_storage_authority_bump_seed: u8,
  pub target_mint_authority_bump_seed: u8
}


#[error]
pub enum ErrorCode {
  #[msg("Target mint must have an authority")]
  NoMintAuthority,

  #[msg("Target mint must have an authority that is a pda of this program")]
  InvalidMintAuthority,

  #[msg("Token bonding does not have an authority")]
  NoAuthority,

  #[msg("Error in precise number arithmetic")]
  ArithmeticError,

  #[msg("Buy price was higher than the maximum buy price. Try increasing max_price or slippage configuration")]
  PriceToHigh,

  #[msg("Sell price was lower than the minimum sell price. Try decreasing min_price or increasing slippage configuration")]
  PriceToLow,

  #[msg("Cannot sell more than the target mint currently has in supply")]
  MintSupplyToLow
}