#![allow(clippy::or_fun_call)]

use crate::{account::*, arg::*, buy::*, error::ErrorCode, sell::*, util::*};
use anchor_lang::{
  prelude::*,
  solana_program::{program::invoke, system_instruction},
};
use anchor_spl::token::{self, set_authority, SetAuthority, Transfer};

pub mod account;
pub mod arg;
pub mod buy;
pub mod curve;
pub mod error;
pub mod precise_number;
pub mod sell;
pub mod signed_precise_number;
pub mod state;
pub mod uint;
pub mod util;

declare_id!("TBondmkCYxaPCKG4CHYfVTcwQ8on31xnJrPzk8F8WsS");

#[program]
pub mod spl_token_bonding {

  use super::*;

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
    buy_wrapped_sol(ctx.accounts, &args)
  }

  pub fn sell_wrapped_sol_v0(
    ctx: Context<SellWrappedSolV0>,
    args: SellWrappedSolV0Args,
  ) -> ProgramResult {
    sell_wrapped_sol(ctx.accounts, &args, None)
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
    verify_empty_or_mint(
      &ctx.accounts.buy_base_royalties,
      &ctx.accounts.base_mint.key(),
    )?;
    verify_empty_or_mint(
      &ctx.accounts.sell_base_royalties,
      &ctx.accounts.base_mint.key(),
    )?;
    verify_empty_or_mint(
      &ctx.accounts.buy_target_royalties,
      &ctx.accounts.target_mint.key(),
    )?;
    verify_empty_or_mint(
      &ctx.accounts.sell_target_royalties,
      &ctx.accounts.target_mint.key(),
    )?;

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
    bonding.sell_frozen = args.sell_frozen;
    bonding.ignore_external_reserve_changes = args.ignore_external_reserve_changes;
    bonding.ignore_external_supply_changes = args.ignore_external_supply_changes;
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

    msg!("Setting mint authority to general authority");
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
        Some(ctx.accounts.general_authority.key()),
      )?;
    }

    Ok(())
  }

  pub fn transfer_reserves_v0(
    ctx: Context<TransferReservesV0>,
    args: TransferReservesV0Args,
  ) -> ProgramResult {
    let token_bonding = &mut ctx.accounts.common.token_bonding;
    let bonding_seeds: &[&[&[u8]]] = &[&[
      b"token-bonding",
      token_bonding.target_mint.as_ref(),
      &token_bonding.index.to_le_bytes(),
      &[token_bonding.bump_seed],
    ]];

    token::transfer(
      CpiContext::new_with_signer(
        ctx.accounts.common.token_program.to_account_info().clone(),
        Transfer {
          from: ctx.accounts.common.base_storage.to_account_info().clone(),
          to: ctx.accounts.destination.to_account_info().clone(),
          authority: token_bonding.to_account_info().clone(),
        },
        bonding_seeds,
      ),
      args.amount,
    )?;

    Ok(())
  }

  pub fn transfer_reserves_native_v0(
    ctx: Context<TransferReservesNativeV0>,
    args: TransferReservesV0Args,
  ) -> ProgramResult {
    let token_bonding = &mut ctx.accounts.common.token_bonding;
    let bonding_seeds: &[&[&[u8]]] = &[&[
      b"token-bonding",
      token_bonding.target_mint.as_ref(),
      &token_bonding.index.to_le_bytes(),
      &[token_bonding.bump_seed],
    ]];

    sell_wrapped_sol(
      &SellWrappedSolV0 {
        state: ctx.accounts.state.clone(),
        wrapped_sol_mint: ctx.accounts.wrapped_sol_mint.clone(),
        sol_storage: ctx.accounts.sol_storage.clone(),
        source: ctx.accounts.common.base_storage.clone(),
        owner: token_bonding.to_account_info(),
        destination: ctx.accounts.destination.to_account_info().clone(),
        token_program: ctx.accounts.common.token_program.clone(),
        system_program: ctx.accounts.system_program.clone(),
      },
      &SellWrappedSolV0Args {
        amount: args.amount,
        all: false,
      },
      Some(bonding_seeds),
    )?;

    Ok(())
  }
  
  pub fn update_reserve_authority_v0(
    ctx: Context<UpdateReserveAuthorityV0>,
    args: UpdateReserveAuthorityV0Args,
  ) -> ProgramResult {
    ctx.accounts.token_bonding.reserve_authority = args.new_reserve_authority;

    Ok(())
  }

  pub fn update_token_bonding_v0(
    ctx: Context<UpdateTokenBondingV0>,
    args: UpdateTokenBondingV0Args,
  ) -> ProgramResult {
    let bonding = &mut ctx.accounts.token_bonding;

    verify_empty_or_mint(&ctx.accounts.buy_base_royalties, &bonding.base_mint)?;
    verify_empty_or_mint(&ctx.accounts.sell_base_royalties, &bonding.base_mint)?;
    verify_empty_or_mint(&ctx.accounts.buy_target_royalties, &bonding.target_mint)?;
    verify_empty_or_mint(&ctx.accounts.sell_target_royalties, &bonding.target_mint)?;

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

  // DEPRECATED, USE BUY V1
  pub fn buy_v0(ctx: Context<BuyV0>, args: BuyV0Args) -> ProgramResult {
    msg!("Warning: This endpoint is deprecated, please use buy_v1");
    if ctx.accounts.token_bonding.ignore_external_reserve_changes
      || ctx.accounts.token_bonding.ignore_external_supply_changes
    {
      return Err(ErrorCode::IgnoreExternalV1Only.into());
    }
    let common = &mut BuyCommonV0 {
      token_bonding: ctx.accounts.token_bonding.clone(),
      curve: ctx.accounts.curve.clone(),
      base_mint: ctx.accounts.base_mint.clone(),
      target_mint: ctx.accounts.target_mint.clone(),
      base_storage: ctx.accounts.base_storage.clone(),
      buy_base_royalties: ctx.accounts.buy_base_royalties.clone(),
      buy_target_royalties: ctx.accounts.buy_target_royalties.clone(),
      destination: ctx.accounts.destination.clone(),
      token_program: ctx.accounts.token_program.clone(),
      clock: ctx.accounts.clock.clone(),
    };
    let BuyAmount {
      total_amount,
      price,
      target_royalties,
      base_royalties,
    } = buy_shared_logic(common, &args)?;

    mint_to_dest(
      total_amount,
      target_royalties,
      common,
      &ctx.accounts.destination.to_account_info(),
    )?;

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
    let source_authority = ctx.accounts.source_authority.to_account_info();

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

    Ok(())
  }

  pub fn buy_v1(ctx: Context<BuyV1>, args: BuyV0Args) -> ProgramResult {
    let BuyAmount {
      total_amount,
      price,
      target_royalties,
      base_royalties,
    } = buy_shared_logic(&mut ctx.accounts.common, &args)?;

    mint_to_dest(
      total_amount,
      target_royalties,
      &ctx.accounts.common,
      &ctx.accounts.common.destination.to_account_info(),
    )?;

    msg!(
      "Total price is {}, with {} to base royalties and {} to target royalties",
      price + base_royalties,
      base_royalties,
      target_royalties
    );
    let token_program = ctx.accounts.common.token_program.to_account_info();
    let source = ctx.accounts.source.to_account_info();
    let base_storage_account = ctx.accounts.common.base_storage.to_account_info();
    let base_royalties_account = ctx
      .accounts
      .common
      .buy_base_royalties
      .clone()
      .to_account_info();
    let source_authority = ctx.accounts.source_authority.to_account_info();

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

    Ok(())
  }

  pub fn buy_native_v0(ctx: Context<BuyNativeV0>, args: BuyV0Args) -> ProgramResult {
    let BuyAmount {
      price,
      base_royalties,
      target_royalties,
      total_amount,
    } = buy_shared_logic(&mut ctx.accounts.common, &args)?;

    mint_to_dest(
      total_amount,
      target_royalties,
      &ctx.accounts.common,
      &ctx.accounts.common.destination.to_account_info(),
    )?;

    msg!(
      "Total price is {}, with {} to base royalties and {} to target royalties",
      price + base_royalties,
      base_royalties,
      target_royalties
    );
    let source = &ctx.accounts.source;
    let base_storage_account = &ctx.accounts.common.base_storage;
    let base_royalties_account = ctx
      .accounts
      .common
      .buy_base_royalties
      .clone()
      .to_account_info();

    if base_royalties > 0 {
      msg!("Paying out {} base royalties", base_royalties);
      invoke(
        &system_instruction::transfer(&source.key(), &base_royalties_account.key(), base_royalties),
        &[
          source.to_account_info().clone(),
          base_royalties_account.to_account_info().clone(),
          ctx.accounts.system_program.to_account_info().clone(),
        ],
      )?;
    }

    msg!("Paying out {} to base storage", price);
    buy_wrapped_sol(
      &BuyWrappedSolV0 {
        state: ctx.accounts.state.clone(),
        wrapped_sol_mint: ctx.accounts.wrapped_sol_mint.clone(),
        mint_authority: ctx.accounts.mint_authority.clone(),
        sol_storage: ctx.accounts.sol_storage.clone(),
        source: source.clone(),
        destination: base_storage_account.clone(),
        token_program: ctx.accounts.common.token_program.clone(),
        system_program: ctx.accounts.system_program.clone(),
      },
      &BuyWrappedSolV0Args { amount: price },
    )?;

    Ok(())
  }

  // DEPRECATED, USE SELL V0
  pub fn sell_v0(ctx: Context<SellV0>, args: SellV0Args) -> ProgramResult {
    msg!("Warning: This endpoint is deprecated, please use sell_v1");
    if ctx.accounts.token_bonding.ignore_external_reserve_changes
      || ctx.accounts.token_bonding.ignore_external_supply_changes
    {
      return Err(ErrorCode::IgnoreExternalV1Only.into());
    }

    let common = &mut SellCommonV0 {
      token_bonding: ctx.accounts.token_bonding.clone(),
      curve: ctx.accounts.curve.clone(),
      base_mint: ctx.accounts.base_mint.clone(),
      target_mint: ctx.accounts.target_mint.clone(),
      base_storage: ctx.accounts.base_storage.clone(),
      sell_base_royalties: ctx.accounts.sell_base_royalties.clone(),
      source: ctx.accounts.source.clone(),
      source_authority: ctx.accounts.source_authority.clone(),
      sell_target_royalties: ctx.accounts.sell_target_royalties.clone(),
      token_program: ctx.accounts.token_program.clone(),
      clock: ctx.accounts.clock.clone(),
    };

    let SellAmount {
      reclaimed,
      base_royalties,
      target_royalties,
    } = sell_shared_logic(common, &args)?;

    msg!(
      "Total reclaimed is {}, with {} to base royalties, {} to target royalties",
      reclaimed,
      base_royalties,
      target_royalties
    );

    burn_and_pay_sell_royalties(args.target_amount, target_royalties, common)?;

    let token_program = ctx.accounts.token_program.to_account_info();
    let base_storage_account = ctx.accounts.base_storage.to_account_info();
    let destination = ctx.accounts.destination.to_account_info();
    let target_mint = ctx.accounts.target_mint.to_account_info();
    let token_bonding = &mut ctx.accounts.token_bonding;

    msg!(
      "Paying out {} from base storage, {}",
      reclaimed,
      ctx.accounts.base_storage.amount
    );
    let bonding_seeds: &[&[&[u8]]] = &[&[
      b"token-bonding",
      target_mint.to_account_info().key.as_ref(),
      &token_bonding.index.to_le_bytes(),
      &[token_bonding.bump_seed],
    ]];
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

  pub fn sell_v1(ctx: Context<SellV1>, args: SellV0Args) -> ProgramResult {
    let SellAmount {
      reclaimed,
      base_royalties,
      target_royalties,
    } = sell_shared_logic(&mut ctx.accounts.common, &args)?;

    msg!(
      "Total reclaimed is {}, with {} to base royalties, {} to target royalties",
      reclaimed,
      base_royalties,
      target_royalties
    );

    burn_and_pay_sell_royalties(args.target_amount, target_royalties, &ctx.accounts.common)?;

    let token_program = ctx.accounts.common.token_program.to_account_info();
    let base_storage_account = ctx.accounts.common.base_storage.to_account_info();
    let destination = ctx.accounts.destination.to_account_info();
    let target_mint = ctx.accounts.common.target_mint.to_account_info();
    let token_bonding = &mut ctx.accounts.common.token_bonding;

    msg!(
      "Paying out {} from base storage, {}",
      reclaimed,
      ctx.accounts.common.base_storage.amount
    );
    let bonding_seeds: &[&[&[u8]]] = &[&[
      b"token-bonding",
      target_mint.to_account_info().key.as_ref(),
      &token_bonding.index.to_le_bytes(),
      &[token_bonding.bump_seed],
    ]];
    token::transfer(
      CpiContext::new_with_signer(
        token_program.clone(),
        Transfer {
          from: base_storage_account.clone(),
          to: destination.clone(),
          authority: token_bonding.to_account_info().clone(),
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
            to: ctx
              .accounts
              .common
              .sell_base_royalties
              .to_account_info()
              .clone(),
            authority: token_bonding.to_account_info().clone(),
          },
          bonding_seeds,
        ),
        base_royalties,
      )?;
    }

    Ok(())
  }

  pub fn sell_native_v0(ctx: Context<SellNativeV0>, args: SellV0Args) -> ProgramResult {
    let amount = args.target_amount;

    let SellAmount {
      reclaimed,
      base_royalties,
      target_royalties,
    } = sell_shared_logic(&mut ctx.accounts.common, &args)?;

    msg!(
      "Total reclaimed is {}, with {} to base royalties, {} to target royalties",
      reclaimed,
      base_royalties,
      target_royalties
    );

    burn_and_pay_sell_royalties(amount, target_royalties, &ctx.accounts.common)?;

    let base_storage_account = &ctx.accounts.common.base_storage.clone();
    let destination = ctx.accounts.destination.to_account_info();
    let token_bonding = &mut ctx.accounts.common.token_bonding;
    let target_mint = &mut ctx.accounts.common.target_mint;

    msg!(
      "Paying out {} from base storage, {}",
      reclaimed,
      ctx.accounts.common.base_storage.amount
    );
    let bonding_seeds: &[&[&[u8]]] = &[&[
      b"token-bonding",
      target_mint.to_account_info().key.as_ref(),
      &token_bonding.index.to_le_bytes(),
      &[token_bonding.bump_seed],
    ]];

    sell_wrapped_sol(
      &SellWrappedSolV0 {
        state: ctx.accounts.state.clone(),
        wrapped_sol_mint: ctx.accounts.wrapped_sol_mint.clone(),
        sol_storage: ctx.accounts.sol_storage.clone(),
        source: base_storage_account.clone(),
        owner: token_bonding.to_account_info(),
        destination,
        token_program: ctx.accounts.common.token_program.clone(),
        system_program: ctx.accounts.system_program.clone(),
      },
      &SellWrappedSolV0Args {
        amount: reclaimed,
        all: false,
      },
      Some(bonding_seeds),
    )?;

    if base_royalties > 0 {
      msg!(
        "Paying out {} from base storage to base royalties",
        base_royalties
      );
      sell_wrapped_sol(
        &SellWrappedSolV0 {
          state: ctx.accounts.state.clone(),
          wrapped_sol_mint: ctx.accounts.wrapped_sol_mint.clone(),
          sol_storage: ctx.accounts.sol_storage.clone(),
          source: base_storage_account.clone(),
          owner: token_bonding.to_account_info(),
          destination: ctx.accounts.common.sell_base_royalties.to_account_info(),
          token_program: ctx.accounts.common.token_program.clone(),
          system_program: ctx.accounts.system_program.clone(),
        },
        &SellWrappedSolV0Args {
          amount: reclaimed,
          all: false,
        },
        Some(bonding_seeds),
      )?;
    }

    Ok(())
  }
}
