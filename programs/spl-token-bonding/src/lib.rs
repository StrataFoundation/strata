#![allow(clippy::or_fun_call)]

use anchor_lang::prelude::*;

pub mod curve;
pub mod error;
pub mod instructions;
pub mod precise_number;
pub mod signed_precise_number;
pub mod state;
pub mod uint;
pub mod util;

use instructions::*;

declare_id!("TBondmkCYxaPCKG4CHYfVTcwQ8on31xnJrPzk8F8WsS");

#[program]
pub mod spl_token_bonding {

  use super::*;

  pub fn initialize_sol_storage_v0(
    ctx: Context<InitializeSolStorageV0>,
    args: InitializeSolStorageV0Args,
  ) -> Result<()> {
    instructions::initialize_sol_storage_v0::handler(ctx, args)
  }

  pub fn buy_wrapped_sol_v0(
    ctx: Context<BuyWrappedSolV0>,
    args: BuyWrappedSolV0Args,
  ) -> Result<()> {
    instructions::buy::buy_wrapped_sol_v0::handler(ctx, args)
  }

  pub fn sell_wrapped_sol_v0(
    ctx: Context<SellWrappedSolV0>,
    args: SellWrappedSolV0Args,
  ) -> Result<()> {
    instructions::sell::sell_wrapped_sol_v0::handler(ctx, args)
  }

  pub fn create_curve_v0(ctx: Context<InitializeCurveV0>, args: CreateCurveV0Args) -> Result<()> {
    instructions::create_curve_v0::handler(ctx, args)
  }

  pub fn initialize_token_bonding_v0(
    ctx: Context<InitializeTokenBondingV0>,
    args: InitializeTokenBondingV0Args,
  ) -> Result<()> {
    instructions::initialize_token_bonding_v0::handler(ctx, args)
  }

  pub fn close_token_bonding_v0(ctx: Context<CloseTokenBondingV0>) -> Result<()> {
    instructions::close_token_bonding_v0::handler(ctx)
  }

  pub fn transfer_reserves_v0(
    ctx: Context<TransferReservesV0>,
    args: TransferReservesV0Args,
  ) -> Result<()> {
    instructions::transfer_reserves::transfer_reserves_v0::handler(ctx, args)
  }

  pub fn transfer_reserves_native_v0(
    ctx: Context<TransferReservesNativeV0>,
    args: TransferReservesV0Args,
  ) -> Result<()> {
    instructions::transfer_reserves::transfer_reserves_native_v0::handler(ctx, args)
  }

  pub fn update_reserve_authority_v0(
    ctx: Context<UpdateReserveAuthorityV0>,
    args: UpdateReserveAuthorityV0Args,
  ) -> Result<()> {
    instructions::update_reserve_authority_v0::handler(ctx, args)
  }

  pub fn update_curve_v0(ctx: Context<UpdateCurveV0>, args: UpdateCurveV0Args) -> Result<()> {
    instructions::update_curve_v0::handler(ctx, args)
  }

  pub fn update_token_bonding_v0(
    ctx: Context<UpdateTokenBondingV0>,
    args: UpdateTokenBondingV0Args,
  ) -> Result<()> {
    instructions::update_token_bonding_v0::handler(ctx, args)
  }

  pub fn buy_v1(ctx: Context<BuyV1>, args: BuyV0Args) -> Result<()> {
    instructions::buy::buy_v1::handler(ctx, args)
  }

  pub fn buy_native_v0(ctx: Context<BuyNativeV0>, args: BuyV0Args) -> Result<()> {
    instructions::buy::buy_native_v0::handler(ctx, args)
  }

  pub fn sell_v1(ctx: Context<SellV1>, args: SellV0Args) -> Result<()> {
    instructions::sell::sell_v1::handler(ctx, args)
  }

  pub fn sell_native_v0(ctx: Context<SellNativeV0>, args: SellV0Args) -> Result<()> {
    instructions::sell::sell_native_v0::handler(ctx, args)
  }
}
