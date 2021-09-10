use {
    anchor_lang::solana_program::program_pack::Pack,
    anchor_lang::{prelude::*, solana_program::system_program},
    anchor_spl::token::{self, InitializeAccount, Mint, TokenAccount},
    borsh::{BorshDeserialize, BorshSerialize},
    spl_token_metadata::{
        instruction::{update_metadata_accounts},
        state::{MAX_NAME_LENGTH, MAX_SYMBOL_LENGTH, MAX_URI_LENGTH}
    },
    spl_token_bonding::{CurveV0, TokenBondingV0},
    spl_token_staking::{TokenStakingV0},
};

#[program]
pub mod spl_wumbo {
    use super::*;

    pub fn initialize_wumbo(
        ctx: Context<InitializeWumbo>,
        args: InitializeWumboArgs,
    ) -> ProgramResult {
        let wumbo = &mut ctx.accounts.wumbo;

        wumbo.mint = *ctx.accounts.mint.to_account_info().key;
        wumbo.curve = *ctx.accounts.curve.to_account_info().key;
        wumbo.token_metadata_defaults = args.token_metadata_defaults;
        wumbo.token_bonding_defaults = args.token_bonding_defaults;
        wumbo.token_staking_defaults = args.token_staking_defaults;
        wumbo.bump_seed = args.bump_seed;

        Ok(())
    }

    pub fn initialize_social_token_v0(
        ctx: Context<InitializeSocialTokenV0>,
        args: InitializeSocialTokenV0Args,
    ) -> ProgramResult {
        let token_ref = &mut ctx.accounts.token_ref;
        let reverse_token_ref_bonding = &mut ctx.accounts.reverse_token_ref_bonding;
        let reverse_token_ref_staking = &mut ctx.accounts.reverse_token_ref_staking;

        // if (
        //     args.token_ref_seed != (*ctx.accounts.name.to_account_info().key).to_bytes() &&
        //     args.token_ref_seed != (*ctx.accounts.name_owner.to_account_info().key).to_bytes()
        // ) || (
        //     args.token_ref_seed == (*ctx.accounts.name_owner.to_account_info().key).to_bytes() &&
        //     *ctx.accounts.name_owner.to_account_info().key == Pubkey::default()
        // ) {
        //     return Err(ErrorCode::InvalidTokenRefSeed.into());
        // }

        // if name_owner != default pub key
        // decode name record and make sure ===

        token_ref.wumbo = *ctx.accounts.wumbo.to_account_info().key;
        token_ref.token_bonding = *ctx.accounts.token_bonding.to_account_info().key;
        token_ref.token_staking = *ctx.accounts.token_staking.to_account_info().key;
        token_ref.bump_seed = args.token_ref_bump_seed;

        reverse_token_ref_bonding.wumbo = *ctx.accounts.wumbo.to_account_info().key;
        reverse_token_ref_bonding.token_bonding = *ctx.accounts.token_bonding.to_account_info().key;
        reverse_token_ref_bonding.token_staking = *ctx.accounts.token_staking.to_account_info().key;
        reverse_token_ref_bonding.bump_seed = args.reverse_token_ref_bonding_bump_seed;

        reverse_token_ref_staking.wumbo = *ctx.accounts.wumbo.to_account_info().key;
        reverse_token_ref_staking.token_bonding = *ctx.accounts.token_bonding.to_account_info().key;
        reverse_token_ref_staking.token_staking = *ctx.accounts.token_staking.to_account_info().key;
        reverse_token_ref_staking.bump_seed = args.reverse_token_ref_staking_bump_seed;

        // if (*ctx.accounts.name_owner.to_account_info().key != Pubkey::default()) {
        //     token_ref.owner = Some(*ctx.accounts.name_owner.to_account_info().key);
        //     reverse_token_ref_bonding.owner = Some(*ctx.accounts.name_owner.to_account_info().key);
        //     reverse_token_ref_staking.owner = Some(*ctx.accounts.name_owner.to_account_info().key);
        // } else {
        //     token_ref.name = Some(*ctx.accounts.name.to_account_info().key);
        //     reverse_token_ref_bonding.name = Some(*ctx.accounts.name.to_account_info().key);
        //     reverse_token_ref_staking.name = Some(*ctx.accounts.name.to_account_info().key);
        // }

        Ok(())
    }

    // pub fn update_token_metadata(
    //     ctx: Context<UpdateSocialTokenMetadata>,
    //     args: UpdateSocialTokenMetadataArgs
    // ) -> ProgramResult {
    //     Ok(())
    // }

