use {
    anchor_lang::solana_program::program_pack::Pack,
    anchor_lang::{prelude::*, solana_program::system_program},
    anchor_spl::token::{self, InitializeAccount, Mint, TokenAccount},
    spl_token_metadata::{
        instruction::{create_metadata_accounts, update_metadata_accounts},
        state::{MAX_NAME_LENGTH, MAX_SYMBOL_LENGTH}
    },
    spl_token_bonding::{CurveV0, TokenBondingV0},
    spl_token_staking::{TokenStakingV0, PeriodUnit},
};

const METADATA_UPDATE_PREFIX: &str = "metadata-update";
const WUMBO_PREFIX: &str = "wumbo";
const UNCLAIMED_REF_PREFIX: &str = "unclaimed-ref";
const CLAIMED_REF_PREFIX: &str = "claimed-ref";
const REVERSE_TOKEN_REF_PREFIX: &str = "reverse-token-ref";
const BONDING_PREFIX: &str = "bonding";

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
        wumbo.metadata_defaults = args.metadata_defaults;
        wumbo.token_bonding_defaults = args.token_bonding_defaults;
        wumbo.token_staking_defaults = args.token_staking_defaults;
        wumbo.bump = args.bump;

        Ok(())
    }

    pub fn initialize_social_token_v0(
        ctx: Context<InitializeSocialTokenV0>,
        args: InitializeSocialTokenV0Args,
    ) -> ProgramResult {
        let token_ref = &mut ctx.accounts.token_ref;
        let reverse_token_ref_bonding = &mut ctx.accounts.reverse_token_ref_bonding;
        let reverse_token_ref_staking = &mut ctx.accounts.reverse_token_ref_staking;

        // turn arg into enum and use prefix based on enum
        if !(args.token_ref_prefix.as_bytes() == UNCLAIMED_REF_PREFIX.as_bytes()
            || args.token_ref_prefix.as_bytes() == CLAIMED_REF_PREFIX.as_bytes())
        {
            return Err(ErrorCode::InvalidTokenRefPrefix.into());
        }

        if (
            args.token_ref_seed != (*ctx.accounts.name.to_account_info().key).to_bytes() &&
            args.token_ref_seed != (*ctx.accounts.name_owner.to_account_info().key).to_bytes()
        ) || (
            args.token_ref_seed == (*ctx.accounts.name_owner.to_account_info().key).to_bytes() &&
            *ctx.accounts.name_owner.to_account_info().key == Pubkey::default()
        ) {
            return Err(ErrorCode::InvalidTokenRefSeed.into());
        }

        // if name_owner != default pub key
        // decode name record and make sure ===

        token_ref.wumbo = *ctx.accounts.wumbo.to_account_info().key;
        token_ref.token_bonding = *ctx.accounts.token_bonding.to_account_info().key;
        token_ref.token_staking = *ctx.accounts.token_staking.to_account_info().key;
        token_ref.bump = args.token_ref_bump;

        reverse_token_ref_bonding.wumbo = *ctx.accounts.wumbo.to_account_info().key;
        reverse_token_ref_bonding.token_bonding = *ctx.accounts.token_bonding.to_account_info().key;
        reverse_token_ref_bonding.token_staking = *ctx.accounts.token_staking.to_account_info().key;
        reverse_token_ref_bonding.bump = args.reverse_token_ref_bonding_bump;

        reverse_token_ref_staking.wumbo = *ctx.accounts.wumbo.to_account_info().key;
        reverse_token_ref_staking.token_bonding = *ctx.accounts.token_bonding.to_account_info().key;
        reverse_token_ref_staking.token_staking = *ctx.accounts.token_staking.to_account_info().key;
        reverse_token_ref_staking.bump = args.reverse_token_ref_staking_bump;

        if (*ctx.accounts.name_owner.to_account_info().key != Pubkey::default()) {
            token_ref.owner = Some(*ctx.accounts.name_owner.to_account_info().key);
            reverse_token_ref_bonding.owner = Some(*ctx.accounts.name_owner.to_account_info().key);
            reverse_token_ref_staking.owner = Some(*ctx.accounts.name_owner.to_account_info().key);
        } else {
            token_ref.name = Some(*ctx.accounts.name.to_account_info().key);
            reverse_token_ref_bonding.name = Some(*ctx.accounts.name.to_account_info().key);
            reverse_token_ref_staking.name = Some(*ctx.accounts.name.to_account_info().key);
        }

        Ok(())
    }

    pub fn update_token_metadata(
        ctx: Context<UpdateSocialTokenMetadata>,
        args: UpdateSocialTokenMetadataArgs
    ) -> ProgramResult {
        Ok(())
    }

    // pub fn opt_out_v0() -> ProgramResult {}
    // pub fn opt_in_v0() -> ProgramResult {}
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeWumboArgs {
    pub bump: u8,
    pub metadata_defaults: MetadataDefaults,
    pub token_bonding_defaults: TokenBondingDefaults,
    pub token_staking_defaults: TokenStakingDefaults,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct MetadataDefaults {
    pub symbol: String,
    pub name: String,
    pub arweave_uri: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenBondingDefaults {
    pub curve: Pubkey,
    pub base_royalty_percentage: u32,
    pub target_royalty_percentage: u32,
    pub mint_cap: Option<u64>,
    pub buy_frozen: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TokenStakingDefaults {
    pub period_unit: PeriodUnit,
    pub period: u32,
    pub reward_percent_per_period_per_lockup_period: u32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct InitializeSocialTokenV0Args {
    pub token_ref_prefix: String,
    pub token_ref_seed: Vec<u8>,

    pub token_ref_bump: u8,
    pub reverse_token_ref_bonding_bump: u8,
    pub reverse_token_ref_staking_bump: u8,
    pub token_bonding_bump: u8,
    pub token_staking_bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct CreateSocialTokenMetadataArgs {
    pub data: SocialTokenMetadata,
    pub is_mutable: bool,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct UpdateSocialTokenMetadataArgs {
    pub data: Option<SocialTokenMetadata>,
    pub update_authority: Option<Pubkey>,
}


#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Creator {
    pub address: Pubkey,
    pub verified: bool,
    // In percentages, NOT basis points ;) Watch out!
    pub share: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct SocialTokenMetadata {
    /// The name of the asset
    pub name: String,
    /// The symbol for the asset
    pub symbol: String,
    /// URI pointing to JSON representing the asset
    pub uri: String,
    /// Royalty basis points that goes to creators in secondary sales (0-10000)
    pub seller_fee_basis_points: u16,
    /// Array of creators, optional
    pub creators: Option<Vec<Creator>>,
}

#[derive(Accounts)]
#[instruction(args: InitializeWumboArgs)]
pub struct InitializeWumbo<'info> {
    #[account(init, seeds = [WUMBO_PREFIX.as_bytes(), mint.to_account_info().key.as_ref()], payer=payer, bump=args.bump, space=1000)]
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
    #[account(seeds = [WUMBO_PREFIX.as_bytes(), wumbo.mint.as_ref(), &[wumbo.bump]])]
    wumbo: ProgramAccount<'info, Wumbo>,
    #[account(
        constraint = token_bonding.authority.ok_or::<ProgramError>(ErrorCode::NoBondingAuthority.into())? == *wumbo.to_account_info().key,
        constraint = token_bonding.curve == wumbo.curve,
    )]
    token_bonding: CpiAccount<'info, TokenBondingV0>,
    #[account(
        constraint = token_staking.authority.ok_or::<ProgramError>(ErrorCode::NoStakingAuthority.into())? == *wumbo.to_account_info().key,
        constraint = token_staking.base_mint == token_bonding.base_mint,
    )]
    token_staking: CpiAccount<'info, TokenStakingV0>,
    // prefix is just 'token-ref'
    // wumbo
    // public key that is either wallet or nameRegistryState.owner
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
    token_ref: ProgramAccount<'info, TokenRefV0>,
    #[account(
        init,
        seeds = [
            REVERSE_TOKEN_REF_PREFIX.as_bytes(),
            wumbo.to_account_info().key.as_ref(),
            token_bonding.to_account_info().key.as_ref()
        ],
        bump = args.reverse_token_ref_bonding_bump,
        payer = payer,
        space = 1000
    )]
    reverse_token_ref_bonding: ProgramAccount<'info, TokenRefV0>,
    #[account(
        init,
        seeds = [
            REVERSE_TOKEN_REF_PREFIX.as_bytes(),
            wumbo.to_account_info().key.as_ref(),
            token_staking.to_account_info().key.as_ref()
        ],
        bump = args.reverse_token_ref_staking_bump,
        payer = payer,
        space = 1000
    )]
    // pass in metadata
    // constraint check defautls
    // CpiAccount<'info, Something>
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

