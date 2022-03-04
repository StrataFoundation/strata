use crate::{
  error::ErrorCode,
  state::*,
  util::{close_token_account, CloseTokenAccount},
};
use anchor_lang::prelude::*;
use anchor_spl::token::{set_authority, Mint, SetAuthority, Token, TokenAccount};

#[derive(Accounts)]
pub struct CloseTokenBondingV0<'info> {
  #[account(mut)]
  pub refund: SystemAccount<'info>, // Will receive the reclaimed SOL
  #[account(
    mut,
    close = refund,
    constraint = token_bonding.general_authority.ok_or(error!(ErrorCode::NoAuthority))? == general_authority.key(),
    has_one = target_mint,
    has_one = base_storage
  )]
  pub token_bonding: Account<'info, TokenBondingV0>,
  #[account(
    // Bonding can be closed by the authority if reserves are empty
    constraint = base_storage.amount == 0
  )]
  pub general_authority: Signer<'info>,

  #[account(mut)]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(mut)]
  pub base_storage: Box<Account<'info, TokenAccount>>,
  pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CloseTokenBondingV0>) -> Result<()> {
  let token_bonding = &mut ctx.accounts.token_bonding;
  let bonding_seeds: &[&[&[u8]]] = &[&[
    b"token-bonding",
    ctx.accounts.target_mint.to_account_info().key.as_ref(),
    &token_bonding.index.to_le_bytes(),
    &[token_bonding.bump_seed],
  ]];

  if ctx.accounts.base_storage.owner == token_bonding.key() {
    close_token_account(CpiContext::new_with_signer(
      ctx.accounts.token_program.to_account_info().clone(),
      CloseTokenAccount {
        from: ctx.accounts.base_storage.to_account_info().clone(),
        to: ctx.accounts.refund.to_account_info().clone(),
        authority: token_bonding.to_account_info().clone(),
      },
      bonding_seeds,
    ))?;
  }

  msg!("Setting mint authority to general authority");
  if ctx.accounts.target_mint.mint_authority.is_some()
    && ctx.accounts.target_mint.mint_authority.unwrap() == token_bonding.key()
  {
    set_authority(
      CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info().clone(),
        SetAuthority {
          current_authority: ctx.accounts.token_bonding.to_account_info().clone(),
          account_or_mint: ctx.accounts.target_mint.to_account_info().clone(),
        },
        bonding_seeds,
      ),
      spl_token::instruction::AuthorityType::MintTokens,
      Some(ctx.accounts.general_authority.key()),
    )?;
  }

  Ok(())
}
