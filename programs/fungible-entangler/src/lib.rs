#![allow(clippy::or_fun_call)]

use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;
pub mod util;

use instructions::*;

declare_id!("fent99TYZcj9PGbeooaZXEMQzMd7rz8vYFiudd8HevB");

#[program]
pub mod fungible_entangler {
  use super::*;
  pub fn initialize_fungible_parent_entangler_v0(
    ctx: Context<InitializeFungibleParentEntanglerV0>,
    args: InitializeFungibleParentEntanglerV0Args,
  ) -> Result<()> {
    instructions::initialize_fungible_parent_entangler_v0::handler(ctx, args)
  }

  pub fn initialize_fungible_child_entangler_v0(
    ctx: Context<InitializeFungibleChildEntanglerV0>,
    args: InitializeFungibleChildEntanglerV0Args,
  ) -> Result<()> {
    instructions::initialize_fungible_child_entangler_v0::handler(ctx, args)
  }

  pub fn swap_parent_for_child_v0(
    ctx: Context<SwapParentForChildV0>,
    args: SwapV0Args,
  ) -> Result<()> {
    instructions::swap_parent_for_child_v0::handler(ctx, args)
  }

  pub fn swap_child_for_parent_v0(
    ctx: Context<SwapChildForParentV0>,
    args: SwapV0Args,
  ) -> Result<()> {
    instructions::swap_child_for_parent_v0::handler(ctx, args)
  }

  pub fn close_fungible_child_entangler_v0(
    ctx: Context<CloseFungibleChildEntanglerV0>,
  ) -> Result<()> {
    instructions::close_fungible_child_entangler_v0::handler(ctx)
  }

  pub fn close_fungible_parent_entangler_v0(
    ctx: Context<CloseFungibleParentEntanglerV0>,
  ) -> Result<()> {
    instructions::close_fungible_parent_entangler_v0::handler(ctx)
  }

  pub fn transfer_child_storage_v0(
    ctx: Context<TransferChildStorageV0>,
    args: TransferChildStorageArgsV0,
  ) -> Result<()> {
    instructions::transfer_child_storage_v0::handler(ctx, args)
  }

  pub fn transfer_parent_storage_v0(
    ctx: Context<TransferParentStorageV0>,
    args: TransferParentStorageArgsV0,
  ) -> Result<()> {
    instructions::transfer_parent_storage_v0::handler(ctx, args)
  }
}