#[derive(Accounts)]
#[instruction(args: CreateSocialTokenMetadataArgs)]
pub struct CreateSocialTokenMetadata<'info> {
    token_ref: ProgramAccount<'info, TokenRefV0>,
    token_ref_owner: AccountInfo<'info>,
    token_bonding: CpiAccount<'info, TokenBondingV0>,
    #[account(seeds = [BONDING_PREFIX.as_bytes(), token_ref.to_account_info().key.as_ref()])]
    token_bonding_authority: AccountInfo<'info>,

    // With the following accounts we aren't using anchor macros because they are CPI'd
    // through to token-metadata which will do all the validations we need on them.
    #[account(mut)]
    metadata: AccountInfo<'info>,
    #[account(mut)]
    mint: AccountInfo<'info>,
    #[account(signer)]
    mint_authority: AccountInfo<'info>,
    #[account(signer)]
    update_authority: AccountInfo<'info>,
    #[account(mut)]
    master_edition: AccountInfo<'info>,

    #[account(mut, signer)]
    payer: AccountInfo<'info>,
    #[account(address = spl_token_metadata::ID)]
    token_metadata_program: AccountInfo<'info>,
    token_bonding_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    system_program: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(args: UpdateSocialTokenMetadataArgs)]
pub struct UpdateSocialTokenMetadata<'info> {
    token_ref: ProgramAccount<'info, TokenRefV0>,
    token_ref_owner: AccountInfo<'info>,

    // With the following accounts we aren't using anchor macros because they are CPI'd
    // through to token-metadata which will do all the validations we need on them.
    #[account(mut)]
    metadata: AccountInfo<'info>,
    #[account(signer)]
    update_authority: AccountInfo<'info>,

    #[account(mut, signer)]
    payer: AccountInfo<'info>,
    #[account(address = spl_token_metadata::ID)]
    token_metadata_program: AccountInfo<'info>,
    #[account(address = system_program::ID)]
    system_program: AccountInfo<'info>,
    rent: Sysvar<'info, Rent>,
}

#[account]
#[derive(Default)]
pub struct Wumbo {
    pub mint: Pubkey,
    pub curve: Pubkey,
    pub metadata_defaults: MetadataDefaults,
    pub token_bonding_defaults: TokenBondingDefaults,
    pub token_staking_defaults: TokenStakingDefaults,

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
    pub is_claimed: bool,
    pub bump: u8,
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
