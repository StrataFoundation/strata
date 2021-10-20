use anchor_lang::{prelude::*, solana_program::system_program};
use anchor_spl::token::{self, InitializeAccount, TokenAccount, Mint, Transfer, MintTo};
use spl_token::state::AccountState;

pub mod precise_number;
pub mod uint;
pub mod ln;
use ln::NaturalLog;
use precise_number::{PreciseNumber, InnerUint, one};

static TARGET_MINT_AUTHORITY_PREFIX: &str = "target-authority";

declare_id!("TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN");

#[program]
pub mod spl_token_bonding {
    use std::borrow::BorrowMut;

    use anchor_lang::{Key};
    use anchor_spl::token::Burn;

    use super::*;

    pub fn initialize_sol_storage_v0(
      ctx: Context<InitializeSolStorageV0>,
      bump: u8
    ) -> ProgramResult {
      Ok(())
    }

    pub fn create_curve_v0(
      ctx: Context<InitializeCurveV0>,
      args: Curves
    ) -> ProgramResult {
      let curve = &mut ctx.accounts.curve;
      curve.curve = args;

      Ok(())
    }

    pub fn initialize_token_bonding_v0(
      ctx: Context<InitializeTokenBondingV0>,
      args: InitializeTokenBondingV0Args
    ) -> ProgramResult {
      let (mint_pda, target_mint_authority_bump_seed) = Pubkey::find_program_address(
        &[
          TARGET_MINT_AUTHORITY_PREFIX.as_bytes(), 
          ctx.accounts.target_mint.to_account_info().key.as_ref()
        ], 
        ctx.program_id
      );
      let target_mint = &ctx.accounts.target_mint;
      if mint_pda != target_mint.mint_authority.ok_or::<ProgramError>(ErrorCode::NoMintAuthority.into())?
       || (target_mint.freeze_authority.is_some() && mint_pda != target_mint.freeze_authority.ok_or::<ProgramError>(ErrorCode::NoMintAuthority.into())?)
       || target_mint_authority_bump_seed != args.target_mint_authority_bump_seed  {
         msg!("Auth {} {}", target_mint.mint_authority.unwrap(), mint_pda);
        return Err(ErrorCode::InvalidMintAuthority.into());
      }



      if args.base_storage_authority.is_some() {
        if ctx.accounts.base_storage.mint == spl_token::native_mint::ID {
          let (sol_base_storage_authority, sol_base_storage_authority_bump_seed) = Pubkey::find_program_address(
            &[b"sol-storage-authority"],
            ctx.program_id
          );
          if args.base_storage_authority_bump_seed.unwrap() != sol_base_storage_authority_bump_seed
              || args.base_storage_authority.unwrap() != sol_base_storage_authority {
                return Err(ErrorCode::InvalidBaseStorageAuthority.into())
              }
        } else {
          let (base_storage_authority_pda, base_storage_authority_bump_seed) = Pubkey::find_program_address(
            &[b"storage-authority", ctx.accounts.token_bonding.to_account_info().key.as_ref()], 
            ctx.program_id
          );
          if args.base_storage_authority_bump_seed.unwrap() != base_storage_authority_bump_seed 
              || args.base_storage_authority.unwrap() != base_storage_authority_pda {
            return Err(ErrorCode::InvalidBaseStorageAuthority.into())
          }  
        }
      }

      let bonding = &mut ctx.accounts.token_bonding;
      bonding.base_mint = *ctx.accounts.base_mint.to_account_info().key;
      bonding.target_mint = *ctx.accounts.target_mint.to_account_info().key;
      bonding.authority = args.token_bonding_authority;
      bonding.base_storage = *ctx.accounts.base_storage.to_account_info().key;
      bonding.buy_base_royalties = *ctx.accounts.buy_base_royalties.to_account_info().key;
      bonding.buy_target_royalties = *ctx.accounts.buy_target_royalties.to_account_info().key;
      bonding.sell_base_royalties = *ctx.accounts.sell_base_royalties.to_account_info().key;
      bonding.sell_target_royalties = *ctx.accounts.sell_target_royalties.to_account_info().key;
      bonding.buy_base_royalty_percentage = args.buy_base_royalty_percentage;
      bonding.buy_target_royalty_percentage = args.buy_target_royalty_percentage;
      bonding.sell_base_royalty_percentage = args.sell_base_royalty_percentage;
      bonding.sell_target_royalty_percentage = args.sell_target_royalty_percentage;
      bonding.curve = *ctx.accounts.curve.to_account_info().key;
      bonding.mint_cap = args.mint_cap;
      bonding.purchase_cap = args.purchase_cap;
      bonding.buy_frozen = args.buy_frozen;
      bonding.sell_frozen = args.base_storage_authority.is_none();
      bonding.bump_seed = args.bump_seed;
      bonding.base_storage_authority_bump_seed = args.base_storage_authority_bump_seed;
      bonding.target_mint_authority_bump_seed = args.target_mint_authority_bump_seed;

      Ok(())
    }

