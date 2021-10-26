use anchor_lang::{prelude::*, solana_program, solana_program::{system_program, system_instruction, program::{invoke_signed, invoke}}};
use anchor_spl::token::{self, set_authority, SetAuthority, Burn, InitializeAccount, TokenAccount, Mint, Transfer, MintTo};
use spl_token::state::AccountState;

pub mod precise_number;
pub mod uint;
use precise_number::{InnerUint, PreciseNumber, one, zero};
use crate::{uint::U128};

static TARGET_MINT_AUTHORITY_PREFIX: &str = "target-authority";

declare_id!("TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN");

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

#[program]
pub mod spl_token_bonding {
    use std::borrow::BorrowMut;

    use super::*;

    pub fn initialize_sol_storage_v0(
      ctx: Context<InitializeSolStorageV0>,
      args: InitializeSolStorageV0Args
    ) -> ProgramResult {
      let state = &mut ctx.accounts.state;
      state.bump_seed = args.bump_seed;
      state.mint_authority_bump_seed = args.mint_authority_bump_seed;
      state.sol_storage_bump_seed = args.sol_storage_bump_seed;
      state.sol_storage = ctx.accounts.sol_storage.key();
      state.wrapped_sol_mint = ctx.accounts.wrapped_sol_mint.key();

      Ok(())
    }

    pub fn buy_wrapped_sol_v0(
      ctx: Context<BuyWrappedSolV0>,
      args: BuyWrappedSolV0Args
    ) -> ProgramResult {
      invoke(
        &system_instruction::transfer(
          &ctx.accounts.source.key(),
          &ctx.accounts.sol_storage.key(),
          args.amount
        ), 
        &[
          ctx.accounts.source.to_account_info().clone(),
          ctx.accounts.sol_storage.to_account_info().clone(),
          ctx.accounts.system_program.to_account_info().clone(),
        ]
      )?;
      
      token::mint_to(
        CpiContext::new_with_signer(
          ctx.accounts.token_program.clone(), 
          MintTo {
            mint: ctx.accounts.wrapped_sol_mint.to_account_info().clone(),
            to: ctx.accounts.destination.to_account_info().clone(),
            authority: ctx.accounts.mint_authority.to_account_info().clone()
          },
          &[
            &[b"wrapped-sol-authority", &[ctx.accounts.state.mint_authority_bump_seed]]
          ]
        ),
        args.amount
      )?;

      Ok(())
    }

    pub fn sell_wrapped_sol_v0(
      ctx: Context<SellWrappedSolV0>,
      args: SellWrappedSolV0Args
    ) -> ProgramResult {
      let amount = if args.all {
        ctx.accounts.source.amount
      } else {
        args.amount
      };

      invoke_signed(
        &system_instruction::transfer(
          &ctx.accounts.sol_storage.key(),
          &ctx.accounts.destination.key(),
          amount
        ), 
        &[
          ctx.accounts.sol_storage.to_account_info().clone(),
          ctx.accounts.destination.to_account_info().clone(),
          ctx.accounts.system_program.to_account_info().clone(),
        ],
        &[
          &["sol-storage".as_bytes(), &[ctx.accounts.state.sol_storage_bump_seed]]
        ]
      )?;

      token::burn(
        CpiContext::new(
          ctx.accounts.token_program.clone(), 
          Burn {
            mint: ctx.accounts.wrapped_sol_mint.to_account_info().clone(),
            to: ctx.accounts.destination.to_account_info().clone(),
            authority: ctx.accounts.owner.to_account_info().clone()
          }
        ),
        amount
      )?;

      Ok(())
    }

    pub fn create_curve_v0(
      ctx: Context<InitializeCurveV0>,
      args: CreateCurveV0Args
    ) -> ProgramResult {
      let curve = &mut ctx.accounts.curve;
      curve.c = args.c;
      curve.b = args.b;
      curve.curve = args.curve;

      Ok(())
    }

