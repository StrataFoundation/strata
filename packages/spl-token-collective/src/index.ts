import * as anchor from "@project-serum/anchor";
import { IdlTypes, Program, Provider } from "@project-serum/anchor";
import { createMintInstructions } from "@project-serum/common";
import {
  AccountInfo as TokenAccountInfo,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintLayout,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  AccountInfo,
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ICreateTokenBondingArgs,
  SplTokenBonding,
} from "@strata-foundation/spl-token-bonding";
import {
  AnchorSdk,
  BigInstructionResult,
  Data,
  decodeMetadata,
  extendBorsh,
  getMetadata,
  ICreateArweaveUrlArgs,
  InstructionResult,
  ITokenWithMeta,
  METADATA_PROGRAM_ID,
  percent,
  SplTokenMetadata,
  TypedAccountParser,
  updateMetadata,
  ArweaveEnv,
} from "@strata-foundation/spl-utils";
import BN from "bn.js";
import {
  CollectiveV0,
  SplTokenCollectiveIDL,
  TokenRefV0,
} from "./generated/spl-token-collective";

export * from "./generated/spl-token-collective";

export interface ITokenWithMetaAndAccount extends ITokenWithMeta {
  publicKey?: PublicKey;
  tokenRef?: ITokenRef;
  account?: TokenAccountInfo;
}

interface TokenAccount {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
  info: TokenAccountInfo;
}

extendBorsh();

export interface ICreateCollectiveArgs {
  /** Payer for this transaction */
  payer?: PublicKey;
  /**
   * Token metadata that, if provided, will create metaplex spl-token-metadata for this collective.
   *
   * Reccommended to always fill this out so that your token displays with a name, symbol, and image.
   */
  metadata?: {
    name: string;
    symbol: string;
    uri: string;
  };
  /**
   * If `mint` is not provided, create a bonding curve automatically for this collective.
   */
  bonding?: ICreateTokenBondingArgs;
  /** The mint to base this collective around. It is recommended for compatability that all collectives be on a bonding curve, so it's easy to make user interfaces that can buy in and out of your social tokens */
  mint?: PublicKey;
  /** **Default:** Fetch from mint. This may not be possible if the mint is being created in the same transaction as the collective. */
  mintAuthority?: PublicKey;
  /** The authority of this collective */
  authority?: PublicKey;
  /** The configs around what is and isn't allowed in the collective */
  config: ICollectiveConfig;
}

// Taken from token bonding initialize
/** See [InitializeTokenBondingArgs](/docs/api/spl-token-bonding/interfaces/ICreateTokenBondingArgs) */
export interface ITokenBondingParams {
  /** The curve to create this social token on. **Default:** Curve from the collective's config */
  curve?: PublicKey;

  buyBaseRoyaltyPercentage: number;
  buyTargetRoyaltyPercentage: number;
  sellBaseRoyaltyPercentage: number;
  sellTargetRoyaltyPercentage: number;

  /** **Default:** uses decimals from collective config, or 9 */
  targetMintDecimals?: number;
  buyBaseRoyalties?: PublicKey;
  buyBaseRoyaltiesOwner?: PublicKey;
  buyTargetRoyalties?: PublicKey;
  buyTargetRoyaltiesOwner?: PublicKey;
  sellBaseRoyalties?: PublicKey;
  sellBaseRoyaltiesOwner?: PublicKey;
  sellTargetRoyalties?: PublicKey;
  sellTargetRoyaltiesOwner?: PublicKey;
}

/**
 * Set this token as your primary token, so people can look you up without knowing the collective
 */
export interface ISetAsPrimaryArgs {
  payer?: PublicKey;
  tokenRef: PublicKey;
  /**
   * The owner of the `tokenRef`. **Default:** Owner from fetching tokenRef. You may need to provide this if setting
   * primary in the same txn as creating the token ref.
   */
  owner?: PublicKey;
}

/**
 * Update this collective
 */
export interface IUpdateCollectiveArgs {
  payer?: PublicKey;
  collective: PublicKey;
  /**
   * The authority `collective`. **Default:** Authority from fetching the collective.
   *
   * Explicitly pass null to set the authority to none
   */
  authority?: PublicKey | null;
  config: ICollectiveConfig;
}

export interface ICreateSocialTokenArgs {
  /**
   * Is this the primary social token for this wallet? **Default:** true
   *
   * A primary social token is the social token people should see when they look up your wallet. While it's possible to belong to many
   * collectives, generally most people will have one social token.
   *
   * This can be changed at any time.
   */
  isPrimary?: boolean; //
  /** If this social token already exists, don't throw an error. **Default:** false */
  ignoreIfExists?: boolean;
  /** The payer for this account and txn */
  payer?: PublicKey;
  /** The collective to create this social token under. **Default:**: the Open Collective*/
  collective?: PublicKey;
  /** The spl-name-service name to associate with this account. Will create an unclaimed social token. */
  name?: PublicKey;
  /** The spl-name-service name class associated with name above, if provided */
  nameClass?: PublicKey;
  /** The spl-name-service name paent associated with name above, if provided */
  nameParent?: PublicKey;
  /**
   * Token metadata that, if provided, will create metaplex spl-token-metadata for this collective.
   *
   * Reccommended to fill this out so that your token displays with a name, symbol, and image.
   */
  metadata: {
    name: string;
    symbol: string;
    /** Getting a URI for token metadata can be an expensive process that involves a separate transaction
     * If the collective has a default URI configured, you can just not pass this
     * **Default:** {@link ICollectiveConfig.unclaimedTokenMetadataSettings.uri} */
    uri?: string;
  };
  /** The wallet to create this social token under, defaults to `provider.wallet` */
  owner?: PublicKey;
  /**
   * **Default:** New generated keypair
   *
   * Pass in the keypair to use for the mint. Useful if you want a vanity keypair
   */
  targetMintKeypair?: anchor.web3.Keypair;
  /** Params for the bonding curve  */
  tokenBondingParams: ITokenBondingParams;
}

