#![allow(clippy::or_fun_call)]

use crate::{account::*, arg::*, curve::*, error::ErrorCode, util::*};
use anchor_lang::{
  prelude::*,
  solana_program::{
    program::{invoke, invoke_signed},
    system_instruction,
  },
};
use anchor_spl::token::{self, set_authority, Burn, MintTo, SetAuthority, Transfer};

pub mod account;
pub mod arg;
pub mod curve;
pub mod error;
pub mod precise_number;
pub mod signed_precise_number;
pub mod state;
pub mod uint;
pub mod util;

declare_id!("TBondmkCYxaPCKG4CHYfVTcwQ8on31xnJrPzk8F8WsS");

#[program]
pub mod spl_token_bonding {
  use super::*;
  use anchor_spl::token::TokenAccount;

  pub fn initialize_sol_storage_v0(
    ctx: Context<InitializeSolStorageV0>,
    args: InitializeSolStorageV0Args,
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
    args: BuyWrappedSolV0Args,
  ) -> ProgramResult {
    invoke(
      &system_instruction::transfer(
        &ctx.accounts.source.key(),
        &ctx.accounts.sol_storage.key(),
        args.amount,
      ),
      &[
        ctx.accounts.source.to_account_info().clone(),
        ctx.accounts.sol_storage.to_account_info().clone(),
        ctx.accounts.system_program.to_account_info().clone(),
      ],
    )?;

    token::mint_to(
      CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info().clone(),
        MintTo {
          mint: ctx.accounts.wrapped_sol_mint.to_account_info().clone(),
          to: ctx.accounts.destination.to_account_info().clone(),
          authority: ctx.accounts.mint_authority.to_account_info().clone(),
        },
        &[&[
          b"wrapped-sol-authority",
          &[ctx.accounts.state.mint_authority_bump_seed],
        ]],
      ),
      args.amount,
    )?;

