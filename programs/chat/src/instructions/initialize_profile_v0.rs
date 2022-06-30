use crate::state::*;
use crate::{error::ErrorCode, utils::resize_to_fit};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount};
use namespaces::state::Entry;

#[derive(Accounts)]
#[instruction(args: InitializeProfileArgsV0)]
pub struct InitializeProfileV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    init_if_needed,
    payer = payer,
    space = std::cmp::max(8 + std::mem::size_of::<ProfileV0>(), wallet_profile.data.borrow_mut().len()),
    seeds = [b"wallet_profile", owner_wallet.key().as_ref()],
    bump,
  )]
  pub wallet_profile: Box<Account<'info, ProfileV0>>,
  pub namespaces: Box<Account<'info, NamespacesV0>>,
  #[account(
    constraint = entry.mint == identifier_certificate_mint.key(),
    constraint = namespaces.user_namespace == entry.namespace
  )]
  pub entry: Box<Account<'info, Entry>>,
  pub identifier_certificate_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = identifier_certificate_mint_account.amount >= 1,
    constraint = owner_wallet.key() == identifier_certificate_mint_account.owner,
    constraint = identifier_certificate_mint_account.mint == identifier_certificate_mint.key(),
    constraint = identifier_certificate_mint_account.amount > 0
  )]
  pub identifier_certificate_mint_account: Box<Account<'info, TokenAccount>>,
  pub owner_wallet: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeProfileArgsV0 {
  pub image_url: String,
  pub metadata_url: String,
}

pub fn handler(ctx: Context<InitializeProfileV0>, args: InitializeProfileArgsV0) -> Result<()> {
  require!(args.image_url.len() <= 200, ErrorCode::InvalidStringLength);
  require!(
    args.metadata_url.len() <= 200,
    ErrorCode::InvalidStringLength
  );

  ctx.accounts.wallet_profile.identifier_certificate_mint =
    ctx.accounts.identifier_certificate_mint.key();
  ctx.accounts.wallet_profile.owner_wallet = ctx.accounts.owner_wallet.key();
  ctx.accounts.wallet_profile.bump = *ctx.bumps.get("wallet_profile").unwrap();
  ctx.accounts.wallet_profile.metadata_url = args.metadata_url;
  ctx.accounts.wallet_profile.image_url = args.image_url;

  resize_to_fit(
    &ctx.accounts.payer.to_account_info(),
    &ctx.accounts.system_program.to_account_info(),
    &ctx.accounts.wallet_profile,
  )?;

  Ok(())
}