export interface IClaimSocialTokenArgs {
  /**
   * Is this the primary social token for this wallet? **Default:** true
   *
   * A primary social token is the social token people should see when they look up your wallet. While it's possible to belong to many
   * collectives, generally most people will have one social token.
   */
  isPrimary?: boolean;
  /** The payer for this txn */
  payer?: PublicKey;
  /** The owning wallet of this social token. **Default:**: `provider.wallet` */
  owner?: PublicKey;
  /** The token ref of the token we are claiming */
  tokenRef: PublicKey;
  /** Change the smart-contract level name for this token without changing the url. To do a full update to token metadata, directly use SplTokenMetadata after a claim */
  tokenName?: string;
  /** Change the smart-contract level symbol for this token without changing the url. To do a full update to token metadata, directly use SplTokenMetadata after a claim */
  symbol?: string;
  /** The buy base royalties destination. **Default:** ATA of owner */
  buyBaseRoyalties?: PublicKey;
  /** The buy target royalties destination. **Default:** ATA of owner */
  buyTargetRoyalties?: PublicKey;
  /** The sell base royalties destination. **Default:** ATA of owner */
  sellBaseRoyalties?: PublicKey;
  /** The sell target royalties destination. **Default:** ATA of owner */
  sellTargetRoyalties?: PublicKey;
  /**
   * Ignore missing name account. Useful if you're creating the name in the same txn.
   *
   * Otherwise, the sdk checks to make sure the name account exists before claiming to provide a more useful error
   *
   * **Default:** false
   */
  ignoreMissingName?: boolean; // Ignore missing name account,
}

interface ITokenRefKeyArgs {
  isPrimary?: boolean;
  owner?: PublicKey;
  name?: PublicKey;
  collective?: PublicKey;
}

export interface IRoyaltySetting {
  /**
   * In the case of an unclaimed token, is this royalty account required to be owned by the name account.
   *
   * If `true`, when the token is claimed, the owner of the name that's claiming it will receive all of the funds in the royalty account
   */
  ownedByName?: boolean;
  /**
   * A static address such that all curves must have this as the royalty address.
   */
  address?: number;
}

export interface ITokenBondingSettings {
  curve?: PublicKey;
  minSellBaseRoyaltyPercentage?: number;
  minSellTargetRoyaltyPercentage?: number;
  maxSellBaseRoyaltyPercentage?: number;
  maxSellTargetRoyaltyPercentage?: number;
  minBuyBaseRoyaltyPercentage?: number;
  minBuyTargetRoyaltyPercentage?: number;
  maxBuyBaseRoyaltyPercentage?: number;
  maxBuyTargetRoyaltyPercentage?: number;
  targetMintDecimals?: number;
  buyBaseRoyalties?: IRoyaltySetting;
  sellBaseRoyalties?: IRoyaltySetting;
  buyTargetRoyalties?: IRoyaltySetting;
  sellTargetRoyalties?: IRoyaltySetting;
  minPurchaseCap?: number;
  maxPurchaseCap?: number;
  minMintCap?: number;
  maxMintCap?: number;
}

export interface ITokenMetadataSettings {
  /** The default symbol for an unclaimed token */
  symbol?: string;
  /** The default uri for an unclaimed token */
  uri?: string;
  /** Enforce that the name of the unclaimed token matches the spl-name-service name */
  nameIsNameServiceName?: boolean;
}

export interface ICollectiveConfig {
  /**
   * A collective can either be open or closed. A closed collective must sign on the creation of _any_ social token
   * within the collective. An open collective allows any social tokens to bind themself to the collective token, so long
   * as they follow the CollectiveConfig settings
   */
  isOpen: boolean;
  /** Settings for bonding curves on unclaimed tokens */
  unclaimedTokenBondingSettings?: ITokenBondingSettings;
  /** Settings for bonding curves on claimed tokens */
  claimedTokenBondingSettings?: ITokenBondingSettings;
  /** Settings for token metadata of unclaimed tokens */
  unclaimedTokenMetadataSettings?: ITokenMetadataSettings;
}

type CollectiveConfigV0 = IdlTypes<SplTokenCollectiveIDL>["CollectiveConfigV0"];
type TokenBondingSettingsV0 =
  IdlTypes<SplTokenCollectiveIDL>["TokenBondingSettingsV0"];
type RoyaltySettingV0 = IdlTypes<SplTokenCollectiveIDL>["RoyaltySettingV0"];
type TokenMetadataSettingsV0 =
  IdlTypes<SplTokenCollectiveIDL>["TokenMetadataSettingsV0"];
