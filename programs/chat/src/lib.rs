#![allow(clippy::or_fun_call)]

use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;
pub mod utils;

use instructions::*;

declare_id!("2hC44EVzM4JoL5EWU4ezcZsY6ns2puwxpivQdeUMTzZM");

#[program]
pub mod chat {
  use super::*;
  pub fn initialize_chat_v0(
    ctx: Context<InitializeChatV0>,
    args: InitializeChatArgsV0,
  ) -> Result<()> {
    instructions::initialize_chat_v0::handler(ctx, args)
  }

  pub fn initialize_profile_v0(
    ctx: Context<InitializeProfileV0>,
    args: InitializeProfileArgsV0,
  ) -> Result<()> {
    instructions::initialize_profile_v0::handler(ctx, args)
  }

  pub fn send_message_v0(
    ctx: Context<SendMessageV0>,
    args: MessageV0,
  ) -> Result<()> {
    instructions::send_message_v0::handler(ctx, args)
  }
}