    pub fn initialize_token_bonding_v0(
      ctx: Context<InitializeTokenBondingV0>,
      args: InitializeTokenBondingV0Args
    ) -> ProgramResult {
      if ctx.accounts.base_storage.mint == spl_token::native_mint::ID {
        return Err(ErrorCode::WrappedSolNotAllowed.into())
      }
      let (mint_pda, target_mint_authority_bump_seed) = Pubkey::find_program_address(
        &[
          TARGET_MINT_AUTHORITY_PREFIX.as_bytes(), 
          ctx.accounts.target_mint.key().as_ref()
        ], 
        ctx.program_id
      );
      let target_mint = &ctx.accounts.target_mint;
      if args.base_storage_authority.is_some() {
        let (base_storage_authority_pda, base_storage_authority_bump_seed) = Pubkey::find_program_address(
          &[b"storage-authority", ctx.accounts.token_bonding.key().as_ref()], 
          ctx.program_id
        );
        if args.base_storage_authority_bump_seed.unwrap() != base_storage_authority_bump_seed 
            || args.base_storage_authority.unwrap() != base_storage_authority_pda {
          return Err(ErrorCode::InvalidBaseStorageAuthority.into())
        }  
      }

      let bonding = &mut ctx.accounts.token_bonding;
      bonding.go_live_unix_time = args.go_live_unix_time;
      bonding.freeze_buy_unix_time = args.freeze_buy_unix_time;
      bonding.base_mint = ctx.accounts.base_mint.key();
      bonding.base_mint = ctx.accounts.base_mint.key();
      bonding.target_mint = ctx.accounts.target_mint.key();
      bonding.authority = args.token_bonding_authority;
      bonding.base_storage = ctx.accounts.base_storage.key();
      bonding.buy_base_royalties = ctx.accounts.buy_base_royalties.key();
      bonding.buy_target_royalties = ctx.accounts.buy_target_royalties.key();
      bonding.sell_base_royalties = ctx.accounts.sell_base_royalties.key();
      bonding.sell_target_royalties = ctx.accounts.sell_target_royalties.key();
      bonding.buy_base_royalty_percentage = args.buy_base_royalty_percentage;
      bonding.buy_target_royalty_percentage = args.buy_target_royalty_percentage;
      bonding.sell_base_royalty_percentage = args.sell_base_royalty_percentage;
      bonding.sell_target_royalty_percentage = args.sell_target_royalty_percentage;
      bonding.curve = ctx.accounts.curve.key();
      bonding.mint_cap = args.mint_cap;
      bonding.purchase_cap = args.purchase_cap;
      // We need to own the mint authority if this bonding curve supports buying.
      // This can be a sell only bonding curve
      bonding.buy_frozen = args.buy_frozen
        || mint_pda != target_mint.mint_authority.ok_or::<ProgramError>(ErrorCode::NoMintAuthority.into())?
        || (target_mint.freeze_authority.is_some() && mint_pda != target_mint.freeze_authority.ok_or::<ProgramError>(ErrorCode::NoMintAuthority.into())?)
        || target_mint_authority_bump_seed != args.target_mint_authority_bump_seed;
      bonding.sell_frozen = args.base_storage_authority.is_none();
      bonding.bump_seed = args.bump_seed;
      bonding.base_storage_authority_bump_seed = args.base_storage_authority_bump_seed;
      bonding.target_mint_authority_bump_seed = args.target_mint_authority_bump_seed;

      Ok(())
    }