function undefinedToNull(obj: any | undefined): any | null {
  if (typeof obj === "undefined") {
    return null;
  }

  return obj;
}

function toIdlTokenMetadataSettings(
  settings: ITokenMetadataSettings | undefined
): TokenMetadataSettingsV0 {
  return {
    symbol: undefinedToNull(settings?.symbol),
    uri: undefinedToNull(settings?.uri),
    nameIsNameServiceName: !!settings?.nameIsNameServiceName,
  };
}

function toIdlRoyaltySettings(
  settings: IRoyaltySetting | undefined
): RoyaltySettingV0 {
  return {
    ownedByName: !!settings?.ownedByName,
    address: undefinedToNull(settings?.address),
  };
}

function toIdlTokenBondingSettings(
  settings: ITokenBondingSettings | undefined
): TokenBondingSettingsV0 {
  return {
    curve: undefinedToNull(settings?.curve),
    minSellBaseRoyaltyPercentage: undefinedToNull(
      percent(settings?.minSellBaseRoyaltyPercentage)
    ),
    minSellTargetRoyaltyPercentage: undefinedToNull(
      percent(settings?.minSellTargetRoyaltyPercentage)
    ),
    maxSellBaseRoyaltyPercentage: undefinedToNull(
      percent(settings?.maxSellBaseRoyaltyPercentage)
    ),
    maxSellTargetRoyaltyPercentage: undefinedToNull(
      percent(settings?.maxSellTargetRoyaltyPercentage)
    ),
    minBuyBaseRoyaltyPercentage: undefinedToNull(
      percent(settings?.minBuyBaseRoyaltyPercentage)
    ),
    minBuyTargetRoyaltyPercentage: undefinedToNull(
      percent(settings?.minBuyTargetRoyaltyPercentage)
    ),
    maxBuyBaseRoyaltyPercentage: undefinedToNull(
      percent(settings?.maxBuyBaseRoyaltyPercentage)
    ),
    maxBuyTargetRoyaltyPercentage: undefinedToNull(
      percent(settings?.maxBuyTargetRoyaltyPercentage)
    ),
    targetMintDecimals: undefinedToNull(settings?.targetMintDecimals),
    // @ts-ignore
    buyBaseRoyalties: toIdlRoyaltySettings(settings?.buyBaseRoyalties),
    // @ts-ignore
    sellBaseRoyalties: toIdlRoyaltySettings(settings?.sellBaseRoyalties),
    // @ts-ignore
    buyTargetRoyalties: toIdlRoyaltySettings(settings?.buyTargetRoyalties),
    // @ts-ignore
    sellTargetRoyalties: toIdlRoyaltySettings(settings?.sellTargetRoyalties),
    minPurchaseCap: undefinedToNull(settings?.minPurchaseCap),
    maxPurchaseCap: undefinedToNull(settings?.maxPurchaseCap),
    minMintCap: undefinedToNull(settings?.minMintCap),
    maxMintCap: undefinedToNull(settings?.maxMintCap),
  } as TokenBondingSettingsV0;
}

function toIdlConfig(config: ICollectiveConfig): CollectiveConfigV0 {
  return {
    isOpen: config.isOpen,
    // @ts-ignore
    unclaimedTokenBondingSettings: toIdlTokenBondingSettings(
      config.unclaimedTokenBondingSettings
    ),
    // @ts-ignore
    claimedTokenBondingSettings: toIdlTokenBondingSettings(
      config.claimedTokenBondingSettings
    ),
    // @ts-ignore
    unclaimedTokenMetadataSettings: toIdlTokenMetadataSettings(
      config.unclaimedTokenMetadataSettings
    ),
  };
}

/**
 * Unified tokenref interface wrapping the raw TokenRefV0
 */
export interface ITokenRef extends TokenRefV0 {
  publicKey: PublicKey;
}

/**
 * Unified collective interface wrapping the raw CollectiveV0
 */
// @ts-ignore
export interface ICollective extends CollectiveV0 {
  publicKey: PublicKey;
  config: CollectiveConfigV0;
}

export class SplTokenCollective extends AnchorSdk<SplTokenCollectiveIDL> {
  splTokenBondingProgram: SplTokenBonding;
  splTokenMetadata: SplTokenMetadata;

  static ID = new PublicKey("TCo1sP6RwuCuyHPHjxgzcrq4dX4BKf9oRQ3aJMcdFry");
  static OPEN_COLLECTIVE_ID = new PublicKey(
    "Dqe1nFRkTGvimkimmWnxekBa97rCnTetEekCrGFVPVhd"
  );
  static OPEN_COLLECTIVE_BONDING_ID = new PublicKey(
    "8P533JdGaPv1h7JnVQT5RgbDvgg1vFyNUtg4P6z3etxF"
  );
  static OPEN_COLLECTIVE_MINT_ID = new PublicKey(
    "openQPYpSNGhxMBPeMdftdpJzEFksd94giFKuhH7A5a"
  );

