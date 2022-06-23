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

pub const CHAT_SIZE: usize = 8 + std::mem::size_of::<ChatV0>() + 80 + 100 + 200 + 200; // padding

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
  pub name: String,                        // limit 100 characters (puffed)
  pub image_url: String,                   // limit 200 characters (puffed)
  pub metadata_url: String,                // limit 200 characters (puffed)
  pub post_pay_destination: Option<Pubkey>,
}

pub const PROFILE_SIZE: usize = 8 + std::mem::size_of::<ProfileV0>() + 200 + 200 + 80; // padding

#[account]
#[derive(Default)]
pub struct ProfileV0 {
  pub bump: u8,
  pub owner_wallet: Pubkey,
  pub identifier_certificate_mint: Pubkey, // The certificate of the primary identifier for this profile
  pub image_url: String,                   // limit 200 characters (puffed). Can just be empty.
  pub metadata_url: String,                // limit 200 characters (puffed)
}

pub const DELEGATE_WALLET_SIZE: usize = 8 + std::mem::size_of::<DelegateWalletV0>() + 80; // padding

#[account]
#[derive(Default)]
pub struct DelegateWalletV0 {
  pub owner_wallet: Pubkey,
  // Most wallets do not allow for auto approve tx. So we create a local
  // wallet that will sign messages, and you just sign once saying that your
  // wallet is the owner and is delegating this wallet to sign.
  pub delegate_wallet: Pubkey,
}


pub const MARKER_SIZE: usize = 8 + std::mem::size_of::<CaseInsensitiveMarkerV0>() + 80; // padding

// Exists only to mark that a username or domain with that name case insenstive exists
#[account]
#[derive(Default)]
pub struct CaseInsensitiveMarkerV0 {
  pub bump: u8,
  pub certificate_mint: Pubkey
}