    pub fn update_token_bonding_v0(
      ctx: Context<UpdateTokenBondingV0>,
      args: UpdateTokenBondingV0Args
    ) -> ProgramResult {
      let bonding = &mut ctx.accounts.token_bonding;

      bonding.buy_base_royalty_percentage = args.buy_base_royalty_percentage;
      bonding.buy_target_royalty_percentage = args.buy_target_royalty_percentage;
      bonding.sell_base_royalty_percentage = args.sell_base_royalty_percentage;
      bonding.sell_target_royalty_percentage = args.sell_target_royalty_percentage;
      bonding.authority = args.token_bonding_authority;
      bonding.buy_frozen = args.buy_frozen;
      bonding.buy_target_royalties = ctx.accounts.buy_target_royalties.key();
      bonding.buy_base_royalties = ctx.accounts.buy_base_royalties.key();
      bonding.sell_base_royalties = ctx.accounts.sell_base_royalties.key();
      bonding.sell_target_royalties = ctx.accounts.sell_target_royalties.key();

      Ok(())
    }

    pub fn buy_v0(ctx: Context<BuyV0>, args: BuyV0Args) -> ProgramResult {
      let token_bonding = &mut ctx.accounts.token_bonding;
      let base_mint = &ctx.accounts.base_mint;
      let target_mint = &ctx.accounts.target_mint;
      let amount = args.target_amount;
      let curve = &ctx.accounts.curve;
      let amount_prec = precise_supply_amt(amount, target_mint);
      let target_supply = precise_supply(target_mint);

      if token_bonding.buy_frozen {
        return Err(ErrorCode::BuyFrozen.into());
      }

      if token_bonding.mint_cap.is_some() && target_mint.supply + args.target_amount > token_bonding.mint_cap.unwrap() {
        msg!("Mint cap is {} {} {}", token_bonding.mint_cap.unwrap(), target_mint.supply, args.target_amount);
        return Err(ErrorCode::PassedMintCap.into());
      }

      if token_bonding.purchase_cap.is_some() && args.target_amount > token_bonding.purchase_cap.unwrap() {
        return Err(ErrorCode::OverPurchaseCap.into());
      }

      if token_bonding.go_live_unix_time > ctx.accounts.clock.unix_timestamp {
        return Err(ErrorCode::NotLiveYet.into());
      }

      let price_prec = curve.curve.price(
        &target_supply,
        &amount_prec,
      ).unwrap();

      let base_royalties_percent = get_percent(token_bonding.buy_base_royalty_percentage)?;
      let target_royalties_percent = get_percent(token_bonding.buy_target_royalty_percentage)?;

      let target_royalties_prec = target_royalties_percent.checked_mul(&amount_prec).or_arith_error()?;
      let base_royalties_prec = base_royalties_percent.checked_mul(&price_prec).or_arith_error()?;
      let total_price_prec = price_prec.checked_add(&base_royalties_prec).or_arith_error()?;
      let total_price = to_lamports(
        &total_price_prec,
        base_mint,
        true
      );
      let price = to_lamports(
        &price_prec,
        base_mint,
        true
      );
      let base_royalties = to_lamports(
        &base_royalties_prec,
        base_mint,
        true
      );
      let target_royalties = to_lamports(
        &target_royalties_prec,
        target_mint,
        false
      );

      msg!("Total price is {}, with {} to base royalties and {} to target royalties", total_price, base_royalties, target_royalties);
      if total_price > args.maximum_price {
        return Err(ErrorCode::PriceTooHigh.into());
      }

      token_bonding.reserves += total_price;

      let token_program = ctx.accounts.token_program.to_account_info();
      let source = ctx.accounts.source.to_account_info();
      let base_storage_account = ctx.accounts.base_storage.to_account_info();
      let base_royalties_account = ctx.accounts.buy_base_royalties.to_account_info();
      let target_royalties_account = ctx.accounts.buy_target_royalties.to_account_info();
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
            to: ctx.accounts.destination.to_account_info().clone(),
            authority: target_mint_authority.clone()
          },
          mint_signer_seeds
        ),
        amount - target_royalties
      )?;

      Ok(())
    }

    pub fn sell_v0(ctx: Context<SellV0>, args: SellV0Args) -> ProgramResult {
      let token_bonding = &mut ctx.accounts.token_bonding;
      let base_mint = &ctx.accounts.base_mint;
      let target_mint = &ctx.accounts.target_mint;
      let amount = args.target_amount;
      let curve = &ctx.accounts.curve;
      let amount_prec = precise_supply_amt(amount, target_mint);
      let target_supply = precise_supply(target_mint);

      if token_bonding.go_live_unix_time > ctx.accounts.clock.unix_timestamp {
        return Err(ErrorCode::NotLiveYet.into());
      }

      if token_bonding.sell_frozen {
        return Err(ErrorCode::SellDisabled.into());
      }

      let base_royalties_percent = get_percent(token_bonding.sell_base_royalty_percentage)?;
      let target_royalties_percent = get_percent(token_bonding.sell_target_royalty_percentage)?;

      let target_royalties_prec = target_royalties_percent.checked_mul(&amount_prec).or_arith_error()?;
      let amount_minus_royalties_prec = amount_prec.checked_sub(&target_royalties_prec).or_arith_error()?;
      let reclaimed_prec = curve.curve.price(
        &target_supply.checked_sub(&amount_minus_royalties_prec).ok_or::<ProgramError>(ErrorCode::MintSupplyTooLow.into())?,
        &amount_prec,
      ).unwrap();

      let base_royalties_prec = base_royalties_percent.checked_mul(&reclaimed_prec).or_arith_error()?;

      let reclaimed_prec = reclaimed_prec.checked_sub(&base_royalties_prec).or_arith_error()?;
      let reclaimed = to_lamports(
        &reclaimed_prec,
        base_mint,
        true
      );
      let total_reclaimed = to_lamports(
        &reclaimed_prec,
        base_mint,
        true
      );
      let base_royalties = to_lamports(
        &base_royalties_prec,
        base_mint,
        true
      );
      let target_royalties = to_lamports(
        &target_royalties_prec,
        target_mint,
        false
      );

      token_bonding.reserves -= total_reclaimed;

      msg!("Total reclaimed is {}, with {} to base royalties, {} to target royalties", total_reclaimed, base_royalties, target_royalties);
      if reclaimed < args.minimum_price {
        msg!("Err: Minimum price was {}, reclaimed was {}", args.minimum_price, reclaimed);
        return Err(ErrorCode::PriceTooLow.into());
      }

      let token_program = ctx.accounts.token_program.to_account_info();
      let source = ctx.accounts.source.to_account_info();
      let base_storage_account = ctx.accounts.base_storage.to_account_info();
      let base_storage_authority = ctx.accounts.base_storage_authority.to_account_info();
      let source_authority = ctx.accounts.source_authority.to_account_info();
      let destination = ctx.accounts.destination.to_account_info();

      let auth_str: &[u8];
      let bump = &[token_bonding.base_storage_authority_bump_seed.unwrap()];
      let bonding_ref = token_bonding.to_account_info().key.as_ref();
      let storage_authority_seeds: Vec<&[u8]>;
      
      if ctx.accounts.base_mint.key() == spl_token::native_mint::ID {
        auth_str = b"sol-storage-authority";
        storage_authority_seeds = vec![auth_str, bump];
      } else {
        auth_str = b"storage-authority";
        storage_authority_seeds = vec![auth_str, bonding_ref, bump];
      };

      msg!("Burning {}", amount);
      token::burn(CpiContext::new(token_program.clone(), Burn {
        mint: target_mint.to_account_info().clone(),
        to: source.clone(),
        authority: source_authority.clone()
      }), amount)?;

      msg!("Paying out {} to target royalties", target_royalties);
      token::transfer(CpiContext::new(
        token_program.clone(), 
Transfer {
          from: source.clone(),
          to: ctx.accounts.sell_target_royalties.to_account_info().clone(),
          authority: source_authority.clone()
        }
      ), target_royalties)?;

      msg!("Paying out {} from base storage", reclaimed);
      token::transfer(CpiContext::new_with_signer(
        token_program.clone(), 
Transfer {
          from: base_storage_account.clone(),
          to: destination.clone(),
          authority: base_storage_authority.clone()
        },
        &[
          &storage_authority_seeds
        ]
      ), reclaimed)?;

      msg!("Paying out {} from base storage to base royalties", base_royalties);
      token::transfer(CpiContext::new_with_signer(
        token_program.clone(), 
Transfer {
          from: base_storage_account.clone(),
          to: ctx.accounts.sell_base_royalties.to_account_info().clone(),
          authority: base_storage_authority.clone()
        },
        &[
          &storage_authority_seeds
        ]
      ), base_royalties)?;

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

fn precise_supply(mint: &Account<Mint>) -> PreciseNumber {
  precise_supply_amt(mint.supply, mint)
}

fn precise_supply_amt(amt: u64, mint: &Account<Mint>) -> PreciseNumber {
  PreciseNumber {
      value: InnerUint::from((amt as u128) * 10_u128.pow(12_u32 - mint.decimals as u32))
  }
}

fn to_lamports(amt: &PreciseNumber, mint: &Account<Mint>, ceil: bool) -> u64 {
  let pre_round = amt.checked_mul(
      &PreciseNumber::new(10_u128).unwrap().checked_pow(mint.decimals as u128).unwrap()
  ).unwrap();
  let post_round = if (ceil) {
    pre_round.ceiling().unwrap()
  } else {
    pre_round.floor().unwrap()
  };
  
  post_round.to_imprecise().unwrap() as u64
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeTokenBondingV0Args {
  /// Percentage of purchases that go to the founder
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub buy_base_royalty_percentage: u32,
  pub buy_target_royalty_percentage: u32,
  pub sell_base_royalty_percentage: u32,
  pub sell_target_royalty_percentage: u32,
  pub go_live_unix_time: i64,
  // The maximum number of target tokens that can be minted.
  pub mint_cap: Option<u64>,
  // The maximum target tokens per purchase
  pub purchase_cap: Option<u64>,
  pub token_bonding_authority: Option<Pubkey>,
  pub base_storage_authority: Option<Pubkey>,
  pub buy_frozen: bool,
  pub bump_seed: u8,
  pub target_mint_authority_bump_seed: u8,
  pub base_storage_authority_bump_seed: Option<u8>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateTokenBondingV0Args {
  pub token_bonding_authority: Option<Pubkey>,
  /// Percentage of purchases that go to the founder
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub buy_base_royalty_percentage: u32,
  pub buy_target_royalty_percentage: u32,
  pub sell_base_royalty_percentage: u32,
  pub sell_target_royalty_percentage: u32,
  pub buy_frozen: bool,
}

pub fn get_curve_seed(args: &CurveV0) -> Vec<u8> {
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
#[instruction(bump: u8)]
pub struct InitializeSolStorageV0<'info> {
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    init,
    seeds = ["sol-storage".as_bytes()],
    bump = bump,
    token::mint = native_mint,
    token::authority = sol_storage_authority,
    payer = payer
  )]
  pub sol_storage: Box<Account<'info, TokenAccount>>,
  #[account(
    address = Pubkey::find_program_address(&[b"sol-storage-authority"], &id()).0
  )]
  pub sol_storage_authority: AccountInfo<'info>,
  #[account(address = spl_token::native_mint::ID)]
  pub native_mint: Account<'info, Mint>,
  #[account(address = token::ID)]
  pub token_program: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: Curves)]