  static async init(
    provider: Provider,
    splCollectiveProgramId: PublicKey = SplTokenCollective.ID,
    splTokenBondingProgramId: PublicKey = SplTokenBonding.ID
  ): Promise<SplTokenCollective> {
    const SplCollectiveIDLJson = await anchor.Program.fetchIdl(
      splCollectiveProgramId,
      provider
    );
    const splCollective = new anchor.Program(
      SplCollectiveIDLJson!,
      splCollectiveProgramId,
      provider
    ) as anchor.Program<SplTokenCollectiveIDL>;
    const splTokenBondingProgram = await SplTokenBonding.init(
      provider,
      splTokenBondingProgramId
    );
    const splTokenMetadata = await SplTokenMetadata.init(provider);

    return new this({
      provider,
      program: splCollective,
      splTokenBondingProgram,
      splTokenMetadata,
    });
  }

  constructor(opts: {
    provider: Provider;
    program: Program<SplTokenCollectiveIDL>;
    splTokenBondingProgram: SplTokenBonding;
    splTokenMetadata: SplTokenMetadata;
  }) {
    super(opts);
    this.splTokenBondingProgram = opts.splTokenBondingProgram;
    this.splTokenMetadata = opts.splTokenMetadata;
  }

  /**
   * Account decoder to a unified TokenRef interface
   *
   * @param pubkey
   * @param account
   * @returns
   */
  tokenRefDecoder: TypedAccountParser<ITokenRef> = (pubkey, account) => {
    const coded = this.program.coder.accounts.decode<ITokenRef>(
      "TokenRefV0",
      account.data
    );

    return {
      ...coded,
      publicKey: pubkey,
    };
  };

  /**
   * Account decoder to a unified Collective interface
   *
   * @param pubkey
   * @param account
   * @returns
   */
  collectiveDecoder: TypedAccountParser<ICollective> = (pubkey, account) => {
    const coded = this.program.coder.accounts.decode<ICollective>(
      "CollectiveV0",
      account.data
    );

    return {
      ...coded,
      publicKey: pubkey,
    };
  };

  getCollective(collectiveKey: PublicKey): Promise<ICollective | null> {
    return this.getAccount(collectiveKey, this.collectiveDecoder);
  }

  getTokenRef(tokenRefKey: PublicKey): Promise<ITokenRef | null> {
    return this.getAccount(tokenRefKey, this.tokenRefDecoder);
  }

  /**
   * Instructions to create a Collective
   *
   * @param param0
   * @returns
   */
  async createCollectiveInstructions({
    payer = this.wallet.publicKey,
    mint,
    authority,
    mintAuthority,
    config,
    bonding,
    metadata,
  }: ICreateCollectiveArgs): Promise<
    BigInstructionResult<{ collective: PublicKey; tokenBonding?: PublicKey }>
  > {
    const programId = this.programId;
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];
    let metadataUri = metadata?.uri;

    let metadataAdded = false;
    const addMetadata = async () => {
      if (metadata && !metadataAdded) {
        const { instructions: metadataInstructions, signers: metadataSigners } =
          await this.splTokenMetadata.createMetadataInstructions({
            mint: mint!,
            authority: mintAuthority,
            data: new Data({
              name: metadata.name,
              symbol: metadata.symbol,
              uri: metadata.uri,
              creators: null,
              sellerFeeBasisPoints: 0,
            }),
          });
        instructions.push(...metadataInstructions);
        signers.push(...metadataSigners);
      }

      metadataAdded = true;
    };

    if (!mint) {
      const targetMintKeypair = bonding?.targetMintKeypair || anchor.web3.Keypair.generate();
      signers.push(targetMintKeypair);
      mint = targetMintKeypair.publicKey;
      instructions.push(
        ...(await createMintInstructions(
          this.provider,
          payer,
          mint,
          bonding?.targetMintDecimals || 9
        ))
      );
      mintAuthority = payer;

      await addMetadata();
    }

    if (!mintAuthority) {
      const mintAcct = await this.provider.connection.getAccountInfo(mint!);
      const data = Buffer.from(mintAcct!.data);
      const mintInfo = MintLayout.decode(data);
      if (mintInfo.mintAuthorityOption === 0) {
        throw new Error("Must have mint authority to create a collective");
      } else {
        mintAuthority = new PublicKey(mintInfo.mintAuthority);
      }
      await addMetadata();
    }

    const [collective, collectiveBump] = await PublicKey.findProgramAddress(
      [Buffer.from("collective", "utf-8"), mint!.toBuffer()],
      programId
    );