    pub fn close_token_bonding_v0(
      ctx: Context<CloseTokenBondingV0>
    ) -> ProgramResult {
      let token_bonding = &mut ctx.accounts.token_bonding;
      if token_bonding.base_storage_authority_bump_seed.is_some() {
        let auth_str: &[u8] = b"storage-authority";
        let bump = &[token_bonding.base_storage_authority_bump_seed.unwrap()];
        let bonding_ref = token_bonding.to_account_info().key.as_ref();
        let storage_authority_seeds: Vec<&[u8]> = vec![auth_str, bonding_ref, bump];
  
        let base_storage_authority = Pubkey::create_program_address(&storage_authority_seeds, &ctx.program_id)?;
        if ctx.accounts.base_storage.owner == base_storage_authority {
          close_token_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.clone(),
            CloseTokenAccount {
                from: ctx.accounts.base_storage.to_account_info().clone(),
                to: ctx.accounts.refund.to_account_info().clone(),
                authority: ctx
                    .accounts
                    .base_storage_authority
                    .to_account_info()
                    .clone(),
            },
            &[&storage_authority_seeds],
          ))?;
        }
      }

      msg!("Setting mint authority to none");
      set_authority(
        CpiContext::new_with_signer(
          ctx.accounts.token_program.to_account_info().clone(), 
          SetAuthority {
            current_authority: ctx.accounts.target_mint_authority.to_account_info().clone(),
            account_or_mint: ctx.accounts.target_mint.to_account_info().clone()
          },
          &[
            &[
              TARGET_MINT_AUTHORITY_PREFIX.as_bytes(), 
              ctx.accounts.target_mint.key().as_ref(),
              &[ctx.accounts.token_bonding.target_mint_authority_bump_seed]
            ]
          ]
        ),
        spl_token::instruction::AuthorityType::MintTokens,
        None,
      )?;

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
      let curve = &ctx.accounts.curve;
      let base_amount = precise_supply_amt(ctx.accounts.base_storage.amount, base_mint);
      let target_supply = precise_supply(target_mint);

      msg!("Current reserves {} and supply {}", ctx.accounts.base_storage.amount, ctx.accounts.target_mint.supply);

      if token_bonding.go_live_unix_time > ctx.accounts.clock.unix_timestamp {
        return Err(ErrorCode::NotLiveYet.into());
      }

      if token_bonding.buy_frozen {
        return Err(ErrorCode::BuyFrozen.into());
      }

      if token_bonding.freeze_buy_unix_time.is_some() && token_bonding.freeze_buy_unix_time.unwrap() < ctx.accounts.clock.unix_timestamp {
        return Err(ErrorCode::BuyFrozen.into());
      }

      let base_royalties_percent = get_percent(token_bonding.buy_base_royalty_percentage)?;
      let target_royalties_percent = get_percent(token_bonding.buy_target_royalty_percentage)?;

      let price: u64;
      let total_amount: u64;
      let base_royalties: u64;
      let target_royalties: u64;
      if args.buy_target_amount.is_some() {
        let buy_target_amount = args.buy_target_amount.unwrap();

        total_amount = buy_target_amount.target_amount;
        let amount_prec = precise_supply_amt(total_amount, target_mint);
        let price_prec = curve.price(
          &base_amount,
          &target_supply,
          &amount_prec,
          false,
          args.root_estimates
        ).or_arith_error()?;
        price = to_mint_amount(
          &price_prec,
          base_mint,
          true
        );
        let base_royalties_prec = base_royalties_percent.checked_mul(&price_prec).or_arith_error()?;

        let target_royalties_prec = target_royalties_percent.checked_mul(&amount_prec).or_arith_error()?;
        base_royalties = to_mint_amount(
          &base_royalties_prec,
          base_mint,
          true
        );
        target_royalties = to_mint_amount(
          &target_royalties_prec,
          target_mint,
          false
        );

        if price + base_royalties > buy_target_amount.maximum_price {
          msg!("Price too high for max price {}", buy_target_amount.maximum_price);
          return Err(ErrorCode::PriceTooHigh.into());
        }
      } else {
        let buy_with_base = args.buy_with_base.unwrap();
        let total_price = buy_with_base.base_amount;
        let total_price_prec = precise_supply_amt(total_price, base_mint);
        let base_royalties_prec = base_royalties_percent.checked_mul(&total_price_prec).or_arith_error()?;
        let price_prec = total_price_prec.checked_sub(&base_royalties_prec).or_arith_error()?;

        let amount_prec = curve.expected_target_amount(
          &base_amount,
          &target_supply,
          &total_price_prec,
          args.root_estimates
        ).or_arith_error()?;

        total_amount = to_mint_amount(
          &amount_prec,
          target_mint,
          false
        );

        price = to_mint_amount(
          &price_prec,
          base_mint,
          true
        );

        let target_royalties_prec = target_royalties_percent.checked_mul(&amount_prec).or_arith_error()?;
        base_royalties = to_mint_amount(
          &base_royalties_prec,
          base_mint,
          true
        );
        target_royalties = to_mint_amount(
          &target_royalties_prec,
          target_mint,
          false
        );

        if total_amount - target_royalties < buy_with_base.minimum_target_amount {
          msg!("Tokens less than minimum tokens {}", buy_with_base.minimum_target_amount);
          return Err(ErrorCode::PriceTooHigh.into());
        }
      }

      if token_bonding.mint_cap.is_some() && target_mint.supply + total_amount > token_bonding.mint_cap.unwrap() {
        msg!("Mint cap is {} {} {}", token_bonding.mint_cap.unwrap(), target_mint.supply, total_amount);
        return Err(ErrorCode::PassedMintCap.into());
      }

      if token_bonding.purchase_cap.is_some() && total_amount > token_bonding.purchase_cap.unwrap() {
        return Err(ErrorCode::OverPurchaseCap.into());
      }

      msg!("Total price is {}, with {} to base royalties and {} to target royalties", price + base_royalties, base_royalties, target_royalties);
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

      msg!("Minting {} to destination", total_amount - target_royalties);
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
        total_amount - target_royalties
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
      let base_amount = precise_supply_amt(ctx.accounts.base_storage.amount, base_mint);
      let target_supply = precise_supply(target_mint);
      msg!("Current reserves {} and supply {}", ctx.accounts.base_storage.amount, ctx.accounts.target_mint.supply);

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
      let reclaimed_prec = curve.price(
        &base_amount,
        &target_supply,
        &amount_minus_royalties_prec,
        true,
        args.root_estimates
      ).or_arith_error()?;

      let base_royalties_prec = base_royalties_percent.checked_mul(&reclaimed_prec).or_arith_error()?;

      let reclaimed_prec = reclaimed_prec.checked_sub(&base_royalties_prec).or_arith_error()?;
      let reclaimed = to_mint_amount(
        &reclaimed_prec,
        base_mint,
        true
      );
      let total_reclaimed = to_mint_amount(
        &reclaimed_prec,
        base_mint,
        true
      );
      let base_royalties = to_mint_amount(
        &base_royalties_prec,
        base_mint,
        true
      );
      let target_royalties = to_mint_amount(
        &target_royalties_prec,
        target_mint,
        false
      );

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

      let auth_str: &[u8] = b"storage-authority";
      let bump = &[token_bonding.base_storage_authority_bump_seed.unwrap()];
      let bonding_ref = token_bonding.to_account_info().key.as_ref();
      let storage_authority_seeds: Vec<&[u8]> = vec![auth_str, bonding_ref, bump];

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

      msg!("Paying out {} from base storage, {}", reclaimed, ctx.accounts.base_storage.amount);
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

