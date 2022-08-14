use crate::{error::ErrorCode, state::*, util::verify_empty_or_mint};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeTokenBondingV0Args {
  /// Percentage of purchases that go to the founder
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub buy_base_royalty_percentage: u32,
  pub buy_target_royalty_percentage: u32,
  pub sell_base_royalty_percentage: u32,
  pub sell_target_royalty_percentage: u32,
  pub go_live_unix_time: i64,
  pub freeze_buy_unix_time: Option<i64>, // Cut this bonding curve off at some time
  // The maximum number of target tokens that can be minted.
  pub mint_cap: Option<u64>,
  // The maximum target tokens per purchase
  pub purchase_cap: Option<u64>,
  pub general_authority: Option<Pubkey>,
  pub reserve_authority: Option<Pubkey>,
  pub curve_authority: Option<Pubkey>,
  pub buy_frozen: bool,
  pub index: u16, // A given target mint can have multiple curves associated with it. Index 0 is reserved for the primary curve that holds mint authority
  pub bump_seed: u8,

  pub sell_frozen: bool,

  /** Whether or not to ignore changes to base storage and target supply outside of the curve */
  pub ignore_external_reserve_changes: bool,
  pub ignore_external_supply_changes: bool,

  /**
   * Allow starting a curve from a later reserve/supply ratio of ignor reserve and supply changes.
   *
   * This allows for things like the LBC where you don't need to provide any initial liquidity
   */
  pub initial_reserves_pad: u64,
  pub initial_supply_pad: u64,
}

#[derive(Accounts)]
#[instruction(args: InitializeTokenBondingV0Args)]
pub struct InitializeTokenBondingV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  pub curve: Box<Account<'info, CurveV0>>,
  #[account(
    init,
    seeds = [b"token-bonding", target_mint.key().as_ref(), &args.index.to_le_bytes()],
    bump,
    // Index 0 is reserved for the primary bonding curve, the one with which new tokens can be minted
    constraint = args.index != 0 || target_mint.mint_authority.unwrap() == token_bonding.key(),
    payer = payer,
    space = 512
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  #[account(
    constraint = base_mint.is_initialized
  )]
  pub base_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = target_mint.is_initialized
  )]
  pub target_mint: Box<Account<'info, Mint>>,
  #[account(
    constraint = base_storage.mint == base_mint.key(),
    constraint = base_storage.delegate.is_none(),
    constraint = base_storage.close_authority.is_none(),
    constraint = base_storage.owner == token_bonding.key()
  )]
  pub base_storage: Box<Account<'info, TokenAccount>>,

  /// CHECK: May be uninitialized if there's no royalties of this type
  pub buy_base_royalties: UncheckedAccount<'info>,
  /// CHECK: May be uninitialized if there's no royalties of this type
  pub buy_target_royalties: UncheckedAccount<'info>,
  /// CHECK: May be uninitialized if there's no royalties of this type
  pub sell_base_royalties: UncheckedAccount<'info>,
  /// CHECK: May be uninitialized if there's no royalties of this type
  pub sell_target_royalties: UncheckedAccount<'info>,

  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
  pub rent: Sysvar<'info, Rent>,
  pub clock: Sysvar<'info, Clock>,
}

pub fn handler(
  ctx: Context<InitializeTokenBondingV0>,
  args: InitializeTokenBondingV0Args,
) -> Result<()> {
  verify_empty_or_mint(
    &ctx.accounts.buy_base_royalties,
    &ctx.accounts.base_mint.key(),
  )?;
  verify_empty_or_mint(
    &ctx.accounts.sell_base_royalties,
    &ctx.accounts.base_mint.key(),
  )?;
  verify_empty_or_mint(
    &ctx.accounts.buy_target_royalties,
    &ctx.accounts.target_mint.key(),
  )?;
  verify_empty_or_mint(
    &ctx.accounts.sell_target_royalties,
    &ctx.accounts.target_mint.key(),
  )?;

  if ctx.accounts.base_storage.mint == spl_token::native_mint::ID {
    return Err(error!(ErrorCode::WrappedSolNotAllowed));
  }

  let target_mint = &ctx.accounts.target_mint;

  let bonding = &mut ctx.accounts.token_bonding;
  bonding.go_live_unix_time = if args.go_live_unix_time < ctx.accounts.clock.unix_timestamp {
    ctx.accounts.clock.unix_timestamp
  } else {
    args.go_live_unix_time
  };
  bonding.created_at_unix_time = ctx.accounts.clock.unix_timestamp;
  bonding.freeze_buy_unix_time = args.freeze_buy_unix_time;
  bonding.base_mint = ctx.accounts.base_mint.key();
  bonding.target_mint = ctx.accounts.target_mint.key();
  bonding.general_authority = args.general_authority;
  bonding.reserve_authority = args.reserve_authority;
  bonding.curve_authority = args.curve_authority;
  bonding.base_storage = ctx.accounts.base_storage.key();
  bonding.buy_base_royalties = ctx.accounts.buy_base_royalties.key();
  bonding.buy_target_royalties = ctx.accounts.buy_target_royalties.key();
  bonding.sell_base_royalties = ctx.accounts.sell_base_royalties.key();
  bonding.sell_target_royalties = ctx.accounts.sell_target_royalties.key();
  bonding.buy_base_royalty_percentage = args.buy_base_royalty_percentage;
  bonding.buy_target_royalty_percentage = args.buy_target_royalty_percentage;
  bonding.sell_base_royalty_percentage = args.sell_base_royalty_percentage;
  bonding.sell_target_royalty_percentage = args.sell_target_royalty_percentage;
  bonding.curve = ctx.accounts.curve.key();
  bonding.mint_cap = args.mint_cap;
  bonding.purchase_cap = args.purchase_cap;
  // We need to own the mint authority if this bonding curve supports buying.
  // This can be a sell only bonding curve
  bonding.buy_frozen = args.buy_frozen
    || bonding.key() != target_mint.mint_authority.unwrap_or_default()
    || (target_mint.freeze_authority.is_some()
      && bonding.key()
        != target_mint
          .freeze_authority
          .ok_or(error!(ErrorCode::NoMintAuthority))?);
  bonding.sell_frozen = args.sell_frozen;
  bonding.ignore_external_reserve_changes = args.ignore_external_reserve_changes;
  bonding.ignore_external_supply_changes = args.ignore_external_supply_changes;
  bonding.bump_seed = *ctx.bumps.get("token_bonding").unwrap();
  bonding.index = args.index;

  if args.initial_reserves_pad > 0 || args.initial_supply_pad > 0 {
    if !args.ignore_external_supply_changes || !args.ignore_external_reserve_changes {
      return Err(error!(ErrorCode::InvalidPad));
    }
    bonding.reserve_balance_from_bonding = args.initial_reserves_pad;
    bonding.supply_from_bonding = args.initial_supply_pad;
  } else {
    bonding.reserve_balance_from_bonding = 0;
    bonding.supply_from_bonding = 0;
  }

  Ok(())
}
