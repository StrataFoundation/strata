use anchor_lang::solana_program::program_pack::Pack;
use anchor_lang::{prelude::*, solana_program::system_program};
use anchor_spl::token::{self, InitializeAccount, Mint, TokenAccount};
use spl_token_bonding::{CurveV0, TokenBondingV0};
use spl_token_staking::TokenStakingV0;

#[program]
pub mod spl_wumbo {
    use super::*;

    pub fn initialize_wumbo_v0(
        ctx: Context<InitializeWumboV0>,
        args: InitializeWumboV0Args,
    ) -> ProgramResult {
        let wumbo_instance = &mut ctx.accounts.wumbo_instance;

        wumbo_instance.wumbo_mint = *ctx.accounts.wumbo_mint.to_account_info().key;
        wumbo_instance.base_curve = *ctx.accounts.base_curve.to_account_info().key;
        wumbo_instance.name_program_id = *ctx.accounts.name_program_id.to_account_info().key;
        wumbo_instance.bump_seed = args.wumbo_instance_bump_seed;

        Ok(())
    }

    pub fn initialize_social_token_v0(
        ctx: Context<InitializeSocialTokenV0>,
        args: InitializeSocialTokenV0Args,
    ) -> ProgramResult {
        let token_ref = &mut ctx.accounts.token_ref;
        let reverse_token_ref = &mut ctx.accounts.reverse_token_ref;

        token_ref.wumbo_instance = *ctx.accounts.wumbo_instance.to_account_info().key;
        token_ref.token_bonding = *ctx.accounts.token_bonding.to_account_info().key;
        token_ref.name = *ctx.accounts.name.to_account_info().key;
        token_ref.bump_seed = args.token_ref_bump_seed;

        if let Some(v) = args.name_owner {
            token_ref.owner = v;
        } else {
            token_ref.owner = *ctx.accounts.wumbo_instance.to_account_info().key;
        }

        reverse_token_ref.wumbo_instance = *ctx.accounts.wumbo_instance.to_account_info().key;
        reverse_token_ref.token_bonding = *ctx.accounts.token_bonding.to_account_info().key;
        reverse_token_ref.bump_seed = args.reverse_token_ref_bump_seed;

        Ok(())
    }

    // pub fn opt_out_v0() -> ProgramResult {}
    // pub fn opt_in_v0() -> ProgramResult {}
    // pub fn create_token_metadata() -> ProgramResult {}
    // pub fn update_token_metadata() -> ProgramResult {}
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeWumboV0Args {
    pub wumbo_instance_bump_seed: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeSocialTokenV0Args {
    pub token_ref_bump_seed: u8,
    pub reverse_token_ref_bump_seed: u8,
    pub name_owner: Option<Pubkey>,
}

#[derive(Accounts)]
#[instruction(args: InitializeWumboV0Args)]
pub struct InitializeWumboV0<'info> {
    #[account(signer)]
    pub payer: AccountInfo<'info>,
    pub wumbo_mint: CpiAccount<'info, Mint>,
    pub base_curve: CpiAccount<'info, CurveV0>,
    pub name_program_id: AccountInfo<'info>,
    #[account(
        init,
        seeds = [b"wumbo", wumbo_mint.to_account_info().key.as_ref()],
        bump = args.wumbo_instance_bump_seed,
        payer = payer,
        space = 1000,
    )]
    pub wumbo_instance: ProgramAccount<'info, WumboV0>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]
pub struct InitializeSocialTokenV0<'info> {
    #[account(mut, signer)]
    pub payer: AccountInfo<'info>,
    pub wumbo_instance: AccountInfo<'info>,
    #[account(
        init,
        seeds = [
            b"token-ref",
            wumbo_instance.to_account_info().key.as_ref(),
            token_bonding.to_account_info().key.as_ref(),
            token_staking.to_account_info().key.as_ref()
        ],
        bump = args.token_ref_bump_seed,
        payer = payer,
        space = 1000,
    )]
    pub token_ref: ProgramAccount<'info, TokenRefV0>,
    #[account(
        init,
        seeds = [
            b"reverse-token-ref",
            wumbo_instance.to_account_info().key.as_ref(),
            token_bonding.to_account_info().key.as_ref(),
            token_staking.to_account_info().key.as_ref()
        ],
        bump = args.reverse_token_ref_bump_seed,
        payer = payer,
        space = 1000,
    )]
    pub reverse_token_ref: ProgramAccount<'info, ReverseTokenRefV0>,
    pub token_bonding: CpiAccount<'info, TokenBondingV0>,
    pub token_staking: CpiAccount<'info, TokenStakingV0>,
    pub name: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(Default)]
pub struct WumboV0 {
    pub wumbo_mint: Pubkey,
    pub base_curve: Pubkey,
    pub name_program_id: Pubkey,

    pub bump_seed: u8,
}

#[account]
#[derive(Default)]
pub struct ReverseTokenRefV0 {
    pub wumbo_instance: Pubkey,
    pub token_bonding: Pubkey,

    pub bump_seed: u8,
}

#[account]
#[derive(Default)]
pub struct TokenRefV0 {
    pub wumbo_instance: Pubkey,
    pub token_bonding: Pubkey,
    pub name: Pubkey,
    pub owner: Pubkey,

    pub bump_seed: u8,
}
