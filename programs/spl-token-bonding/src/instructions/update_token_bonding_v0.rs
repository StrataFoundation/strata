use crate::{error::ErrorCode, state::*, util::verify_empty_or_mint};
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateTokenBondingV0Args {
  pub general_authority: Option<Pubkey>,
  /// Percentage of purchases that go to the founder
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub buy_base_royalty_percentage: u32,
  pub buy_target_royalty_percentage: u32,
  pub sell_base_royalty_percentage: u32,
  pub sell_target_royalty_percentage: u32,
  pub buy_frozen: bool,
}

#[derive(Accounts)]
#[instruction(args: UpdateTokenBondingV0Args)]
pub struct UpdateTokenBondingV0<'info> {
  #[account(
    mut,
    constraint = token_bonding.general_authority.ok_or(error!(ErrorCode::NoAuthority))? == general_authority.key(),
    has_one = base_mint,
    has_one = target_mint
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub general_authority: Signer<'info>,
  pub base_mint: Box<Account<'info, Mint>>,
  pub target_mint: Box<Account<'info, Mint>>,

  /// CHECK: May be uninitialized if there's no royalties of this type
  pub buy_base_royalties: UncheckedAccount<'info>,
  /// CHECK: May be uninitialized if there's no royalties of this type
  pub buy_target_royalties: UncheckedAccount<'info>,
  /// CHECK: May be uninitialized if there's no royalties of this type
  pub sell_base_royalties: UncheckedAccount<'info>,
  /// CHECK: May be uninitialized if there's no royalties of this type
  pub sell_target_royalties: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<UpdateTokenBondingV0>, args: UpdateTokenBondingV0Args) -> Result<()> {
  let bonding = &mut ctx.accounts.token_bonding;

  verify_empty_or_mint(&ctx.accounts.buy_base_royalties, &bonding.base_mint)?;
  verify_empty_or_mint(&ctx.accounts.sell_base_royalties, &bonding.base_mint)?;
  verify_empty_or_mint(&ctx.accounts.buy_target_royalties, &bonding.target_mint)?;
  verify_empty_or_mint(&ctx.accounts.sell_target_royalties, &bonding.target_mint)?;

  bonding.buy_base_royalty_percentage = args.buy_base_royalty_percentage;
  bonding.buy_target_royalty_percentage = args.buy_target_royalty_percentage;
  bonding.sell_base_royalty_percentage = args.sell_base_royalty_percentage;
  bonding.sell_target_royalty_percentage = args.sell_target_royalty_percentage;
  bonding.general_authority = args.general_authority;
  bonding.buy_frozen = args.buy_frozen;
  bonding.buy_target_royalties = ctx.accounts.buy_target_royalties.key();
  bonding.buy_base_royalties = ctx.accounts.buy_base_royalties.key();
  bonding.sell_base_royalties = ctx.accounts.sell_base_royalties.key();
  bonding.sell_target_royalties = ctx.accounts.sell_target_royalties.key();

  Ok(())
}
