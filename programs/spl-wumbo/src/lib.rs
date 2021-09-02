use {
    anchor_lang::solana_program::program_pack::Pack,
    anchor_lang::{prelude::*, solana_program::system_program},
    anchor_spl::token::{self, InitializeAccount, Mint, TokenAccount},
    spl_token_bonding::{CurveV0, TokenBondingV0},
    spl_token_metadata::{self},
    spl_token_staking::TokenStakingV0,
};

const METADATA_UPDATE_PREFIX: &str = "metadata-update";
const WUMBO_PREFIX: &str = "wumbo";
const UNCLAIMED_REF_PREFIX: &str = "unclaimed-ref";
const CLAIMED_REF_PREFIX: &str = "claimed-ref";
const BONDING_PREFIX: &str = "bonding";
const FOUNDER_REWARDS_PREFIX: &str = "founder-rewards";
const REVERSE_TOKEN_REF_PREFIX: &str = "reverse-token-ref";

#[program]
pub mod spl_wumbo {
    use super::*;
    use anchor_lang::Key;

    pub fn initialize_wumbo(
        ctx: Context<InitializeWumbo>,
        args: InitializeWumboArgs,
    ) -> ProgramResult {
        let wumbo = &mut ctx.accounts.wumbo;

        wumbo.token_mint = *ctx.accounts.token_mint.to_account_info().key;
        wumbo.token_curve = *ctx.accounts.token_curve.to_account_info().key;
        wumbo.name_service_program = *ctx.accounts.name_service_program.key;
        wumbo.bump = args.bump;

        Ok(())
    }

    pub fn initialize_social_token_v0(
        ctx: Context<InitializeSocialTokenV0>,
        args: InitializeSocialTokenV0Args,
    ) -> ProgramResult {
        let token_ref = &mut ctx.accounts.token_ref;
        let reverse_token_ref = &mut ctx.accounts.reverse_token_ref;

        if !(args.token_ref_prefix.as_bytes() == UNCLAIMED_REF_PREFIX.as_bytes()
            || args.token_ref_prefix.as_bytes() == CLAIMED_REF_PREFIX.as_bytes())
        {
            return Err(ErrorCode::InvalidTokenRefPrefix.into());
        }

        if (args.token_ref_seed != (*ctx.accounts.name.to_account_info().key).to_bytes())
            || (*ctx.accounts.name_owner.to_account_info().key == Pubkey::default()
                || args.token_ref_seed
                    != (*ctx.accounts.name_owner.to_account_info().key).to_bytes())
        {
            return Err(ErrorCode::InvalidTokenRefSeed.into());
        }

        token_ref.wumbo = *ctx.accounts.wumbo.to_account_info().key;
        token_ref.token_bonding = *ctx.accounts.token_bonding.to_account_info().key;
        token_ref.token_staking = *ctx.accounts.token_staking.to_account_info().key;
        token_ref.bump = args.token_ref_bump;
        reverse_token_ref.wumbo = *ctx.accounts.wumbo.to_account_info().key;
        reverse_token_ref.token_bonding = *ctx.accounts.token_bonding.to_account_info().key;
        reverse_token_ref.token_staking = *ctx.accounts.token_staking.to_account_info().key;
        reverse_token_ref.bump = args.reverse_token_ref_bump;

        if (*ctx.accounts.name_owner.to_account_info().key != Pubkey::default()) {
            token_ref.owner = Some(*ctx.accounts.name_owner.to_account_info().key);
            reverse_token_ref.owner = Some(*ctx.accounts.name_owner.to_account_info().key);
        } else {
            token_ref.name = Some(*ctx.accounts.name.to_account_info().key);
            reverse_token_ref.name = Some(*ctx.accounts.name.to_account_info().key);
        }

        Ok(())
    }

    // pub fn opt_out_v0() -> ProgramResult {}
    // pub fn opt_in_v0() -> ProgramResult {}
    // pub fn create_token_metadata() -> ProgramResult {}
    // pub fn update_token_metadata() -> ProgramResult {}
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeWumboArgs {
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeSocialTokenV0Args {
    pub token_ref_prefix: String,
    pub token_ref_seed: Vec<u8>,
    pub token_ref_bump: u8,
    pub reverse_token_ref_bump: u8,
}

#[derive(Accounts)]
#[instruction(args: InitializeWumboArgs)]
pub struct InitializeWumbo<'info> {
    #[account(init, seeds = [WUMBO_PREFIX.as_bytes(), token_mint.to_account_info().key.as_ref()], payer=payer, bump=args.bump, space=1000)]
    pub wumbo: ProgramAccount<'info, Wumbo>,
    pub token_mint: CpiAccount<'info, Mint>,
    pub token_curve: CpiAccount<'info, CurveV0>,
    // #[account(address = spl_name_service::id())]
    // TODO: cargo wont import file from git repository
    pub name_service_program: AccountInfo<'info>,
    #[account(mut, signer)]
    pub payer: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]
pub struct InitializeSocialTokenV0<'info> {
    #[account(seeds = [WUMBO_PREFIX.as_bytes(), wumbo.token_mint.as_ref(), &[wumbo.bump]])]
    pub wumbo: ProgramAccount<'info, Wumbo>,
    pub token_bonding: CpiAccount<'info, TokenBondingV0>,
    pub token_staking: CpiAccount<'info, TokenStakingV0>,
    #[account(
        init,
        seeds = [
            args.token_ref_prefix.as_bytes(),
            wumbo.to_account_info().key.as_ref(),
            &args.token_ref_seed
        ],
        bump = args.token_ref_bump,
        payer = payer,
        space = 1000
    )]
    pub token_ref: ProgramAccount<'info, TokenRefV0>,
    #[account(
        init,
        seeds = [
            REVERSE_TOKEN_REF_PREFIX.as_bytes(),
            wumbo.to_account_info().key.as_ref(),
            token_bonding.to_account_info().key.as_ref()
        ],
        bump = args.reverse_token_ref_bump,
        payer = payer,
        space = 1000
    )]
    pub reverse_token_ref: ProgramAccount<'info, TokenRefV0>,
    pub founder_rewards_account: AccountInfo<'info>,
    pub name: AccountInfo<'info>,
    pub name_owner: AccountInfo<'info>,
    #[account(mut, signer)]
    pub payer: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(Default)]
pub struct Wumbo {
    pub token_mint: Pubkey,
    pub token_curve: Pubkey,
    pub name_service_program: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(Default)]
pub struct TokenRefV0 {
    pub wumbo: Pubkey,
    pub token_bonding: Pubkey,
    pub token_staking: Pubkey,
    pub name: Option<Pubkey>,
    pub owner: Option<Pubkey>,
    pub bump: u8,
}

#[error]
pub enum ErrorCode {
    #[msg("Invalid token ref prefix")]
    InvalidTokenRefPrefix,

    #[msg("Invalid token ref seed")]
    InvalidTokenRefSeed,

    #[msg("Name program id did not match expected for this wumbo instance")]
    InvalidNameProgramId,

    #[msg("Account does not have correct owner!")]
    IncorrectOwner,
}
