use namespaces::{state::{Namespace, ClaimRequest, Entry}, cpi::{update_claim_request, accounts::{UpdateClaimRequestCtx, UpdateEntryMintMetadataCtx}, update_entry_mint_metadata}, program::Namespaces, instructions::{Creator, UpdateEntryMintMetadataIx}};
use crate::{state::NamespacesV0, metadata::{sign_metadata,SignMetadata}};
use anchor_lang::{prelude::*, solana_program};
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct ApproveUserIdentifierV0<'info> {
  #[account(
    has_one = user_namespace
  )]
  pub namespaces: Account<'info, NamespacesV0>,
  pub user_namespace: Account<'info, Namespace>,
  #[account(
    mut,
    constraint = claim_request.namespace == user_namespace.key()
  )]
  pub claim_request: Account<'info, ClaimRequest>,
  #[account(
    mut,
    constraint = entry.namespace == user_namespace.key(),
    constraint = entry.name == claim_request.entry_name
  )]
  pub entry: Account<'info, Entry>,
  /// CHECK: Checked via cpi and seeds
  #[account(mut)]
  pub certificate_mint_metadata: UncheckedAccount<'info>,
  pub namespaces_program: Program<'info, Namespaces>,
  #[account(
    constraint = token_metadata_program.key() == mpl_token_metadata::ID
  )]
  /// CHECK: Checked via constraint
  pub token_metadata_program: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<ApproveUserIdentifierV0>) -> Result<()> {
  let entry_name = &ctx.accounts.claim_request.entry_name;
  require!(entry_name.chars().all(|c| char::is_alphanumeric(c) || c == '_' || c == '-'), ErrorCode::StringNotAlphanumeric);
  require!(entry_name.len() >= 6, ErrorCode::InvalidStringLength);

  let namespace_signer_seeds: &[&[&[u8]]] = &[&[
    b"namespaces",
    &[ctx.accounts.namespaces.bump],
  ]];

  msg!("Approving claim request");
  update_claim_request(
    CpiContext::new_with_signer(
      ctx.accounts.namespaces_program.to_account_info(),
      UpdateClaimRequestCtx {
        namespace: ctx.accounts.user_namespace.to_account_info(),
        approve_authority: ctx.accounts.namespaces.to_account_info(),
        rent_request: ctx.accounts.claim_request.to_account_info(),
      },
      namespace_signer_seeds
    ),
    true
  )?;

  msg!("Setting royalties");
  update_entry_mint_metadata(
    CpiContext::new_with_signer(
    ctx.accounts.namespaces_program.to_account_info(),
      UpdateEntryMintMetadataCtx {
        namespace: ctx.accounts.user_namespace.to_account_info(),
        entry: ctx.accounts.entry.to_account_info(),
        approve_authority: ctx.accounts.namespaces.to_account_info(),
        certificate_mint_metadata: ctx.accounts.certificate_mint_metadata.to_account_info(),
        token_metadata_program: ctx.accounts.token_metadata_program.to_account_info(),
      },
      namespace_signer_seeds
    ),
    UpdateEntryMintMetadataIx {
      seller_fee_basis_points: 500,
      creators: Some(vec!(Creator {
        address: ctx.accounts.namespaces.key(),
        verified: false,
        share: 100
      })),
      primary_sale_happened: Some(true)
    }
  )?;

  msg!("Signing ourselves as the creator");
  sign_metadata(
    CpiContext::new_with_signer(
    ctx.accounts.namespaces_program.to_account_info(),
      SignMetadata {
        token_metadata: ctx.accounts.certificate_mint_metadata.to_account_info(),
        signer: ctx.accounts.namespaces.to_account_info(),
      },
      namespace_signer_seeds
    )
  )?;
  
  Ok(())
}
