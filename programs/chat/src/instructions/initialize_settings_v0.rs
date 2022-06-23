use std::collections::BTreeMap;

use crate::state::*;
use anchor_lang::{prelude::*, solana_program::{system_instruction, program::invoke}};

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

pub fn get_size(settings: &InitializeSettingsArgsV0) -> usize {
  let num_chats = settings.chat_settings.len();
  return 8 + 1 + // bump
    32 + // owner_wallet
    4 + // chat settings len
    num_chats * 32 + // identifier length
    num_chats * 3 + // Notification settings length
    settings.encrypted_delegate_wallet.len() +
    settings.encrypted_symmetric_key.len();
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeSettingsArgsV0 {
  pub chat_settings: Vec<ChatSettingsV0>,
  pub encrypted_delegate_wallet: String,
  pub encrypted_symmetric_key: String,
}

pub fn handler(ctx: Context<InitializeSettingsV0>, args: &InitializeSettingsArgsV0) -> Result<()> {
  ctx.accounts.settings.chat_settings = args.chat_settings.clone();
  ctx.accounts.settings.encrypted_delegate_wallet = args.encrypted_delegate_wallet.clone();
  ctx.accounts.settings.encrypted_symmetric_key = args.encrypted_symmetric_key.clone();
  ctx.accounts.settings.bump = *ctx.bumps.get("settings").unwrap();
  ctx.accounts.settings.owner_wallet = ctx.accounts.owner_wallet.key();

  let settings_acc = ctx.accounts.settings.to_account_info();


  let rent = Rent::get()?;
  let new_size = get_size(args);
  let new_minimum_balance = rent.minimum_balance(new_size);


  let lamports_diff = new_minimum_balance.saturating_sub(settings_acc.lamports());
  msg!("Resizing to {} with lamports {}", new_size, lamports_diff);
  invoke(
      &system_instruction::transfer(&ctx.accounts.payer.key(), settings_acc.key, lamports_diff),
      &[
          ctx.accounts.payer.to_account_info().clone(),
          settings_acc.clone(),
          ctx.accounts.system_program.to_account_info().clone(),
      ],
  )?;

  settings_acc.realloc(new_size, false)?;

  Ok(())
}
