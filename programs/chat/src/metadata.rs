use anchor_lang::{prelude::*, solana_program};

#[derive(Accounts)]
pub struct SignMetadata<'info> {
  /// CHECK: Checked with cpi
  #[account(mut)]
  pub token_metadata: AccountInfo<'info>,
  /// CHECK: Checked with cpi
  #[account(signer)]
  pub signer: AccountInfo<'info>,
}

pub fn sign_metadata<'a, 'b, 'c, 'info>(
  ctx: CpiContext<'a, 'b, 'c, 'info, SignMetadata<'info>>,
) -> Result<()> {
  let ix = mpl_token_metadata::instruction::sign_metadata(
    mpl_token_metadata::ID,
    *ctx.accounts.token_metadata.key,
    *ctx.accounts.signer.key,
  );

  solana_program::program::invoke_signed(
    &ix,
    &[
      ctx.accounts.token_metadata.clone(),
      ctx.accounts.signer.clone(),
      ctx.program.clone(),
    ],
    ctx.signer_seeds,
  )
  .map_err(|e| e.into())
}