    instructions.push(
      await this.instruction.initializeCollectiveV0(
        // @ts-ignore
        {
          authority: authority ? authority : null,
          bumpSeed: collectiveBump,
          config: toIdlConfig(config),
        },
        {
          accounts: {
            collective,
            mint: mint!,
            mintAuthority: mintAuthority!,
            payer,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    );

    const instructions2 = [];
    const signers2 = [];
    let tokenBonding: PublicKey | undefined;
    if (bonding) {
      // Set back to token bonding's authority
      const [targetMintAuthority] = await PublicKey.findProgramAddress(
        [Buffer.from("target-authority", "utf-8"), mint.toBuffer()],
        this.splTokenBondingProgram.programId
      );
      instructions2.push(
        Token.createSetAuthorityInstruction(
          TOKEN_PROGRAM_ID,
          mint,
          targetMintAuthority,
          "MintTokens",
          mintAuthority,
          []
        )
      );
      mintAuthority = targetMintAuthority;

      var {
        instructions: tokenBondingInstructions,
        signers: tokenBondingSigners,
        output: { tokenBonding: outputTokenBonding },
      } = await this.splTokenBondingProgram.createTokenBondingInstructions({
        ...bonding,
        targetMint: mint,
      });
      tokenBonding = outputTokenBonding;

      instructions2.push(...tokenBondingInstructions);
      signers2.push(...tokenBondingSigners);
    }

    return {
      output: { collective, tokenBonding },
      instructions: [instructions, instructions2],
      signers: [signers, signers2],
    };
  }

  /**
   * Run {@link createCollectiveInstructions}
   * @param args
   * @returns
   */
  createCollective(
    args: ICreateCollectiveArgs
  ): Promise<{ collective: PublicKey; tokenBonding?: PublicKey }> {
    return this.executeBig(this.createCollectiveInstructions(args), args.payer);
  }

  /**
   * Instructions to claim a social token
   *
   * @param param0
   * @returns
   */
  async claimSocialTokenInstructions({
    payer = this.wallet.publicKey,
    owner = this.wallet.publicKey,
    tokenRef,
    tokenName,
    symbol,
    buyBaseRoyalties,
    buyTargetRoyalties,
    sellBaseRoyalties,
    sellTargetRoyalties,
    ignoreMissingName,
    isPrimary = true,
  }: IClaimSocialTokenArgs): Promise<InstructionResult<null>> {
    const tokenRefAcct = (await this.getTokenRef(tokenRef))!;
    const tokenBondingAcct =
      (await this.splTokenBondingProgram.getTokenBonding(
        tokenRefAcct.tokenBonding
      ))!;
    const name = tokenRefAcct.name! as PublicKey;
    const instructions = [];

    if (
      !ignoreMissingName &&
      !(await this.splTokenBondingProgram.accountExists(name))
    ) {
      throw new Error("Name account does not exist");
    }

    const defaultBaseRoyalties = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenBondingAcct.baseMint,
      owner,
      true
    );
    const defaultTargetRoyalties = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenBondingAcct.targetMint,
      owner,
      true
    );

    if (
      (!buyTargetRoyalties || !sellTargetRoyalties) &&
      !(await this.splTokenBondingProgram.accountExists(defaultTargetRoyalties))
    ) {
      console.log(`Creating target royalties ${defaultTargetRoyalties}...`);
      instructions.push(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenBondingAcct.targetMint,
          defaultTargetRoyalties,
          owner,
          payer
        )
      );
    }

