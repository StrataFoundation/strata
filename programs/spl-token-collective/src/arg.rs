use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct ClaimSocialTokenV0Args {
  pub is_primary: bool, // Is this the primary social token for this wallet?
  pub authority: Option<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeCollectiveV0Args {
  pub bump_seed: u8,
  pub authority: Option<Pubkey>,
  pub config: CollectiveConfigV0,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeCollectiveForSocialTokenV0Args {
  pub authority: Option<Pubkey>,
  pub config: CollectiveConfigV0,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateCollectiveV0Args {
  pub authority: Option<Pubkey>,
  pub config: CollectiveConfigV0,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct CollectiveConfigV0 {
  pub is_open: bool,
  pub unclaimed_token_metadata_settings: Option<TokenMetadataSettingsV0>,
  pub unclaimed_token_bonding_settings: Option<TokenBondingSettingsV0>,
  pub claimed_token_bonding_settings: Option<TokenBondingSettingsV0>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenMetadataSettingsV0 {
  pub symbol: Option<String>,
  pub uri: Option<String>,
  pub name_is_name_service_name: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct RoyaltySettingV0 {
  pub address: Option<Pubkey>, // Royalty must be at this address if set
  pub owned_by_name: bool, // If true, this account can be claimed by the name owner when they claim the token
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateOwnerV0Args {
  pub owner_token_ref_bump_seed: u8,
  pub primary_token_ref_bump_seed: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenBondingSettingsV0 {
  pub curve: Option<Pubkey>,
  pub min_sell_base_royalty_percentage: Option<u32>,
  pub min_sell_target_royalty_percentage: Option<u32>,
  pub max_sell_base_royalty_percentage: Option<u32>,
  pub max_sell_target_royalty_percentage: Option<u32>,
  pub min_buy_base_royalty_percentage: Option<u32>,
  pub min_buy_target_royalty_percentage: Option<u32>,
  pub max_buy_base_royalty_percentage: Option<u32>,
  pub max_buy_target_royalty_percentage: Option<u32>,
  pub target_mint_decimals: Option<u8>,
  pub buy_base_royalties: RoyaltySettingV0,
  pub sell_base_royalties: RoyaltySettingV0,
  pub buy_target_royalties: RoyaltySettingV0,
  pub sell_target_royalties: RoyaltySettingV0,
  pub min_purchase_cap: Option<u64>,
  pub max_purchase_cap: Option<u64>,
  pub min_mint_cap: Option<u64>,
  pub max_mint_cap: Option<u64>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SetAsPrimaryV0Args {
  pub bump_seed: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeSocialTokenV0Args {
  pub authority: Option<Pubkey>,
  pub name_parent: Option<Pubkey>,
  pub name_class: Option<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateTokenBondingV0ArgsWrapper {
  pub token_bonding_authority: Option<Pubkey>,
  /// Percentage of purchases that go to the founder
  /// Percentage Value is (founder_reward_percentage / u32.MAX_VALUE) * 100
  pub buy_base_royalty_percentage: u32,
  pub buy_target_royalty_percentage: u32,
  pub sell_base_royalty_percentage: u32,
  pub sell_target_royalty_percentage: u32,
  pub buy_frozen: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateCurveV0ArgsWrapper {
  pub curve_authority: Option<Pubkey>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct ChangeOptStatusUnclaimedV0Args {
  pub hashed_name: Vec<u8>,
  pub is_opted_out: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct ChangeOptStatusClaimedV0Args {
  pub is_opted_out: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateAuthorityV0Args {
  pub new_authority: Pubkey,
}
