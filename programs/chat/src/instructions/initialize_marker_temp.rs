use crate::error::ErrorCode;
use crate::{
  metadata::{sign_metadata, SignMetadata},
  state::{NamespacesV0, CaseInsensitiveMarkerV0, MARKER_SIZE},
};
use anchor_lang::prelude::*;
use namespaces::{
  cpi::{
    accounts::{UpdateClaimRequestCtx, UpdateNameEntryMintMetadataCtx},
    update_claim_request, update_name_entry_mint_metadata,
  },
  instructions::{Creator, UpdateNameEntryMintMetadataIx},
  program::Namespaces,
  state::{ClaimRequest, Entry, Namespace},
};

#[derive(Accounts)]
pub struct InitializeMarkerTemp<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  pub namespace: Account<'info, Namespace>,
  #[account(
    constraint = entry.namespace == namespace.key(),
  )]
  pub entry: Account<'info, Entry>,
  #[account(
    init,
    space = MARKER_SIZE,
    seeds = [b"case_insensitive", namespace.key().as_ref(), entry.name.to_lowercase().as_bytes()],
    bump,
    payer = payer
  )]
  pub case_insensitive_marker: Box<Account<'info, CaseInsensitiveMarkerV0>>,
  pub system_program: Program<'info, System>,
}

const STRATA_KEY: &str = "BoA7rbEV5vgS5wQXwXrmf7j6cSao8pBToiZ45eHvo52L";

pub fn handler(ctx: Context<InitializeMarkerTemp>) -> Result<()> {
  let entry_name = &ctx.accounts.entry.name;
  require!(
    entry_name
      .chars()
      .all(|c| char::is_alphanumeric(c) || c == '_' || c == '-'),
    ErrorCode::StringNotAlphanumeric
  );

  ctx.accounts.case_insensitive_marker.bump = *ctx.bumps.get("case_insensitive_marker").unwrap();
  ctx.accounts.case_insensitive_marker.certificate_mint = ctx.accounts.entry.mint;

  Ok(())
}
