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

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum PermissionType {
  Token,
  NFT,
  Native,
}

impl Default for PermissionType {
  fn default() -> Self {
    PermissionType::Token
  }
}

#[derive(PartialEq, AnchorSerialize, AnchorDeserialize, Clone)]
pub enum ChatType {
  Identified,
  Unidentified,
}

impl Default for ChatType {
  fn default() -> Self {
    ChatType::Identified
  }
}

#[account]
#[derive(Default)]
pub struct ChatV0 {
  pub bump: u8,
  pub chat_type: ChatType,
  pub name: String,
  pub image_url: String,
  pub metadata_url: String,
  /** For maximum composability, you can plug in your own chat program for gating send message. */
  pub post_message_program_id: Pubkey, // Default: CHAT
  /*
  The admin of this chat
  */
  pub admin: Option<Pubkey>,
  pub identifier_certificate_mint: Option<Pubkey>,
}

//
// PDA["permissions", chat]
#[account]
#[derive(Default)]
pub struct ChatPermissionsV0 {
  pub bump: u8,
  pub chat: Pubkey,
  pub post_permission_type: PermissionType,
  pub read_permission_type: PermissionType,
  pub post_permission_key: Pubkey, // Permission keys can be a token mint or an nft collection
  pub read_permission_key: Pubkey,
  pub post_permission_amount: u64,
  pub default_read_permission_amount: u64, // The default amount for read permission. Some messages may be more.
  pub post_permission_action: PostAction,
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
  pub certificate_mint: Pubkey,
}