pub fn get_percent(percent: u32) -> Result<PreciseNumber> {
  let max_u32 = PreciseNumber::new(u32::MAX as u128).or_arith_error()?;
  let percent_prec = PreciseNumber::new(percent as u128).or_arith_error()?;

  Ok(percent_prec.checked_div(&max_u32).or_arith_error()?)
}

pub fn precise_supply(mint: &Account<Mint>) -> PreciseNumber {
  precise_supply_amt(mint.supply, mint)
}

fn get_pow_10(decimals: u8) -> PreciseNumber {
  match decimals {
    0 => PreciseNumber::new(0),
    1 => PreciseNumber::new(10),
    2 => PreciseNumber::new(100),
    3 => PreciseNumber::new(1000),
    4 => PreciseNumber::new(10000),
    5 => PreciseNumber::new(100000),
    6 => PreciseNumber::new(1000000),
    7 => PreciseNumber::new(10000000),
    8 => PreciseNumber::new(100000000),
    9 => PreciseNumber::new(1000000000),
    10 => PreciseNumber::new(10000000000),
    11 => PreciseNumber::new(100000000000),
    12 => PreciseNumber::new(1000000000000),
    _ => unreachable!()
  }.unwrap()
}

pub fn precise_supply_amt(amt: u64, mint: &Account<Mint>) -> PreciseNumber {
  PreciseNumber {
      value: InnerUint::from(amt as u128)
  }.checked_mul(&get_pow_10(12_u8 - mint.decimals)).unwrap()
}

