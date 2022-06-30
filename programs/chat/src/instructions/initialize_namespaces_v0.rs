use crate::state::*;
use anchor_lang::prelude::*;
use namespaces::cpi::{accounts::CreateNamespace, create_namespace};
use namespaces::instructions::CreateNamespaceIx;
use namespaces::program::Namespaces;
use spl_token::native_mint;

#[derive(Accounts)]
#[instruction(args: InitializeNamespacesArgsV0)]
pub struct InitializeNamespacesV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    init,
    payer = payer,
    space = NAMESPACES_SIZE,
    seeds = [b"namespaces"],
    bump,
  )]
  pub namespaces: Box<Account<'info, NamespacesV0>>,
  pub namespaces_program: Program<'info, Namespaces>,
  /// CHECK: Initialized by namespaces program
  #[account(mut)]
  pub chat_namespace: UncheckedAccount<'info>,
  /// CHECK: Initialized by namespaces program
  #[account(mut)]
  pub user_namespace: UncheckedAccount<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeNamespacesArgsV0 {
  pub chat_namespace_name: String,
  pub user_namespace_name: String,
  pub chat_namespace_bump: u8,
  pub user_namespace_bump: u8,
}

pub fn handler(
  ctx: Context<InitializeNamespacesV0>,
  args: InitializeNamespacesArgsV0,
) -> Result<()> {
  let authority = ctx.accounts.namespaces.to_account_info();
  let authority_key = authority.key();

  ctx.accounts.namespaces.bump = *ctx.bumps.get("namespaces").unwrap();
  ctx.accounts.namespaces.chat_namespace = ctx.accounts.chat_namespace.key();
  ctx.accounts.namespaces.user_namespace = ctx.accounts.user_namespace.key();

  create_namespace(
    CpiContext::new(
      ctx.accounts.namespaces_program.to_account_info().clone(),
      CreateNamespace {
        namespace: ctx.accounts.chat_namespace.to_account_info().clone(),
        authority: authority.clone(),
        payer: ctx.accounts.payer.to_account_info().clone(),
        system_program: ctx.accounts.system_program.to_account_info().clone(),
      },
    ),
    CreateNamespaceIx {
      bump: args.chat_namespace_bump,
      name: args.chat_namespace_name,
      update_authority: authority_key,
      rent_authority: authority_key,
      approve_authority: Some(authority_key),
      schema: 0,
      payment_amount_daily: 0,
      payment_mint: native_mint::id(),
      min_rental_seconds: 0,
      max_rental_seconds: None,
      transferable_entries: true,
    },
  )?;

  create_namespace(
    CpiContext::new(
      ctx.accounts.namespaces_program.to_account_info().clone(),
      CreateNamespace {
        namespace: ctx.accounts.user_namespace.to_account_info().clone(),
        authority,
        payer: ctx.accounts.payer.to_account_info().clone(),
        system_program: ctx.accounts.system_program.to_account_info().clone(),
      },
    ),
    CreateNamespaceIx {
      bump: args.user_namespace_bump,
      name: args.user_namespace_name,
      update_authority: authority_key,
      rent_authority: authority_key,
      approve_authority: Some(authority_key),
      schema: 0,
      payment_amount_daily: 0,
      payment_mint: native_mint::id(),
      min_rental_seconds: 0,
      max_rental_seconds: None,
      transferable_entries: true,
    },
  )?;

  Ok(())
}
