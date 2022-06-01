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

  pub fn swap_parent_v0(ctx: Context<SwapParentV0>, args: SwapV0Args) -> Result<()> {
    instructions::swap_parent_v0::handler(ctx, args)
  }

  pub fn swap_child_v0(ctx: Context<SwapChildV0>, args: SwapV0Args) -> Result<()> {
    instructions::swap_child_v0::handler(ctx, args)
  }
}