pub struct InitializeCurveV0<'info> {
  #[account(mut, signer)]
  pub payer: AccountInfo<'info>,
  #[account(
    zero
  )]
  pub curve: Account<'info, CurveV0>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
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
    seeds = [b"token-bonding", target_mint.to_account_info().key.as_ref()],
    bump = args.bump_seed,
    payer = payer,
    space = 512
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(
    constraint = *base_mint.to_account_info().owner == token::ID
  )]
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = target_mint.supply == 0, // TODO: Calculate supply vs supply of base account
    constraint = target_mint.is_initialized,
    constraint = *target_mint.to_account_info().owner == *base_mint.to_account_info().owner
  )]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = base_storage.mint != spl_token::native_mint::ID || base_storage.key() == Pubkey::find_program_address(&["sol-storage".as_bytes()], &id()).0,
    constraint = base_storage.mint == *base_mint.to_account_info().key,
    constraint = args.base_storage_authority.is_none() || base_storage.owner == args.base_storage_authority.unwrap(),
    constraint = base_storage.delegate.is_none(),
    constraint = base_storage.close_authority.is_none(),
    constraint = base_storage.state == AccountState::Initialized
  )]
  pub base_storage: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = buy_base_royalties.mint == *base_mint.to_account_info().key
  )]
  pub buy_base_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = buy_target_royalties.mint == *target_mint.to_account_info().key
  )] // Will init for you, since target mint doesn't exist yet.
  pub buy_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = sell_base_royalties.mint == *base_mint.to_account_info().key
  )]
  pub sell_base_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = sell_target_royalties.mint == *target_mint.to_account_info().key
  )] // Will init for you, since target mint doesn't exist yet.
  pub sell_target_royalties: Box<Account<'info, TokenAccount>>,

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
    constraint = token_bonding.authority.ok_or::<ProgramError>(ErrorCode::NoAuthority.into())? == *authority.to_account_info().key,
    has_one = base_mint,
    has_one = target_mint
  )]
  pub token_bonding: Account<'info, TokenBondingV0>,
  #[account(signer)]
  pub authority: AccountInfo<'info>,

  #[account(
    constraint = *base_mint.to_account_info().owner == token::ID
  )]
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = target_mint.is_initialized,
    constraint = *target_mint.to_account_info().owner == *base_mint.to_account_info().owner
  )]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = buy_base_royalties.mint == *base_mint.to_account_info().key
  )]
  pub buy_base_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = buy_target_royalties.mint == *target_mint.to_account_info().key
  )] // Will init for you, since target mint doesn't exist yet.
  pub buy_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = sell_base_royalties.mint == *base_mint.to_account_info().key
  )]
  pub sell_base_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = sell_target_royalties.mint == *target_mint.to_account_info().key
  )] // Will init for you, since target mint doesn't exist yet.
  pub sell_target_royalties: Box<Account<'info, TokenAccount>>,
}


