use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum PostAction {
  Hold,
  Burn,
  Pay
}

impl Default for PostAction {
  fn default() -> Self {
    PostAction::Hold
  }
}

#[account]
#[derive(Default)]
pub struct ChatV0 {
  pub bump: u8,
  pub admin: Pubkey,
  pub post_permission_mint_or_collection: Pubkey,
  pub read_permission_mint_or_collection: Pubkey, // Not used by program since blockchain is public, enforced by lit protocol
  pub post_permission_amount: u64,
  pub default_read_permission_amount: u64,
  pub post_permission_action: PostAction,
  pub post_pay_destination: Option<Pubkey>,
  pub identifier_certificate_mint: PublicKey, // The certificate of the primary identifier for this chat
  pub name: String, // limit 100 characters (puffed)
  pub image_url: String, // limit 200 characters (puffed)
  pub metadata_url: String, // limit 200 characters (puffed)
}

#[account]
#[derive(Default)]
pub struct ProfileV0 {
  pub bump: u8,
  pub owner_wallet: Pubkey,
  pub identifier_certificate_mint: Pubkey, // The certificate of the primary identifier for this profile
  pub image_url: String, // limit 200 characters (puffed). Can just be empty.
  pub metadata_url: String, // limit 200 characters (puffed)
  pub image_mint: Option<Pubkey>, // Image as an NFT instead of as a url.
}

#[account]
#[derive(Default)]
pub struct DelegateWalletV0 {
  pub owner_wallet: Pubkey,
    // Most wallets do not allow for auto approve tx. So we create a local
  // wallet that will sign messages, and you just sign once saying that your
  // wallet is the owner and is delegating this wallet to sign.
  pub delegate_wallet: Pubkey,
}
