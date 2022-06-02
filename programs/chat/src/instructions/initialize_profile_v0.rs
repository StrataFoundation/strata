use anchor_lang::prelude::*;
use crate::error::ErrorCode;
use crate::state::*;
use crate::utils::puffed_out_string;

pub const PROFILE_SIZE: usize = 1 + // key
  32 + // owenr_wallet
  32 + // username
  200 + // image_url
  200 + // metadata_url
  80; // padding

#[derive(Accounts)]
#[instruction(args: InitializeProfileArgsV0)]
pub struct InitializeProfileV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    init,
    payer = payer,
    space = PROFILE_SIZE,
    seeds = ["username_profile".as_bytes(), puffed_out_string(&args.username.to_lowercase(), 32).as_bytes()],
    bump,
  )]
  pub username_profile: Box<Account<'info, ProfileV0>>,
  #[account(
    init,
    payer = payer,
    space = PROFILE_SIZE,
    seeds = [b"wallet_profile", owner_wallet.key().as_ref()],
    bump,
  )]
  pub wallet_profile: Box<Account<'info, ProfileV0>>,
  pub owner_wallet: Signer<'info>,
  pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeProfileArgsV0 {
  pub username: String,
  pub image_url: String,
  pub metadata_url: String
}

pub fn handler(
  ctx: Context<InitializeProfileV0>,
  args: InitializeProfileArgsV0,
) -> Result<()> {
  require!(args.username.len() <= 32, ErrorCode::InvalidStringLength);
  require!(args.image_url.len() <= 200, ErrorCode::InvalidStringLength);
  require!(args.metadata_url.len() <= 200, ErrorCode::InvalidStringLength);
  require!(args.username.chars().all(char::is_alphanumeric), ErrorCode::StringNotAlphanumeric);

  ctx.accounts.wallet_profile.username = puffed_out_string(&args.username, 32);
  ctx.accounts.wallet_profile.owner_wallet = ctx.accounts.owner_wallet.key();
  ctx.accounts.wallet_profile.bump = *ctx.bumps.get("wallet_profile").unwrap();
  ctx.accounts.wallet_profile.metadata_url = puffed_out_string(&args.metadata_url, 200);
  ctx.accounts.wallet_profile.image_url = puffed_out_string(&args.image_url, 200);

  ctx.accounts.username_profile.set_inner(ctx.accounts.wallet_profile.clone().into_inner());
  
  Ok(())
}