pub fn to_mint_amount(amt: &PreciseNumber, mint: &Account<Mint>, ceil: bool) -> u64 {
  // Lookup is faster than a checked_pow
  let pow_10 = get_pow_10(mint.decimals);

  let pre_round = amt.checked_mul(
    &pow_10
  ).unwrap();
  let post_round = if ceil {
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
  pub freeze_buy_unix_time: Option<i64>, // Cut this bonding curve off at some time
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
pub struct BuyWithBaseV0Args {
  pub base_amount: u64,
  pub minimum_target_amount: u64
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BuyTargetAmountV0Args {
  // Number to purchase. This is including the decimal value. So 1 is the lowest possible fraction of a coin
  // Note that you will receive this amount, less target_royalties.
  // Target royalties are taken out of the total purchased amount. Base royalties inflate the purchase price.
  pub target_amount: u64,
  // Maximum price to pay for this amount. Allows users to account and fail-fast for slippage.
  pub maximum_price: u64
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BuyV0Args {
  pub buy_with_base: Option<BuyWithBaseV0Args>,
  pub buy_target_amount: Option<BuyTargetAmountV0Args>,
  pub root_estimates: Option<[u128; 2]> // Required when computing an exponential. Greatly assists with newtonian root approximation, saving compute units
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SellV0Args {
  // Number to sell. This is including the decimal value. So 1 is the lowest possible fraction of a coin
  pub target_amount: u64,
  // Minimum price to receive for this amount. Allows users to account and fail-fast for slippage.
  pub minimum_price: u64,
  pub root_estimates: Option<[u128; 2]> // Required when computing an exponential. Greatly assists with newtonian root approximation, saving compute units
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeSolStorageV0Args {
  pub mint_authority_bump_seed: u8,
  pub sol_storage_bump_seed: u8,
  pub bump_seed: u8
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct BuyWrappedSolV0Args {
  amount: u64
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SellWrappedSolV0Args {
  amount: u64,
  all: bool // Optional flag to just sell all of it.
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
  #[account(address = token::ID)]
  pub token_program: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: BuyWrappedSolV0Args)]
pub struct BuyWrappedSolV0<'info> {
  #[account(
    has_one = sol_storage,
    has_one = wrapped_sol_mint
  )]
  pub state: Account<'info, ProgramStateV0>,
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
  pub destination: Account<'info, TokenAccount>,
  #[account(address = spl_token::ID)]
  pub token_program: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(args: SellWrappedSolV0Args)]
pub struct SellWrappedSolV0<'info> {
  #[account(
    has_one = sol_storage,
    has_one = wrapped_sol_mint
  )]
  pub state: Account<'info, ProgramStateV0>,
  #[account(mut)]
  pub wrapped_sol_mint: Account<'info, Mint>,
  #[account(mut)]
  pub sol_storage: AccountInfo<'info>,
  #[account(
    mut,
    has_one = owner,
    constraint = source.mint == wrapped_sol_mint.key()
  )]
  pub source: Account<'info, TokenAccount>,
  pub owner: Signer<'info>,
  #[account(
    mut
  )]
  pub destination: AccountInfo<'info>,
  #[account(address = spl_token::ID)]
  pub token_program: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
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
    seeds = [b"token-bonding", base_mint.key().as_ref(), target_mint.key().as_ref()],
    bump = args.bump_seed,
    payer = payer,
    space = 512
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = target_mint.is_initialized
  )]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = base_storage.mint == base_mint.key(),
    constraint = args.base_storage_authority.is_none() || base_storage.owner == args.base_storage_authority.unwrap(),
    constraint = base_storage.delegate.is_none(),
    constraint = base_storage.close_authority.is_none(),
    constraint = base_storage.state == AccountState::Initialized
  )]
  pub base_storage: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = buy_base_royalties.mint == base_mint.key()
  )]
  pub buy_base_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = buy_target_royalties.mint == target_mint.key()
  )] // Will init for you, since target mint doesn't exist yet.
  pub buy_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = sell_base_royalties.mint == base_mint.key()
  )]
  pub sell_base_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = sell_target_royalties.mint == target_mint.key()
  )] // Will init for you, since target mint doesn't exist yet.
  pub sell_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(address = spl_token::ID)]
  pub token_program: AccountInfo<'info>,
  #[account(address = system_program::ID)]
  pub system_program: AccountInfo<'info>,
  pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CloseTokenBondingV0<'info> {
  #[account(mut)]
  refund: AccountInfo<'info>, // Will receive the reclaimed SOL
  #[account(
    mut,
    close = refund,
    constraint = token_bonding.authority.ok_or::<ProgramError>(ErrorCode::NoAuthority.into())? == authority.key(),
    has_one = target_mint,
    has_one = base_storage
  )]
  pub token_bonding: Account<'info, TokenBondingV0>,
  #[account(
    signer,
    // Bonding can be closed by the authority if 
    //   1. Target supply is empty or
    //   2. Sell is frozen
    constraint = token_bonding.sell_frozen || target_mint.supply == 0
  )]
  pub authority: AccountInfo<'info>,

  #[account(
    mut,
    constraint = target_mint.mint_authority.unwrap() == target_mint_authority.key(),
  )]
  pub target_mint: Box<Account<'info, Mint>>,
  pub target_mint_authority: AccountInfo<'info>,
  #[account(constraint = base_storage.owner == base_storage_authority.key())]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  pub base_storage_authority: AccountInfo<'info>,
  #[account(address = spl_token::ID)]
  pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(args: UpdateTokenBondingV0Args)]
