use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum PostAction {
  Hold,
  Burn,
  Pay,
}

impl Default for PostAction {
  fn default() -> Self {
    PostAction::Hold
  }
}

pub const NAMESPACES_SIZE: usize = 8 + std::mem::size_of::<NamespacesV0>() + 80; // padding

#[account]
#[derive(Default)]
pub struct NamespacesV0 {
  pub bump: u8,
  pub chat_namespace: Pubkey,
  pub user_namespace: Pubkey,
}

#[account]
#[derive(Default)]
pub struct ChatV0 {
  pub bump: u8,
  pub post_permission_key: Pubkey,         // Permission keys can be a token mint or an nft collection
  pub read_permission_key: Pubkey,
  pub post_permission_amount: u64,
  pub default_read_permission_amount: u64,
  pub post_permission_action: PostAction,
  pub identifier_certificate_mint: Pubkey, // The certificate of the primary identifier for this chat
  pub name: String,
  pub image_url: String,
  pub metadata_url: String,
  pub post_pay_destination: Option<Pubkey>,
}

#[account]
#[derive(Default)]
pub struct ProfileV0 {
  pub bump: u8,
  pub owner_wallet: Pubkey,
  pub identifier_certificate_mint: Pubkey, // The certificate of the primary identifier for this profile
  pub image_url: String,
  pub metadata_url: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ChatSettingsV0 {
  pub identifier: String,
  pub audio_notifications: bool,
  pub desktop_notifications: bool,
  pub mobile_notifications: bool,
}

impl Default for ChatSettingsV0 {
  fn default() -> Self {
    ChatSettingsV0 {
      identifier: "".to_string(),
      audio_notifications: true,
      desktop_notifications: false,
      mobile_notifications: false
    }
  }
}

#[account]
#[derive(Default)]
pub struct SettingsV0 {
  pub bump: u8,
  pub owner_wallet: Pubkey,
  pub encrypted_delegate_wallet: String,
  pub encrypted_symmetric_key: String,
}

pub const DELEGATE_WALLET_SIZE: usize = 8 + std::mem::size_of::<DelegateWalletV0>();

#[account]
#[derive(Default)]
pub struct DelegateWalletV0 {
  pub owner_wallet: Pubkey,
  // Most wallets do not allow for auto approve tx. So we create a local
  // wallet that will sign messages, and you just sign once saying that your
  // wallet is the owner and is delegating this wallet to sign.
  pub delegate_wallet: Pubkey,
}


pub const MARKER_SIZE: usize = 8 + std::mem::size_of::<CaseInsensitiveMarkerV0>();

// Exists only to mark that a username or domain with that name case insenstive exists
#[account]
#[derive(Default)]
pub struct CaseInsensitiveMarkerV0 {
  pub bump: u8,
  pub certificate_mint: Pubkey
}
