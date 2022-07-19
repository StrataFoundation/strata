use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeChatArgsV0 {
  pub name: String,
  pub image_url: String,
  pub metadata_url: String,
  pub post_message_program_id: Pubkey, // Default: chat program
}
