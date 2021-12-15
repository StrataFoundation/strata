use anchor_lang::prelude::*;

use crate::arg::CollectiveConfigV0;

#[account]
#[derive(Default)]
pub struct CollectiveV0 {
  pub mint: Pubkey,
  pub authority: Option<Pubkey>,
  pub config: CollectiveConfigV0,
  pub bump_seed: u8,
}

#[account]
#[derive(Default)]
pub struct TokenRefV0 {
  pub collective: Option<Pubkey>,
  pub token_metadata: Pubkey,
  pub mint: Pubkey,
  pub token_bonding: Option<Pubkey>,
  pub name: Option<Pubkey>,
  pub owner: Option<Pubkey>, // Either the owner wallet, or the name class. Name class on unclaimed has the authority to opt out, etc.
  pub authority: Option<Pubkey>, // The authority to make changes to the bonding curve, royalties, etc.
  pub is_claimed: bool,
  pub is_primary: bool, // Is this the primary social token for this wallet?

  pub bump_seed: u8,
  pub target_royalties_owner_bump_seed: u8,

  pub is_opted_out: bool,
}
