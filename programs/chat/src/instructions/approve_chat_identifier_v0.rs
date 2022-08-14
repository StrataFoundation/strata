use crate::error::ErrorCode;
use crate::{
  metadata::{sign_metadata, SignMetadata},
  state::{CaseInsensitiveMarkerV0, NamespacesV0, MARKER_SIZE},
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
pub struct ApproveChatIdentifierV0<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,
  #[account(
    has_one = chat_namespace
  )]
  pub namespaces: Account<'info, NamespacesV0>,
  pub chat_namespace: Account<'info, Namespace>,
  #[account(
    mut,
    constraint = claim_request.namespace == chat_namespace.key()
  )]
  pub claim_request: Account<'info, ClaimRequest>,
  #[account(
    mut,
    constraint = entry.namespace == chat_namespace.key(),
    constraint = entry.name == claim_request.entry_name
  )]
  pub entry: Account<'info, Entry>,
  #[account(
    init,
    space = MARKER_SIZE,
    seeds = [b"case_insensitive", chat_namespace.key().as_ref(), entry.name.to_lowercase().as_bytes()],
    bump,
    payer = payer
  )]
  pub case_insensitive_marker: Box<Account<'info, CaseInsensitiveMarkerV0>>,
  /// CHECK: Checked via cpi and seeds
  #[account(mut)]
  pub certificate_mint_metadata: UncheckedAccount<'info>,
  pub namespaces_program: Program<'info, Namespaces>,
  #[account(
    constraint = token_metadata_program.key() == mpl_token_metadata::ID
  )]
  /// CHECK: Checked via constraint
  pub token_metadata_program: UncheckedAccount<'info>,
  pub system_program: Program<'info, System>,
}

const STRATA_KEY: &str = "BoA7rbEV5vgS5wQXwXrmf7j6cSao8pBToiZ45eHvo52L";

pub fn handler(ctx: Context<ApproveChatIdentifierV0>) -> Result<()> {
  let entry_name = &ctx.accounts.claim_request.entry_name;
  require!(
    entry_name
      .chars()
      .all(|c| char::is_alphanumeric(c) || c == '_' || c == '-'),
    ErrorCode::StringNotAlphanumeric
  );
  let requester = ctx.accounts.claim_request.requestor;
  if requester.to_string() != STRATA_KEY {
    require!(entry_name.len() >= 6, ErrorCode::InvalidStringLength);
  }

  ctx.accounts.case_insensitive_marker.bump = *ctx.bumps.get("case_insensitive_marker").unwrap();
  ctx.accounts.case_insensitive_marker.certificate_mint = ctx.accounts.entry.mint;

  let namespace_signer_seeds: &[&[&[u8]]] = &[&[b"namespaces", &[ctx.accounts.namespaces.bump]]];

  msg!("Approving claim request");
  update_claim_request(
    CpiContext::new_with_signer(
      ctx.accounts.namespaces_program.to_account_info(),
      UpdateClaimRequestCtx {
        name_entry: ctx.accounts.entry.to_account_info().clone(),
        namespace: ctx.accounts.chat_namespace.to_account_info(),
        approve_authority: ctx.accounts.namespaces.to_account_info(),
        rent_request: ctx.accounts.claim_request.to_account_info(),
      },
      namespace_signer_seeds,
    ),
    true,
  )?;

  msg!("Setting royalties");
  update_name_entry_mint_metadata(
    CpiContext::new_with_signer(
      ctx.accounts.namespaces_program.to_account_info(),
      UpdateNameEntryMintMetadataCtx {
        namespace: ctx.accounts.chat_namespace.to_account_info(),
        name_entry: ctx.accounts.entry.to_account_info(),
        update_authority: ctx.accounts.namespaces.to_account_info(),
        mint_metadata: ctx.accounts.certificate_mint_metadata.to_account_info(),
        token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
      },
      namespace_signer_seeds,
    ),
    UpdateNameEntryMintMetadataIx {
      seller_fee_basis_points: 500,
      creators: Some(vec![Creator {
        address: ctx.accounts.namespaces.key(),
        verified: false,
        share: 100,
      }]),
      primary_sale_happened: Some(true),
    },
  )?;

  msg!("Signing ourselves as the creator");
  sign_metadata(CpiContext::new_with_signer(
    ctx.accounts.namespaces_program.to_account_info(),
    SignMetadata {
      token_metadata: ctx.accounts.certificate_mint_metadata.to_account_info(),
      signer: ctx.accounts.namespaces.to_account_info(),
    },
    namespace_signer_seeds,
  ))?;

  Ok(())
}
