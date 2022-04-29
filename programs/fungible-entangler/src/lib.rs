#![allow(clippy::or_fun_call)]

use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;
pub mod util;

use instructions::*;

declare_id!("Ae6wbxtjpoKGCuSdHGQXRudmdpSfGpu6KHtjDcWEDjP8");

#[program]
pub mod fungible_entangler {
    use super::*;
    pub fn initialize_fungible_entangler_v0(
      ctx: Context<InitializeFungibleEntanglerV0>,
      args: InitializeFungibleEntanglerV0Args,
    ) -> Result<()> {
      instructions::initialize_fungible_entangler_v0::handler(ctx, args)
    }

    pub fn initialize_fungible_child_entangler_v0(
      ctx: Context<InitializeFungibleChildEntanglerV0>,
      args: InitializeFungibleChildEntanglerV0Args,
    ) -> Result<()> {
      instructions::initialize_fungible_child_entangler_v0::handler(ctx,args)
    }

    pub fn swap_base_v0(
      ctx: Context<SwapBaseV0>,
      args: SwapV0Args
    ) -> Result<()> {
      instructions::swap_base_v0::handler(ctx, args)
    }

    pub fn swap_target_v0(
      ctx: Context<SwapTargetV0>,
      args: SwapV0Args
    ) -> Result<()> {
      instructions::swap_target_v0::handler(ctx, args)
    }
}