    Ok(())
  }

  pub fn sell_wrapped_sol_v0(
    ctx: Context<SellWrappedSolV0>,
    args: SellWrappedSolV0Args,
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
        amount,
      ),
      &[
        ctx.accounts.sol_storage.to_account_info().clone(),
        ctx.accounts.destination.to_account_info().clone(),
        ctx.accounts.system_program.to_account_info().clone(),
      ],
      &[&[
        "sol-storage".as_bytes(),
        &[ctx.accounts.state.sol_storage_bump_seed],
      ]],
    )?;

    token::burn(
      CpiContext::new(
        ctx.accounts.token_program.to_account_info().clone(),
        Burn {
          mint: ctx.accounts.wrapped_sol_mint.to_account_info().clone(),
          to: ctx.accounts.source.to_account_info().clone(),
          authority: ctx.accounts.owner.to_account_info().clone(),
        },
      ),
      amount,
    )?;

    Ok(())
  }

  pub fn create_curve_v0(
    ctx: Context<InitializeCurveV0>,
    args: CreateCurveV0Args,
  ) -> ProgramResult {
    if !curve_is_valid(&args.definition) {
      return Err(ErrorCode::InvalidCurve.into());
    }

    let curve = &mut ctx.accounts.curve;
    curve.definition = args.definition;

    Ok(())
  }

  pub fn initialize_token_bonding_v0(
    ctx: Context<InitializeTokenBondingV0>,
    args: InitializeTokenBondingV0Args,
  ) -> ProgramResult {
    if ctx.accounts.base_storage.mint == spl_token::native_mint::ID {
      return Err(ErrorCode::WrappedSolNotAllowed.into());
    }

    let target_mint = &ctx.accounts.target_mint;

    let bonding = &mut ctx.accounts.token_bonding;
    bonding.go_live_unix_time = if args.go_live_unix_time < ctx.accounts.clock.unix_timestamp {
      ctx.accounts.clock.unix_timestamp
    } else {
      args.go_live_unix_time
    };
    bonding.created_at_unix_time = ctx.accounts.clock.unix_timestamp;
    bonding.freeze_buy_unix_time = args.freeze_buy_unix_time;
    bonding.base_mint = ctx.accounts.base_mint.key();
    bonding.target_mint = ctx.accounts.target_mint.key();
    bonding.general_authority = args.general_authority;
    bonding.reserve_authority = args.reserve_authority;
    bonding.curve_authority = args.curve_authority;
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
      || bonding.key() != target_mint.mint_authority.unwrap_or_default()
      || (target_mint.freeze_authority.is_some()
        && bonding.key()
          != target_mint
            .freeze_authority
            .ok_or::<ProgramError>(ErrorCode::NoMintAuthority.into())?);
    bonding.sell_frozen = ctx.accounts.base_storage.owner != bonding.key();
    bonding.bump_seed = args.bump_seed;
    bonding.index = args.index;

    Ok(())
  }

  pub fn close_token_bonding_v0(ctx: Context<CloseTokenBondingV0>) -> ProgramResult {
    let token_bonding = &mut ctx.accounts.token_bonding;
    let bonding_seeds: &[&[&[u8]]] = &[&[
      b"token-bonding",
      ctx.accounts.target_mint.to_account_info().key.as_ref(),
      &token_bonding.index.to_le_bytes(),
      &[token_bonding.bump_seed],
    ]];

    if ctx.accounts.base_storage.owner == token_bonding.key() {
      close_token_account(CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info().clone(),
        CloseTokenAccount {
          from: ctx.accounts.base_storage.to_account_info().clone(),
          to: ctx.accounts.refund.to_account_info().clone(),
          authority: token_bonding.to_account_info().clone(),
        },
        bonding_seeds,
      ))?;
    }

    msg!("Setting mint authority to none");
    if ctx.accounts.target_mint.mint_authority.is_some()
      && ctx.accounts.target_mint.mint_authority.unwrap() == token_bonding.key()
    {
      set_authority(
        CpiContext::new_with_signer(
          ctx.accounts.token_program.to_account_info().clone(),
          SetAuthority {
            current_authority: ctx.accounts.token_bonding.to_account_info().clone(),
            account_or_mint: ctx.accounts.target_mint.to_account_info().clone(),
          },
          bonding_seeds,
        ),
        spl_token::instruction::AuthorityType::MintTokens,
        None,
      )?;
    }

    Ok(())
  }

  pub fn update_token_bonding_v0(
    ctx: Context<UpdateTokenBondingV0>,
    args: UpdateTokenBondingV0Args,
  ) -> ProgramResult {
    let bonding = &mut ctx.accounts.token_bonding;

    bonding.buy_base_royalty_percentage = args.buy_base_royalty_percentage;
    bonding.buy_target_royalty_percentage = args.buy_target_royalty_percentage;
    bonding.sell_base_royalty_percentage = args.sell_base_royalty_percentage;
    bonding.sell_target_royalty_percentage = args.sell_target_royalty_percentage;
    bonding.general_authority = args.general_authority;
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

    msg!(
      "Current reserves {} and supply {}",
      ctx.accounts.base_storage.amount,
      ctx.accounts.target_mint.supply
    );

    if token_bonding.go_live_unix_time > ctx.accounts.clock.unix_timestamp {
      return Err(ErrorCode::NotLiveYet.into());
    }

    if token_bonding.buy_frozen {
      return Err(ErrorCode::BuyFrozen.into());
    }

    if token_bonding.freeze_buy_unix_time.is_some()
      && token_bonding.freeze_buy_unix_time.unwrap() < ctx.accounts.clock.unix_timestamp
    {
      return Err(ErrorCode::BuyFrozen.into());
    }

    let base_royalties_data = ctx.accounts.buy_base_royalties.try_borrow_data()?;
    let target_royalties_data = ctx.accounts.buy_target_royalties.try_borrow_data()?;
    let base_royalties_closed =
      TokenAccount::try_deserialize(&mut base_royalties_data.as_ref()).is_err();
    let target_royalties_closed =
      TokenAccount::try_deserialize(&mut target_royalties_data.as_ref()).is_err();
    drop(base_royalties_data);
    drop(target_royalties_data);

    let base_royalties_percent = get_percent(if base_royalties_closed {
      0
    } else {
      token_bonding.buy_base_royalty_percentage
    })?;
    let target_royalties_percent = get_percent(if target_royalties_closed {
      0
    } else {
      token_bonding.buy_target_royalty_percentage
    })?;

    let price: u64;
    let total_amount: u64;
    let base_royalties: u64;
    let target_royalties: u64;
    if args.buy_target_amount.is_some() {
      let buy_target_amount = args.buy_target_amount.unwrap();

      total_amount = buy_target_amount.target_amount;
      let amount_prec = precise_supply_amt(total_amount, target_mint);
      let price_prec = curve
        .definition
        .price(
          ctx
            .accounts
            .clock
            .unix_timestamp
            .checked_sub(token_bonding.go_live_unix_time)
            .unwrap(),
          &base_amount,
          &target_supply,
          &amount_prec,
          false,
        )
        .or_arith_error()?;

      price = to_mint_amount(&price_prec, base_mint, true);
      let base_royalties_prec = base_royalties_percent
        .checked_mul(&price_prec)
        .or_arith_error()?;

      let target_royalties_prec = target_royalties_percent
        .checked_mul(&amount_prec)
        .or_arith_error()?;
      base_royalties = to_mint_amount(&base_royalties_prec, base_mint, true);
      target_royalties = to_mint_amount(&target_royalties_prec, target_mint, false);

      if price.checked_add(base_royalties).unwrap() > buy_target_amount.maximum_price {
        msg!(
          "Price {} too high for max price {}",
          price + base_royalties,
          buy_target_amount.maximum_price
        );
        return Err(ErrorCode::PriceTooHigh.into());
      }
    } else {
      let buy_with_base = args.buy_with_base.unwrap();
      let total_price = buy_with_base.base_amount;
      let total_price_prec = precise_supply_amt(total_price, base_mint);
      let base_royalties_prec = base_royalties_percent
        .checked_mul(&total_price_prec)
        .or_arith_error()?;
      let price_prec = total_price_prec
        .checked_sub(&base_royalties_prec)
        .or_arith_error()?;

      let amount_prec = curve
        .definition
        .expected_target_amount(
          ctx
            .accounts
            .clock
            .unix_timestamp
            .checked_sub(token_bonding.go_live_unix_time)
            .unwrap(),
          &base_amount,
          &target_supply,
          &price_prec,
        )
        .or_arith_error()?;

      total_amount = to_mint_amount(&amount_prec, target_mint, false);

      price = to_mint_amount(&price_prec, base_mint, false);

      let target_royalties_prec = target_royalties_percent
        .checked_mul(&amount_prec)
        .or_arith_error()?;
      base_royalties = to_mint_amount(&base_royalties_prec, base_mint, true);
      target_royalties = to_mint_amount(&target_royalties_prec, target_mint, false);

      let target_amount_minus_royalties = total_amount.checked_sub(target_royalties).unwrap();
      if target_amount_minus_royalties < buy_with_base.minimum_target_amount {
        msg!(
          "{} less than minimum tokens {}",
          target_amount_minus_royalties,
          buy_with_base.minimum_target_amount
        );
        return Err(ErrorCode::PriceTooHigh.into());
      }
    }

    if token_bonding.mint_cap.is_some()
      && target_mint.supply.checked_add(total_amount).unwrap() > token_bonding.mint_cap.unwrap()
    {
      msg!(
        "Mint cap is {} {} {}",
        token_bonding.mint_cap.unwrap(),
        target_mint.supply,
        total_amount
      );
      return Err(ErrorCode::PassedMintCap.into());
    }

    if token_bonding.purchase_cap.is_some() && total_amount > token_bonding.purchase_cap.unwrap() {
      return Err(ErrorCode::OverPurchaseCap.into());
    }

    msg!(
      "Total price is {}, with {} to base royalties and {} to target royalties",
      price + base_royalties,
      base_royalties,
      target_royalties
    );
    let token_program = ctx.accounts.token_program.to_account_info();
    let source = ctx.accounts.source.to_account_info();
    let base_storage_account = ctx.accounts.base_storage.to_account_info();
    let base_royalties_account = ctx.accounts.buy_base_royalties.clone().to_account_info();
    let target_royalties_account = ctx.accounts.buy_target_royalties.clone().to_account_info();
    let target_mint_authority = token_bonding.to_account_info();
    let source_authority = ctx.accounts.source_authority.to_account_info();
    let mint_signer_seeds: &[&[&[u8]]] = &[&[
      b"token-bonding",
      ctx.accounts.target_mint.to_account_info().key.as_ref(),
      &token_bonding.index.to_le_bytes(),
      &[token_bonding.bump_seed],
    ]];

    if base_royalties > 0 {
      msg!("Paying out {} base royalties", base_royalties);
      token::transfer(
        CpiContext::new(
          token_program.clone(),
          Transfer {
            from: source.clone(),
            to: base_royalties_account.clone(),
            authority: source_authority.clone(),
          },
        ),
        base_royalties,
      )?;
    }

    msg!("Paying out {} to base storage", price);
    token::transfer(
      CpiContext::new(
        token_program.clone(),
        Transfer {
          from: source.clone(),
          to: base_storage_account.clone(),
          authority: source_authority.clone(),
        },
      ),
      price,
    )?;

    if target_royalties > 0 {
      msg!("Minting {} to target royalties", target_royalties);
      token::mint_to(
        CpiContext::new_with_signer(
          token_program.clone(),
          MintTo {
            mint: target_mint.to_account_info().clone(),
            to: target_royalties_account.clone(),
            authority: target_mint_authority.clone(),
          },
          mint_signer_seeds,
        ),
        target_royalties,
      )?;
    }

    msg!("Minting {} to destination", total_amount - target_royalties);
    token::mint_to(
      CpiContext::new_with_signer(
        token_program.clone(),
        MintTo {
          mint: target_mint.to_account_info().clone(),
          to: ctx.accounts.destination.to_account_info().clone(),
          authority: target_mint_authority.clone(),
        },
        mint_signer_seeds,
      ),
      total_amount.checked_sub(target_royalties).unwrap(),
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
    msg!(
      "Current reserves {} and supply {}",
      ctx.accounts.base_storage.amount,
      ctx.accounts.target_mint.supply
    );

    if token_bonding.go_live_unix_time > ctx.accounts.clock.unix_timestamp {
      return Err(ErrorCode::NotLiveYet.into());
    }

    if token_bonding.sell_frozen {
      return Err(ErrorCode::SellDisabled.into());
    }

    let base_royalties_data = ctx.accounts.sell_base_royalties.try_borrow_data()?;
    let target_royalties_data = ctx.accounts.sell_target_royalties.try_borrow_data()?;
    let base_royalties_closed =
      TokenAccount::try_deserialize(&mut base_royalties_data.as_ref()).is_err();
    let target_royalties_closed =
      TokenAccount::try_deserialize(&mut target_royalties_data.as_ref()).is_err();
    drop(base_royalties_data);
    drop(target_royalties_data);

    let base_royalties_percent = get_percent(if base_royalties_closed {
      0
    } else {
      token_bonding.sell_base_royalty_percentage
    })?;
    let target_royalties_percent = get_percent(if target_royalties_closed {
      0
    } else {
      token_bonding.sell_target_royalty_percentage
    })?;

    let target_royalties_prec = target_royalties_percent
      .checked_mul(&amount_prec)
      .or_arith_error()?;
    let amount_minus_royalties_prec = amount_prec
      .checked_sub(&target_royalties_prec)
      .or_arith_error()?;
    let reclaimed_prec = curve
      .definition
      .price(
        ctx
          .accounts
          .clock
          .unix_timestamp
          .checked_sub(token_bonding.go_live_unix_time)
          .unwrap(),
        &base_amount,
        &target_supply,
        &amount_minus_royalties_prec,
        true,
      )
      .or_arith_error()?;

    let base_royalties_prec = base_royalties_percent
      .checked_mul(&reclaimed_prec)
      .or_arith_error()?;

    let reclaimed_prec = reclaimed_prec
      .checked_sub(&base_royalties_prec)
      .or_arith_error()?;
    let reclaimed = to_mint_amount(&reclaimed_prec, base_mint, false);
    let base_royalties = to_mint_amount(&base_royalties_prec, base_mint, true);
    let target_royalties = to_mint_amount(&target_royalties_prec, target_mint, false);

    msg!(
      "Total reclaimed is {}, with {} to base royalties, {} to target royalties",
      reclaimed,
      base_royalties,
      target_royalties
    );
    if reclaimed < args.minimum_price {
      msg!(
        "Err: Minimum price was {}, reclaimed was {}",
        args.minimum_price,
        reclaimed
      );
      return Err(ErrorCode::PriceTooLow.into());
    }

    let token_program = ctx.accounts.token_program.to_account_info();
    let source = ctx.accounts.source.to_account_info();
    let base_storage_account = ctx.accounts.base_storage.to_account_info();
    let source_authority = ctx.accounts.source_authority.to_account_info();
    let destination = ctx.accounts.destination.to_account_info();

    msg!("Burning {}", amount);
    token::burn(
      CpiContext::new(
        token_program.clone(),
        Burn {
          mint: target_mint.to_account_info().clone(),
          to: source.clone(),
          authority: source_authority.clone(),
        },
      ),
      amount.checked_sub(target_royalties).unwrap(),
    )?;

    if target_royalties > 0 {
      msg!("Paying out {} to target royalties", target_royalties);
      token::transfer(
        CpiContext::new(
          token_program.clone(),
          Transfer {
            from: source.clone(),
            to: ctx.accounts.sell_target_royalties.to_account_info().clone(),
            authority: source_authority.clone(),
          },
        ),
        target_royalties,
      )?;
    }

    let bonding_seeds: &[&[&[u8]]] = &[&[
      b"token-bonding",
      ctx.accounts.target_mint.to_account_info().key.as_ref(),
      &token_bonding.index.to_le_bytes(),
      &[token_bonding.bump_seed],
    ]];

    msg!(
      "Paying out {} from base storage, {}",
      reclaimed,
      ctx.accounts.base_storage.amount
    );
    token::transfer(
      CpiContext::new_with_signer(
        token_program.clone(),
        Transfer {
          from: base_storage_account.clone(),
          to: destination.clone(),
          authority: ctx.accounts.token_bonding.to_account_info().clone(),
        },
        bonding_seeds,
      ),
      reclaimed,
    )?;

    if base_royalties > 0 {
      msg!(
        "Paying out {} from base storage to base royalties",
        base_royalties
      );
      token::transfer(
        CpiContext::new_with_signer(
          token_program.clone(),
          Transfer {
            from: base_storage_account.clone(),
            to: ctx.accounts.sell_base_royalties.to_account_info().clone(),
            authority: ctx.accounts.token_bonding.to_account_info().clone(),
          },
          bonding_seeds,
        ),
        base_royalties,
      )?;
    }

    Ok(())
  }
}