pub struct UpdateTokenBondingV0<'info> {
  #[account(
    mut,
    constraint = token_bonding.authority.ok_or::<ProgramError>(ErrorCode::NoAuthority.into())? == authority.key(),
    has_one = base_mint,
    has_one = target_mint
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
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
    constraint = buy_base_royalties.mint == base_mint.key()
  )]
  pub buy_base_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = buy_target_royalties.mint == target_mint.key()
  )] // Will init for you, since target mint doesn't exist yet.
  pub buy_target_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = sell_base_royalties.mint == base_mint.key()
  )]
  pub sell_base_royalties: Box<Account<'info, TokenAccount>>,

  #[account(
    constraint = sell_target_royalties.mint == target_mint.key()
  )] // Will init for you, since target mint doesn't exist yet.
  pub sell_target_royalties: Box<Account<'info, TokenAccount>>,
}


#[derive(Accounts)]
pub struct BuyV0<'info> {
  #[account(
    has_one = base_mint,
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
  #[account(address = spl_token::ID)]
  pub token_program: AccountInfo<'info>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct SellV0<'info> {
  #[account(
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

  #[account(address = spl_token::ID)]
  pub token_program: AccountInfo<'info>,
  pub clock: Sysvar<'info, Clock>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Curves {
  // All u128s are fixed precision decimal with 12 decimal places. So 1 would be 1_000_000_000_000. 1.5 is 1_500_000_000_000

  // c(x^(pow/frac)) + b.
  // Constant product = pow = 1, frac = 1, b = 0
  // Fixed price = pow = 0, frac = 1, c = 0, b = price
  ExponentialCurveV0 {
    pow: u64,
    frac: u64
  }
}

impl Default for Curves {
    fn default() -> Self {
        Curves::ExponentialCurveV0 {
          pow: 1_000_000_000_000, // 1
          frac: 1_000_000_000_000, // 1
        }
    }
}

#[account]
#[derive(Default)]
pub struct ProgramStateV0 {
  wrapped_sol_mint: Pubkey,
  sol_storage: Pubkey,
  mint_authority_bump_seed: u8,
  sol_storage_bump_seed: u8,
  bump_seed: u8
}

#[account]
#[derive(Default)]
pub struct CurveV0 {
  c: u128, // Constant multiplied by the curve formula. Used to set initial price, but gets cancelled out as more is injected into the reserves
  b: u128, // Constant added to the curve formula. Used to set initial price, but gets cancelled out as more is injected into the reserves
  curve: Curves
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct CreateCurveV0Args {
  c: u128, // Constant multiplied by the curve formula. Used to set initial price, but gets cancelled out as more is injected into the reserves
  b: u128, // Constant added to the curve formula. Used to set initial price, but gets cancelled out as more is injected into the reserves
  curve: Curves
}

pub trait Curve {
  fn price(&self, base_amount: &PreciseNumber, target_supply: &PreciseNumber, amount: &PreciseNumber, sell: bool, root_estimates: Option<[u128; 2]>) -> Option<PreciseNumber>;
  fn expected_target_amount(&self, base_amount: &PreciseNumber, target_supply: &PreciseNumber, reserve_change: &PreciseNumber, root_estimates: Option<[u128; 2]>) -> Option<PreciseNumber>;
}

pub static ONE_PREC: PreciseNumber =  PreciseNumber { value: one() };
pub static ZERO_PREC: PreciseNumber =  PreciseNumber { value: zero() };

impl Curve for CurveV0 {
  fn expected_target_amount(&self, base_amount: &PreciseNumber, target_supply: &PreciseNumber, reserve_change: &PreciseNumber, root_estimates: Option<[u128; 2]>) -> Option<PreciseNumber> {
    let b_prec = PreciseNumber { value: InnerUint::from(self.b) };
    let c_prec = PreciseNumber { value: InnerUint::from(self.c) };
    let guess1 = PreciseNumber { value: InnerUint::from(root_estimates.unwrap()[0]) };
    let guess2 = PreciseNumber { value: InnerUint::from(root_estimates.unwrap()[1]) };
    
    if base_amount.eq(&ZERO_PREC) || target_supply.eq(&ZERO_PREC) {
      match self.curve {
        // b dS + (c dS^(1 + pow/frac))/(1 + pow/frac)
        Curves::ExponentialCurveV0 { pow, frac } => {
          if self.b == 0 && self.c != 0 {
            /*
             * (((1 + k) dR)/c)^(1/(1 + k))
             */
            let pow_prec = PreciseNumber::new(pow as u128)?;
            let frac_prec = PreciseNumber::new(frac as u128)?;
            let one_plus_k =  &ONE_PREC.checked_add(&pow_prec.checked_div(&frac_prec)?)?;
            one_plus_k.checked_mul(&reserve_change)?.checked_div(&c_prec)?.pow_frac_approximation(frac, frac + pow, guess1)
          } else if pow == 0 {
            reserve_change.checked_div(&b_prec)
          } else {
            None // This math is too hard, have not implemented yet.
          }
        }
      }
    } else {
      match self.curve {
        Curves::ExponentialCurveV0 { pow, frac } => {
          let one_plus_k_numerator = frac.checked_add(pow)?;
  
          /*
            dS = -S + ((S^(1 + k) (R + dR))/R)^(1/(1 + k))
          */
          target_supply.pow_frac_approximation(one_plus_k_numerator, frac, guess1)?
                        .checked_mul(
                          &base_amount.checked_add(&reserve_change)?
                        )?.checked_div(
                          &base_amount
                        )?
                        .pow_frac_approximation(frac, frac + pow, guess2)
        }
      }
    }
  }