#[derive(Accounts)]
pub struct BuyV0<'info> {
  #[account(
    mut,
    has_one = target_mint,
    has_one = base_storage,
    has_one = buy_base_royalties,
    has_one = buy_target_royalties,
    has_one = curve
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account()]
  pub curve: Box<Account<'info, CurveV0>>,
  #[account()]
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(
    seeds = [
      TARGET_MINT_AUTHORITY_PREFIX.as_bytes(), 
      token_bonding.target_mint.as_ref()
    ],
    bump = token_bonding.target_mint_authority_bump_seed
  )]
  pub target_mint_authority: AccountInfo<'info>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub buy_base_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub buy_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(mut)]
  pub source: Box<Account<'info, TokenAccount>>,
  #[account(signer)]
  pub source_authority: AccountInfo<'info>,
  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,
  #[account(address = *base_mint.to_account_info().owner)]
  pub token_program: AccountInfo<'info>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct SellV0<'info> {
  #[account(
    mut,
    has_one = target_mint,
    has_one = base_storage,
    has_one = curve
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account()]
  pub curve: Box<Account<'info, CurveV0>>,
  #[account()]
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub sell_base_royalties: Box<Account<'info, TokenAccount>>,
  #[account(mut)]
  pub sell_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account()]
  pub base_storage_authority: AccountInfo<'info>,

  #[account(mut)]
  pub source: Box<Account<'info, TokenAccount>>,
  #[account(signer)]
  pub source_authority: AccountInfo<'info>,

  #[account(mut)]
  pub destination: Box<Account<'info, TokenAccount>>,

  #[account(address = *base_mint.to_account_info().owner)]
  pub token_program: AccountInfo<'info>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Curves {
  // All u128s are fixed precision decimal with 12 decimal places. So 1 would be 1_000_000_000_000. 1.5 is 1_500_000_000_000

  /// c * log(1 + (g * x))
  LogCurveV0 {
    g: u128,
    c: u128,
    taylor_iterations: u16,
  },
  FixedPriceCurveV0 {
    price: u128
  },
  // mx + b
  ConstantProductCurveV0 {
    b: u128,
    m: u128,
  },
  // a*ln(b)(b^x). Adding the ln(b) so the integral doesn't need a logarithm. 
  ExponentialCurveV0 {
    a: u128,
    b: u128
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
      Self::FixedPriceCurveV0 { price } => {
        amount.checked_mul(&PreciseNumber{ value: InnerUint::from(*price) })
      }
      Self::ConstantProductCurveV0 { m, b} => {
        // Integrate from supply to supply + amount -- bx + mx^2/2. 
        // b(supply + amount) + m(supply + amount)^2/2 - (b(supply) + m(supply)^2)/2)
        let m_prec = PreciseNumber { value: InnerUint::from(*m) };
        let b_prec = PreciseNumber { value: InnerUint::from(*b) };
        let supply_plus_amount = target_supply.checked_add(&amount)?;
        let two = PreciseNumber::new(2)?;

        b_prec.checked_mul(&supply_plus_amount)?.checked_add(
          &m_prec.checked_mul(&supply_plus_amount.checked_pow(2)?)?.checked_div(&two)?
        )?.checked_sub(
          &b_prec.checked_mul(&target_supply)?.checked_add(
            &m_prec.checked_mul(&target_supply.checked_pow(2)?)?.checked_div(&two)?
          )?
        )
      }
      Self::ExponentialCurveV0 { a, b } => {
        // Integrate from supply to supply + amount -- ab^x + C
        // a*(b^(supply + amount) - b^(supply)))
        let a_prec = PreciseNumber { value: InnerUint::from(*a) };
        let b_prec = PreciseNumber { value: InnerUint::from(*b) };
        a_prec.checked_mul(
          &b_prec.checked_pow(target_supply.checked_add(&amount)?.to_imprecise()?)?
            .checked_sub(&b_prec.checked_pow(target_supply.to_imprecise()?)?)?
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
  pub buy_base_royalties: Pubkey,
  pub buy_target_royalties: Pubkey,
  pub sell_base_royalties: Pubkey,
  pub sell_target_royalties: Pubkey,
  /// Percentage of purchases that go to royalties
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub buy_base_royalty_percentage: u32,
  pub buy_target_royalty_percentage: u32,
  pub sell_base_royalty_percentage: u32,
  pub sell_target_royalty_percentage: u32,
  /// The bonding curve to use 
  pub curve: Pubkey,
  pub mint_cap: Option<u64>,
  pub purchase_cap: Option<u64>,
  pub go_live_unix_time: i64,
  pub buy_frozen: bool,
  pub sell_frozen: bool,
  pub reserves: u64,
  
  // Needed to derive the PDA of this instance
  pub bump_seed: u8,
  pub base_storage_bump_seed: u8,
  pub target_mint_authority_bump_seed: u8,
  pub base_storage_authority_bump_seed: Option<u8>,
}


#[error]
pub enum ErrorCode {
  #[msg("Target mint must have an authority")]
  NoMintAuthority,

  #[msg("Target mint must have an authority that is a pda of this program")]
  InvalidMintAuthority,

  #[msg("Invalid base storage authority pda or seed did not match canonical seed for base storage authority")]
  InvalidBaseStorageAuthority,

  #[msg("Token bonding does not have an authority")]
  NoAuthority,

  #[msg("Error in precise number arithmetic")]
  ArithmeticError,

  #[msg("Buy price was higher than the maximum buy price. Try increasing max_price or slippage configuration")]
  PriceTooHigh,

  #[msg("Sell price was lower than the minimum sell price. Try decreasing min_price or increasing slippage configuration")]
  PriceTooLow,

  #[msg("Cannot sell more than the target mint currently has in supply")]
  MintSupplyTooLow,

  #[msg("Sell is not enabled on this bonding curve")]
  SellDisabled,

  #[msg("This bonding curve is not live yet")]
  NotLiveYet,

  #[msg("Passed the mint cap")]
  PassedMintCap,

  #[msg("Cannot purchase that many tokens because of purchase cap")]
  OverPurchaseCap,

  #[msg("Buy is frozen on this bonding curve, purchases not allowed")]
  BuyFrozen
}
