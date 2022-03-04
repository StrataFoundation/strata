use crate::{error::ErrorCode, state::*};
use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct UpdateReserveAuthorityV0Args {
  pub new_reserve_authority: Option<Pubkey>,
}

#[derive(Accounts)]
#[instruction(args: UpdateReserveAuthorityV0Args)]
pub struct UpdateReserveAuthorityV0<'info> {
  #[account(
    mut,
    constraint = token_bonding.reserve_authority.ok_or(error!(ErrorCode::NoAuthority))? == reserve_authority.key(),
  )]
  pub token_bonding: Box<Account<'info, TokenBondingV0>>,
  pub reserve_authority: Signer<'info>,
}

pub fn handler(
  ctx: Context<UpdateReserveAuthorityV0>,
  args: UpdateReserveAuthorityV0Args,
) -> Result<()> {
  ctx.accounts.token_bonding.reserve_authority = args.new_reserve_authority;
  Ok(())
}