    if (
      (!buyBaseRoyalties || !sellBaseRoyalties) &&
      !(await this.splTokenBondingProgram.accountExists(defaultBaseRoyalties))
    ) {
      console.log(`Creating base royalties ${defaultBaseRoyalties}...`);
      instructions.push(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenBondingAcct.baseMint,
          defaultBaseRoyalties,
          owner,
          payer
        )
      );
    }

    if (!buyBaseRoyalties) {
      buyBaseRoyalties = defaultBaseRoyalties;
    }
    if (!sellBaseRoyalties) {
      sellBaseRoyalties = defaultBaseRoyalties;
    }
    if (!buyTargetRoyalties) {
      buyTargetRoyalties = defaultTargetRoyalties;
    }
    if (!sellTargetRoyalties) {
      sellTargetRoyalties = defaultTargetRoyalties;
    }

    const [reverseTokenRef] = await SplTokenCollective.reverseTokenRefKey(
      tokenBondingAcct.targetMint
    );

    const tokenBondingAuthority = await PublicKey.createProgramAddress(
      [
        Buffer.from("token-bonding-authority", "utf-8"),
        reverseTokenRef.toBuffer(),
        new BN(tokenRefAcct.tokenBondingAuthorityBumpSeed).toBuffer(),
      ],
      this.programId
    );

    const [newTokenRef, tokenRefBumpSeed] = await PublicKey.findProgramAddress(
      SplTokenCollective.tokenRefSeeds({
        collective: tokenRefAcct.collective,
        owner,
      }),
      this.programId
    );

    const metadataUpdateAuthority = await PublicKey.createProgramAddress(
      [
        Buffer.from("token-metadata-authority", "utf-8"),
        reverseTokenRef.toBuffer(),
        new BN(tokenRefAcct.tokenMetadataUpdateAuthorityBumpSeed).toBuffer(),
      ],
      this.programId
    );

    const [royaltiesOwner] = await PublicKey.findProgramAddress(
      [
        Buffer.from("standin-royalties-owner", "utf-8"),
        reverseTokenRef.toBuffer(),
      ],
      this.programId
    );

    instructions.push(
      await this.instruction.claimSocialTokenV0(
        {
          tokenRefBumpSeed,
          isPrimary,
        },
        {
          accounts: {
            payer,
            collective: tokenRefAcct.collective,
            tokenRef: tokenRef,
            newTokenRef,
            reverseTokenRef,
            tokenBonding: tokenRefAcct.tokenBonding,
            tokenMetadata: tokenRefAcct.tokenMetadata,
            tokenBondingAuthority,
            metadataUpdateAuthority,
            name,
            owner,
            baseMint: tokenBondingAcct.baseMint,
            targetMint: tokenBondingAcct.targetMint,
            buyBaseRoyalties: tokenBondingAcct.buyBaseRoyalties,
            buyTargetRoyalties: tokenBondingAcct.buyTargetRoyalties,
            sellBaseRoyalties: tokenBondingAcct.sellBaseRoyalties,
            sellTargetRoyalties: tokenBondingAcct.sellTargetRoyalties,
            newBuyBaseRoyalties: buyBaseRoyalties,
            newBuyTargetRoyalties: buyTargetRoyalties,
            newSellBaseRoyalties: sellBaseRoyalties,
            newSellTargetRoyalties: sellTargetRoyalties,
            royaltiesOwner,
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenBondingProgram: this.splTokenBondingProgram.programId,
            tokenMetadataProgram: METADATA_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    );

    if (symbol) {
      const tokenMetadataRaw = await this.provider.connection.getAccountInfo(
        tokenRefAcct.tokenMetadata
      );
      const tokenMetadata = decodeMetadata(tokenMetadataRaw!.data);

      updateMetadata(
        new Data({
          name: tokenName || tokenMetadata.data.name,
          symbol: symbol || tokenMetadata.data.symbol,
          uri: tokenMetadata.data.uri,
          sellerFeeBasisPoints: 0,
          creators: null,
        }),
        undefined,
        undefined,
        tokenBondingAcct.targetMint.toBase58(),
        owner.toBase58(),
        instructions,
        tokenRefAcct.tokenMetadata.toBase58()
      );
    }

    if (isPrimary) {
      const { instructions: setAsPrimaryInstrs } =
        await this.setAsPrimaryInstructions({
          tokenRef,
          payer,
          owner,
        });
      instructions.push(...setAsPrimaryInstrs);
    }

    return {
      signers: [],
      instructions,
      output: null,
    };
  }

  /**
   * Run {@link claimSocialTokenInstructions}
   * @param args
   */
  async claimSocialToken(args: IClaimSocialTokenArgs): Promise<void> {
    await this.execute(this.claimSocialTokenInstructions(args));
  }

  /**
   * Get the seeds for the PDA of a token ref given the various parameters.
   *
   * @param param0
   * @returns
   */
  static tokenRefSeeds({
    owner,
    name,
    collective,
    isPrimary,
  }: ITokenRefKeyArgs): Buffer[] {
    const str = Buffer.from("token-ref", "utf-8");
    if ((isPrimary || !collective) && !name) {
      if (!owner) {
        throw new Error("Owner is required for a primary token refs");
      }

      return [str, owner!.toBuffer()];
    } else {
      if (!collective) {
        throw new Error("Collective is required for non-primary token refs");
      }

      return [str, (name || owner)!.toBuffer(), collective.toBuffer()];
    }
  }

  static async tokenRefKey(
    args: ITokenRefKeyArgs,
    programId: PublicKey = SplTokenCollective.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(this.tokenRefSeeds(args), programId);
  }

  static async reverseTokenRefKey(
    mint: PublicKey,
    programId: PublicKey = SplTokenCollective.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("reverse-token-ref", "utf-8"), mint.toBuffer()],
      programId
    );
  }

  /**
   * Get instructions to set this tokenRef as our primary token ref (lookups to "token-ref", owner pda find this tokenRef)
   *
   * @param param0
   * @returns
   */
  async setAsPrimaryInstructions({
    payer = this.wallet.publicKey,
    tokenRef,
    owner,
  }: ISetAsPrimaryArgs): Promise<
    InstructionResult<{ primaryTokenRef: PublicKey }>
  > {
    if (!owner) {
      // @ts-ignore
      owner = (await this.getTokenRef(tokenRef)).owner;
    }

    const [primaryTokenRef, primaryTokenRefBumpSeed] =
      await PublicKey.findProgramAddress(
        SplTokenCollective.tokenRefSeeds({ isPrimary: true, owner }),
        this.programId
      );
    return {
      signers: [],
      instructions: [
        await this.instruction.setAsPrimaryV0(
          {
            bumpSeed: primaryTokenRefBumpSeed,
          },
          {
            accounts: {
              payer,
              owner: owner!,
              tokenRef,
              primaryTokenRef,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
          }
        ),
      ],
      output: {
        primaryTokenRef,
      },
    };
  }

  /**
   * Run {@link setAsPrimaryInstructions}
   * @param args
   */
  setAsPrimary(
    args: ISetAsPrimaryArgs
  ): Promise<{ primaryTokenRef: PublicKey }> {
    return this.execute(this.setAsPrimaryInstructions(args));
  }

  /**
   * Get instructions to update this collective
   *
   * @param param0
   * @returns
   */
  async updateCollectiveInstructions({
    collective,
    authority,
    config,
  }: IUpdateCollectiveArgs): Promise<InstructionResult<null>> {
    if (typeof authority == "undefined") {
      // @ts-ignore
      authority = (await this.getCollective(collective)).authority;
    }
    return {
      signers: [],
      instructions: [
        await this.instruction.updateCollectiveV0(
          // @ts-ignore
          {
            config: toIdlConfig(config),
            authority,
          },
          {
            accounts: {
              collective,
              authority,
            },
          }
        ),
      ],
      output: null,
    };
  }

  /**
   * Run {@link updateCollectiveInstructions}
   * @param args
   */
  updateCollective(args: IUpdateCollectiveArgs): Promise<null> {
    return this.execute(this.updateCollectiveInstructions(args));
  }

  /**
   * Instructions to create everything around a social token... metadata, bonding curves, etc.
   *
   * @param param0
   * @returns
   */
  async createSocialTokenInstructions({
    ignoreIfExists = false,
    payer = this.wallet.publicKey,
    collective = SplTokenCollective.OPEN_COLLECTIVE_ID,
    name,
    owner,
    targetMintKeypair = anchor.web3.Keypair.generate(),
    metadata,
    nameClass,
    nameParent,
    tokenBondingParams,
    isPrimary = name ? false : true,
  }: ICreateSocialTokenArgs): Promise<
    BigInstructionResult<{
      tokenRef: PublicKey;
      reverseTokenRef: PublicKey;
      tokenBonding: PublicKey;
      mint: PublicKey;
    }>
  > {
    let metadataUri = metadata?.uri;
    if (!owner && !name) {
      owner = this.wallet.publicKey;
    }

    const curve = tokenBondingParams.curve;
    const programId = this.programId;
    const provider = this.provider;
    const instructions1: TransactionInstruction[] = [];
    const signers1: Signer[] = [];

    const collectiveAcct = (await this.getCollective(
      collective
    ))!;
    const config = collectiveAcct.config as CollectiveConfigV0;

    // Token refs
    const [tokenRef, tokenRefBumpSeed] = await PublicKey.findProgramAddress(
      SplTokenCollective.tokenRefSeeds({ collective, owner, name }),
      programId
    );

    // create mint with payer as auth
    console.log(
      `Creating social token mint ${targetMintKeypair.publicKey.toBase58()}`
    );
    signers1.push(targetMintKeypair);
    const targetMint = targetMintKeypair.publicKey;

    instructions1.push(
      ...(await createMintInstructions(
        provider,
        payer,
        targetMint,
        tokenBondingParams.targetMintDecimals ||
          // @ts-ignore
          config.unclaimedTokenBondingSettings?.targetMintDecimals ||
          9
      ))
    );

    const [reverseTokenRef, reverseTokenRefBumpSeed] =
      await SplTokenCollective.reverseTokenRefKey(targetMint);

    console.log("tokenRef", tokenRef.toBase58());
    console.log("reverse", reverseTokenRef.toBase58());
    const existing = await this.account.tokenRefV0.fetchNullable(tokenRef);
    if (existing) {
      if (ignoreIfExists) {
        return {
          instructions: [],
          signers: [],
          output: {
            mint: existing.mint,
            tokenRef,
            reverseTokenRef,
            tokenBonding: existing.tokenBonding,
          },
        };
      }
      throw new Error("Social token already exists for this wallet or name");
    }

    // create metadata with payer as temporary authority
    console.log("Creating social token metadata...");
    const [tokenMetadataUpdateAuthority, tokenMetadataUpdateAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [
          Buffer.from("token-metadata-authority", "utf-8"),
          reverseTokenRef.toBuffer(),
        ],
        programId
      );

    // @ts-ignore
    let uri = metadataUri || config.unclaimedTokenMetadataSettings?.uri;

    if (!uri) {
      throw new Error(
        "Must pass metadata.uri or it must be defined on the collective config"
      );
    }

    const {
      instructions: metadataInstructions,
      signers: metadataSigners,
      output: { metadata: tokenMetadata },
    } = await this.splTokenMetadata.createMetadataInstructions({
      mint: targetMint!,
      authority: owner ? owner : tokenMetadataUpdateAuthority,
      data: new Data({
        name: metadata.name,
        symbol: metadata.symbol,
        uri,
        creators: null,
        sellerFeeBasisPoints: 0,
      }),
    });
    instructions1.push(...metadataInstructions);
    signers1.push(...metadataSigners);

    // Set mint authority to token bondings authority
    const [targetMintAuthority, targetMintAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("target-authority", "utf-8"), targetMint.toBuffer()],
        this.splTokenBondingProgram.programId
      );
    instructions1.push(
      Token.createSetAuthorityInstruction(
        TOKEN_PROGRAM_ID,
        targetMint,
        targetMintAuthority,
        "MintTokens",
        payer,
        []
      )
    );

    const [tokenBondingAuthority, tokenBondingAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [
          Buffer.from("token-bonding-authority", "utf-8"),
          reverseTokenRef.toBuffer(),
        ],
        programId
      );

    const [standinRoyaltiesOwner] = await PublicKey.findProgramAddress(
      [
        Buffer.from("standin-royalties-owner", "utf-8"),
        reverseTokenRef.toBuffer(),
      ],
      programId
    );

    // Create token bonding
    const instructions2: TransactionInstruction[] = [];
    const tokenBondingSettings = owner
      ? config.claimedTokenBondingSettings
      : config.unclaimedTokenBondingSettings;
    const signers2: Signer[] = [];
    const curveToUse = (curve ||
      // @ts-ignore
      (!owner && collectiveAcct.config.unclaimedTokenBondingSettings?.curve) ||
      // @ts-ignore
      (owner && collectiveAcct.config.claimedTokenBondingSettings?.curve) ||
      // @ts-ignore
      collectiveAcct.config.unclaimedTokenBondingSettings?.curve ||
      // @ts-ignore
      collectiveAcct.config.claimedTokenBondingSettings?.curve)!;

    if (!curveToUse) {
      throw new Error("No curve provided");
    }

    const {
      instructions: bondingInstructions,
      signers: bondingSigners,
      output: {
        tokenBonding,
        buyBaseRoyalties,
        buyTargetRoyalties,
        sellBaseRoyalties,
        sellTargetRoyalties,
      },
    } = await this.splTokenBondingProgram.createTokenBondingInstructions({
      payer,
      // @ts-ignore
      curve: curveToUse,
      baseMint: collectiveAcct.mint,
      targetMint,
      generalAuthority: tokenBondingAuthority,
      reserveAuthority: tokenBondingAuthority,
      curveAuthority: tokenBondingAuthority,
      // @ts-ignore
      buyBaseRoyaltiesOwner: tokenBondingSettings?.buyBaseRoyalties.ownedByName
        ? standinRoyaltiesOwner
        : undefined,
      // @ts-ignore
      sellBaseRoyaltiesOwner: tokenBondingSettings?.sellBaseRoyalties
        .ownedByName
        ? standinRoyaltiesOwner
        : undefined,
      // @ts-ignore
      buyTargetRoyaltiesOwner: tokenBondingSettings?.buyTargetRoyalties
        .ownedByName
        ? standinRoyaltiesOwner
        : undefined,
      // @ts-ignore
      sellTargetRoyaltiesOwner: tokenBondingSettings?.sellTargetRoyalties
        .ownedByName
        ? standinRoyaltiesOwner
        : undefined,
      // @ts-ignore
      buyBaseRoyalties: tokenBondingSettings?.buyBaseRoyalties?.address,
      // @ts-ignore
      sellBaseRoyalties: tokenBondingSettings?.sellBaseRoyalties?.address,
      // @ts-ignore
      buyTargetRoyalties: tokenBondingSettings?.buyTargetRoyalties?.address,
      // @ts-ignore
      sellTargetRoyalties: tokenBondingSettings?.sellTargetRoyalties?.address,
      ...tokenBondingParams,
    });
    instructions2.push(...bondingInstructions);
    signers2.push(...bondingSigners);

    const initializeArgs = {
      collective,
      tokenMetadata: new PublicKey(tokenMetadata),
      tokenBonding,
      payer,
      baseMint: collectiveAcct.mint,
      targetMint,
      buyBaseRoyalties,
      buyTargetRoyalties,
      sellBaseRoyalties,
      sellTargetRoyalties,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      clock: SYSVAR_CLOCK_PUBKEY,
    };
    const args = {
      nameClass: nameClass || null,
      nameParent: nameParent || null,
      collectiveBumpSeed: collectiveAcct.bumpSeed,
      tokenBondingAuthorityBumpSeed,
      tokenRefBumpSeed,
      reverseTokenRefBumpSeed,
      tokenMetadataUpdateAuthorityBumpSeed,
    };
    console.log(args);

    const instructions3: TransactionInstruction[] = [];
    const signers3: Signer[] = [];
    if (owner) {
      instructions3.push(
        await this.instruction.initializeOwnedSocialTokenV0(args, {
          accounts: {
            initializeArgs,
            authority:
              (collectiveAcct.authority as PublicKey | undefined) ||
              PublicKey.default,
            owner,
            payer,
            tokenRef,
            reverseTokenRef,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        })
      );

      if (isPrimary) {
        const { instructions: setAsPrimaryInstrs } =
          await this.setAsPrimaryInstructions({
            tokenRef,
            payer,
            owner,
          });
        instructions3.push(...setAsPrimaryInstrs);
      }
    } else {
      instructions3.push(
        await this.instruction.initializeUnclaimedSocialTokenV0(args, {
          accounts: {
            initializeArgs,
            authority:
              (collectiveAcct.authority as PublicKey | undefined) ||
              PublicKey.default,
            name: name!,
            payer,
            tokenRef,
            reverseTokenRef,
            tokenMetadata,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        })
      );
    }

    return {
      output: {
        mint: targetMintKeypair.publicKey,
        tokenRef,
        reverseTokenRef,
        tokenBonding,
      },
      instructions: [instructions1, instructions2, instructions3],
      signers: [signers1, signers2, signers3],
    };
  }

  /**
   * Run {@link createSocialTokenInstructions}
   * @param args
   * @returns
   */
  async createSocialToken(args: ICreateSocialTokenArgs): Promise<{
    tokenRef: PublicKey;
    reverseTokenRef: PublicKey;
    tokenBonding: PublicKey;
    mint: PublicKey;
  }> {
    return this.executeBig(
      this.createSocialTokenInstructions(args),
      args.payer
    );
  }

  getUserTokensWithMeta(
    tokenAccounts?: TokenAccount[]
  ): Promise<ITokenWithMetaAndAccount[]> {
    return Promise.all(
      (tokenAccounts || []).map(async ({ pubkey, info }) => {
        const metadataKey = await getMetadata(info.mint.toBase58());
        const [reverseTokenRefKey] =
          await SplTokenCollective.reverseTokenRefKey(info.mint);
        const account = await this.provider.connection.getAccountInfo(
          reverseTokenRefKey
        );
        const tokenRef =
          account && this.tokenRefDecoder(reverseTokenRefKey, account);

        return {
          ...(await this.splTokenMetadata.getTokenMetadata(
            new PublicKey(metadataKey)
          )),
          tokenRef: tokenRef || undefined,
          publicKey: pubkey,
          account: info,
        };
      })
    );
  }
}
