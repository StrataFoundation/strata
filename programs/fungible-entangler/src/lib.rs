#![allow(clippy::or_fun_call)]

use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;
pub mod util;

use instructions::*;

declare_id!(TConj11111111111111111111111111111111111111);

#[program]
pub mod spl_token_conjoiner {
    use super::*;
    // fungible_entangler
    pub fn initialize_token_conjoiner_v0(
        ctx: Context<InitializeTokenConjoinerV0>,
        args: InitializeTokenConjoinerV0Args,
    ) -> Result<()> {
      instructions::initialize_token_conjoiner_v0::handler(ctx, args)
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