    // pub fn opt_out_v0() -> ProgramResult {}
    // pub fn opt_in_v0() -> ProgramResult {}
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeWumboArgs {
    pub bump_seed: u8,
    pub token_metadata_defaults: TokenMetadataDefaults,
    pub token_bonding_defaults: TokenBondingDefaults,
    pub token_staking_defaults: TokenStakingDefaults,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenMetadataDefaults {
    pub symbol: String,
    pub name: String,
    pub arweave_uri: String,
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenBondingDefaults {
    pub curve: Pubkey,
    pub base_royalty_percentage: u32,
    pub target_royalty_percentage: u32,
    pub target_mint_decimals: u8,
    pub buy_frozen: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenStakingDefaults {
    pub period_unit: PeriodUnit,
    pub period: u32,
    pub target_mint_decimals: u8,
    pub reward_percent_per_period_per_lockup_period: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeSocialTokenV0Args {
    pub token_ref_seed: Pubkey,

    pub wumbo_bump_seed: u8,
    pub token_bonding_bump_seed: u8,
    pub token_bonding_authority_bump_seed: u8,
    pub token_staking_bump_seed: u8,
    pub token_staking_authority_bump_seed: u8,
    pub token_ref_bump_seed: u8,
    pub reverse_token_ref_bonding_bump_seed: u8,
    pub reverse_token_ref_staking_bump_seed: u8,
    pub token_metadata_update_authority_bump_seed: u8,
}

#[derive(Accounts)]
#[instruction(args: InitializeWumboArgs)]
pub struct InitializeWumbo<'info> {
    #[account(init, seeds = [b"wumbo", mint.to_account_info().key.as_ref()], payer=payer, bump=args.bump_seed, space=1000)]
    wumbo: ProgramAccount<'info, Wumbo>,
    mint: CpiAccount<'info, Mint>,
    curve: CpiAccount<'info, CurveV0>,

    #[account(mut, signer)]
    payer: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    system_program: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: InitializeSocialTokenV0Args)]
pub struct InitializeSocialTokenV0<'info> {
    #[account(seeds = [b"wumbo", wumbo.mint.as_ref(), &[wumbo.bump_seed]])]
    wumbo: ProgramAccount<'info, Wumbo>,
    token_metadata: ProgramAccount<'info, Metadata>,
    token_metadata_update_authority: AccountInfo<'info>,
    #[account(
        constraint = token_bonding.authority.ok_or::<ProgramError>(ErrorCode::NoBondingAuthority.into())? == *wumbo.to_account_info().key,
        constraint = token_bonding.curve == wumbo.curve,
    )]
    token_bonding: CpiAccount<'info, TokenBondingV0>,
    token_bonding_authority: AccountInfo<'info>,
    #[account(
        constraint = token_staking.authority.ok_or::<ProgramError>(ErrorCode::NoStakingAuthority.into())? == *wumbo.to_account_info().key,
        constraint = token_staking.base_mint == token_bonding.base_mint,
    )]
    token_staking: CpiAccount<'info, TokenStakingV0>,
    token_staking_authority: AccountInfo<'info>,
    #[account(
        init,
        seeds = [
            b"token-ref",
            wumbo.to_account_info().key.as_ref(),
            &args.token_ref_seed.as_ref() // public key that is either wallet or nameRegistryState.owner
        ],
        bump = args.token_ref_bump_seed,
        payer = payer,
        space = 1000
    )]
    token_ref: ProgramAccount<'info, TokenRefV0>,
    #[account(
        init,
        seeds = [
            b"reverse-token-ref",
            wumbo.to_account_info().key.as_ref(),
            token_bonding.to_account_info().key.as_ref()
        ],
        bump = args.reverse_token_ref_bonding_bump_seed,
        payer = payer,
        space = 1000
    )]
    reverse_token_ref_bonding: ProgramAccount<'info, TokenRefV0>,
    #[account(
        init,
        seeds = [
            b"reverse-token-ref",
            wumbo.to_account_info().key.as_ref(),
            token_staking.to_account_info().key.as_ref()
        ],
        bump = args.reverse_token_ref_staking_bump_seed,
        payer = payer,
        space = 1000
    )]
    reverse_token_ref_staking: ProgramAccount<'info, TokenRefV0>,
    name: AccountInfo<'info>,
    // if creating a claimed token need to verify name * nameOwner match update
    // nameOwner == signer
    #[account(
        constraint = name_owner.is_signer || *name_owner.to_account_info().key == Pubkey::default(),
    )]
    name_owner: AccountInfo<'info>,

    #[account(mut, signer)]
    payer: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    system_program: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(Default)]
pub struct Wumbo {
    pub mint: Pubkey,
    pub curve: Pubkey,
    pub token_metadata_defaults: TokenMetadataDefaults,
    pub token_bonding_defaults: TokenBondingDefaults,
    pub token_staking_defaults: TokenStakingDefaults,

    pub bump_seed: u8,
}

#[account]
#[derive(Default)]
pub struct Metadata {
    pub uuid: String,
    /// The symbol for the asset
    pub symbol: String,
    /// Royalty basis points that goes to creators in secondary sales (0-10000)
    pub seller_fee_basis_points: u16,
    pub creators: Vec<Creator>
}

#[account]
#[derive(Default)]
pub struct TokenRefV0 {
    pub wumbo: Pubkey,
    pub token_bonding: Pubkey,
    pub token_staking: Pubkey,
    pub name: Option<Pubkey>,
    pub owner: Option<Pubkey>,
    pub is_claimed: bool,

    pub bump_seed: u8,
    pub wumbo_bump_seed: u8,
    pub token_bonding_bump_seed: u8,
    pub token_staking_bump_seed: u8,
}

// Unfortunate duplication so that IDL picks it up.
#[repr(C)]
#[derive(BorshSerialize, BorshDeserialize, PartialEq, Debug, Clone)]
pub enum PeriodUnit {
    SECOND,
    MINUTE,
    HOUR,
    DAY,
    YEAR,
}

impl Default for PeriodUnit {
    fn default() -> Self {
        PeriodUnit::HOUR
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Creator {
    pub address: Pubkey,
    pub verified: bool,
    // In percentages, NOT basis points ;) Watch out!
    pub share: u8,
}

#[error]
pub enum ErrorCode {
    #[msg("Invalid token ref prefix")]
    InvalidTokenRefPrefix,

    #[msg("Invalid token ref seed")]
    InvalidTokenRefSeed,

    #[msg("Token bonding does not have an authority")]
    NoBondingAuthority,

    #[msg("Token bonding does not have an authority")]
    NoStakingAuthority,

    #[msg("Name program id did not match expected for this wumbo instance")]
    InvalidNameProgramId,

    #[msg("Account does not have correct owner!")]
    IncorrectOwner,
}