  fn price(&self, base_amount: &PreciseNumber, target_supply: &PreciseNumber, amount: &PreciseNumber, sell: bool, root_estimates: Option<[u128; 2]>) -> Option<PreciseNumber> {
    let b_prec = PreciseNumber { value: InnerUint::from(self.b) };
    let c_prec = PreciseNumber { value: InnerUint::from(self.c) };
    let guess1 = PreciseNumber { value: InnerUint::from(root_estimates.unwrap()[0]) };
    let guess2 = PreciseNumber { value: InnerUint::from(root_estimates.unwrap()[1]) };

    if base_amount.eq(&ZERO_PREC) || target_supply.eq(&ZERO_PREC) {
      match self.curve {
        // b dS + (c dS^(1 + pow/frac))/(1 + pow/frac)
        Curves::ExponentialCurveV0 { pow, frac } => {
          let one_plus_k_numerator = frac.checked_add(pow)?;
          let pow_prec = PreciseNumber::new(pow as u128)?;
          let frac_prec = PreciseNumber::new(frac as u128)?;
          b_prec.checked_mul(&amount)?.checked_add(
            &c_prec.checked_mul(
              &amount.pow_frac_approximation(one_plus_k_numerator, frac, guess1)?
            )?.checked_div(
              &ONE_PREC.checked_add(&pow_prec.checked_div(&frac_prec)?)?
            )?
          )
        }
      }
    } else {
      match self.curve {
        /*
          (R / S^(1 + k)) ((S + dS)^(1 + k) - S^(1 + k))
        */
        Curves::ExponentialCurveV0 { pow, frac } => {
          let one_plus_k_numerator = frac.checked_add(pow)?;
          let s_plus_ds = if sell {
            target_supply.checked_sub(&amount)?
          } else {
            target_supply.checked_add(&amount)?
          };

          let s_k1 = &target_supply.pow_frac_approximation(one_plus_k_numerator, frac, guess1)?;
          let s_plus_ds_k1 = s_plus_ds.pow_frac_approximation(one_plus_k_numerator, frac, guess2)?;

          // PreciseNumbers cannot be negative. If we're selling, S + dS is less than S.
          // Swap the two around. This will invert the sine of this function, but since sell = true they are expecting a positive number
          let right_paren_value = if sell {
            s_k1.checked_sub(&s_plus_ds_k1)?
          } else {
            s_plus_ds_k1.checked_sub(&s_k1)?
          };

          base_amount.checked_div(s_k1)?.checked_mul(
            &right_paren_value
          )
        }
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
  pub freeze_buy_unix_time: Option<i64>,
  pub buy_frozen: bool,
  pub sell_frozen: bool,
  
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
  BuyFrozen,

  #[msg("Use token bonding wrapped sol via buy_wrapped_sol, sell_wrapped_sol commands. We may one day provide liquid staking rewards on this stored sol.")]
  WrappedSolNotAllowed
}
