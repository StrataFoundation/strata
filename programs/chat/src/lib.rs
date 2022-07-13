#![allow(clippy::or_fun_call)]

use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod metadata;
pub mod state;
pub mod utils;

use instructions::*;

declare_id!("chatGL6yNgZT2Z3BeMYGcgdMpcBKdmxko4C5UhEX4To");

#[program]
pub mod chat {
  use super::*;

  pub fn initialize_namespaces_v0(
    ctx: Context<InitializeNamespacesV0>,
    args: InitializeNamespacesArgsV0,
  ) -> Result<()> {
    instructions::initialize_namespaces_v0::handler(ctx, args)
  }

  pub fn claim_admin_v0(ctx: Context<ClaimAdminV0>) -> Result<()> {
    instructions::claim_admin_v0::handler(ctx)
  }

  pub fn initialize_chat_v0(
    ctx: Context<InitializeChatV0>,
    args: InitializeChatArgsV0,
  ) -> Result<()> {
    instructions::initialize_chat_v0::handler(ctx, args)
  }

  pub fn initialize_unidentified_chat_v0(
    ctx: Context<InitializeUnidentifiedChatV0>,
    args: InitializeChatArgsV0,
    admin: Option<Pubkey>,
  ) -> Result<()> {
    instructions::initialize_unidentified_chat_v0::handler(ctx, args, admin)
  }

  pub fn close_chat_v0(ctx: Context<CloseChatV0>) -> Result<()> {
    instructions::close_chat_v0::handler(ctx)
  }

  pub fn close_chat_permissions_v0(ctx: Context<CloseChatPermissionsV0>) -> Result<()> {
    instructions::close_chat_permissions_v0::handler(ctx)
  }

  pub fn initialize_chat_permissions_v0(
    ctx: Context<InitializeChatPermissionsV0>,
    args: InitializeChatPermissionsArgsV0,
  ) -> Result<()> {
    instructions::initialize_chat_permissions_v0::handler(ctx, args)
  }

  pub fn initialize_settings_v0(
    ctx: Context<InitializeSettingsV0>,
    args: InitializeSettingsArgsV0,
  ) -> Result<()> {
    instructions::initialize_settings_v0::handler(ctx, &args)
  }

  pub fn initialize_profile_v0(
    ctx: Context<InitializeProfileV0>,
    args: InitializeProfileArgsV0,
  ) -> Result<()> {
    instructions::initialize_profile_v0::handler(ctx, args)
  }

  pub fn initialize_delegate_wallet_v0(ctx: Context<InitializeDelegateWalletV0>) -> Result<()> {
    instructions::initialize_delegate_wallet_v0::handler(ctx)
  }

  pub fn send_token_message_v0(
    ctx: Context<SendTokenMessageV0>,
    args: MessagePartV0,
  ) -> Result<()> {
    instructions::send_token_message_v0::handler(ctx, args)
  }

  pub fn send_native_message_v0(
    ctx: Context<SendNativeMessageV0>,
    args: MessagePartV0,
  ) -> Result<()> {
    instructions::send_native_message_v0::handler(ctx, args)
  }

  pub fn approve_chat_identifier_v0(ctx: Context<ApproveChatIdentifierV0>) -> Result<()> {
    instructions::approve_chat_identifier_v0::handler(ctx)
  }

  pub fn approve_user_identifier_v0(ctx: Context<ApproveUserIdentifierV0>) -> Result<()> {
    instructions::approve_user_identifier_v0::handler(ctx)
  }
}
