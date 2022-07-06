use crate::{state::*, utils::resize_to_fit};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(args: InitializeSettingsArgsV0)]
pub struct InitializeSettingsV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    init_if_needed,
    payer = payer,
    space = std::cmp::max(8 + std::mem::size_of::<SettingsV0>(), settings.data.borrow_mut().len()),
    seeds = [b"settings", owner_wallet.key().as_ref()],
    bump,
  )]
  pub settings: Box<Account<'info, SettingsV0>>,
  pub owner_wallet: Signer<'info>,
  pub rent: Sysvar<'info, Rent>,
  pub system_program: Program<'info, System>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeSettingsArgsV0 {
  pub encrypted_delegate_wallet: String,
  pub encrypted_symmetric_key: String,
}

pub fn handler(ctx: Context<InitializeSettingsV0>, args: &InitializeSettingsArgsV0) -> Result<()> {
  ctx.accounts.settings.set_inner(SettingsV0 {
    encrypted_delegate_wallet: args.encrypted_delegate_wallet.clone(),
    encrypted_symmetric_key: args.encrypted_symmetric_key.clone(),
    bump: *ctx.bumps.get("settings").unwrap(),
    owner_wallet: ctx.accounts.owner_wallet.key(),
  });

  resize_to_fit(
    &ctx.accounts.payer.to_account_info(),
    &ctx.accounts.system_program.to_account_info(),
    &ctx.accounts.settings,
  )?;

  Ok(())
}
