use anchor_lang::prelude::*;

use crate::state::PermissionType;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum MessageType {
  Text,
  Html,
  Gify,
  Image,
  React, // An emoji react to another message
}

impl Default for MessageType {
  fn default() -> Self {
    MessageType::Text
  }
}

#[event]
pub struct MessagePartEventV0 {
  pub chat: Pubkey,
  pub sender: Pubkey,
  pub signer: Pubkey,
  pub message: MessagePartV0,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct MessagePartV0 {
  pub id: String, // uuid v4
  // Content can be too large for a single tx... Indicate the total parts and the current part.
  pub total_parts: u16,
  pub current_part: u16,
  pub read_permission_amount: u64,
  pub encrypted_symmetric_key: String,
  pub content: String,
  pub condition_version: u8,
  pub message_type: MessageType,
  pub reference_message_id: Option<String>,
  pub read_permission_key: Pubkey,
  pub read_permission_type: PermissionType,
}
