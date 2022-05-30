use anchor_lang::prelude::*;
use crate::state::*;

pub const DELEGATE_WALLET_SIZE: usize = 1 + // key
  32 + // owner_wallet
  32 + // delegate_wallet
  80; // padding

#[derive(Accounts)]
pub struct InitializeDelegateWalletV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    init,
    payer = payer,
    space = DELEGATE_WALLET_SIZE,
    seeds = ["delegate-wallet".as_bytes(), delegate.key().as_ref()],
    bump,
  )]
  pub delegate_wallet: Box<Account<'info, DelegateWalletV0>>,
  pub owner: Signer<'info>,
  pub delegate: Signer<'info>,
  pub system_program: Program<'info, System>,
}

pub fn handler(
  ctx: Context<InitializeDelegateWalletV0>,
) -> Result<()> {

  ctx.accounts.delegate_wallet.delegate_wallet = ctx.accounts.delegate.key();
  ctx.accounts.delegate_wallet.owner_wallet = ctx.accounts.owner.key();
  
  Ok(())
}
