//@ts-nocheck
import {
  Metadata,
  Creator,
  DataV2,
  MetadataProgram,
} from "@metaplex-foundation/mpl-token-metadata";
import * as anchor from "@project-serum/anchor";
import {
  AnchorProvider,
  IdlTypes,
  Program,
  Provider,
} from "@project-serum/anchor";
import { getHashedName, NameRegistryState } from "@solana/spl-name-service";
import {
  AccountInfo as TokenAccountInfo,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintLayout,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  AccountInfo,
  Commitment,
  Finality,
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ICreateTokenBondingArgs,
  ITokenBonding,
  IUpdateTokenBondingArgs,
  SplTokenBonding,
} from "@strata-foundation/spl-token-bonding";
import {
  AnchorSdk,
  BigInstructionResult,
  createMintInstructions,
  extendBorsh,
  InstructionResult,
  ITokenWithMeta,
  percent,
  SplTokenMetadata,
  TypedAccountParser,
} from "@strata-foundation/spl-utils";
import { deserializeUnchecked } from "borsh";
import {
  CollectiveV0,
  SplTokenCollectiveIDL,
  TokenRefV0,
} from "./generated/spl-token-collective";

export * from "./generated/spl-token-collective";

export interface ITokenWithMetaAndAccount extends ITokenWithMeta {
  publicKey?: PublicKey;
  tokenRef?: ITokenRef;
  tokenBonding?: ITokenBonding;
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
  /** Only required if the mint is already initialised as a social token */
  tokenRef?: PublicKey;
}

// Taken from token bonding initialize
/** See [InitializeTokenBondingArgs](https://docs.strataprotocol.com/api/spl-token-bonding/interfaces/ICreateTokenBondingArgs) */
export interface ITokenBondingParams
  extends Omit<ICreateTokenBondingArgs, "curve" | "baseMint"> {
  /** The curve to create this social token on. **Default:** Curve from the collective's config */
  curve?: PublicKey;
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
  /** The collective to create this social token under. Ignored if baseMint is provided */
  collective?: PublicKey;
  /** The base mint to create this token under. **Default:** The Open Collective */
  mint?: PublicKey;
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
    sellerFeeBasisPoints?: number;
    creators?: Creator[] | null;
  };
  /** The wallet to create this social token under, defaults to `provider.wallet` */
  owner?: PublicKey;
  /**  The authority to make changes on this bonding curve. **Default:** `provider.wallet`. */
  authority?: PublicKey | null;
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
  /** The authority to make changes on this bonding curve. **Default:** `provider.wallet`. */
  authority?: PublicKey | null;
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

export interface IOptOutArgs {
  /** The payer for this txn */
  payer?: PublicKey;
  /** The token ref of the token we are opting out of */
  tokenRef: PublicKey;
  /** The string name stored on chain if this is an unclaimed token */
  handle?: string;
  /** The name class of the name on chain. Must be provided if the name wasn't actually created */
  nameClass?: PublicKey;
  /** The name parent of the name on chain. Must be provided if the name wasn't actually created */
  nameParent?: PublicKey;
}

interface ITokenRefKeyArgs {
  isPrimary?: boolean;
  owner?: PublicKey | null;
  name?: PublicKey | null;
  mint?: PublicKey | null;
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

export interface IUpdateOwnerArgs {
  /** The payer for this txn */
  payer?: PublicKey;
  /** The token ref of the token we are updating */
  tokenRef: PublicKey;
  /** The new owner to set */
  newOwner: PublicKey;
}

export interface IUpdateAuthorityArgs {
  /** The payer for this txn */
  payer?: PublicKey;
  /** The token ref of the token we are updating */
  tokenRef: PublicKey;
  /** The new authority to set */
  newAuthority: PublicKey;
  /** The current owner of the token ref. If executing in the same txn as a change owner, will need to supply this */
  owner?: PublicKey;
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

export interface IUpdateTokenBondingViaCollectiveArgs
  extends Omit<
    Omit<IUpdateTokenBondingArgs, "generalAuthority">,
    "tokenBonding"
  > {
  /** The token ref of the token we are updating bonding for */
  tokenRef: PublicKey;
}

export interface IUpdateCurveViaCollectiveArgs {
  tokenRef: PublicKey;
  curve: PublicKey;
  adminKey?: PublicKey | undefined;
}

export interface IClaimBondingAuthorityArgs {
  tokenBonding: PublicKey;
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
  tokenBonding: PublicKey | null;
  collective: PublicKey | null;
  owner: PublicKey | null;
}

/**
 * Unified collective interface wrapping the raw CollectiveV0
 */
// @ts-ignore
export interface ICollective extends CollectiveV0 {
  publicKey: PublicKey;
  config: CollectiveConfigV0;
}

function definedOr<A>(value: A | undefined, def: A): A {
  if (typeof value == "undefined") {
    return def;
  }

  return value!;
}

export class SplTokenCollective extends AnchorSdk<SplTokenCollectiveIDL> {
  splTokenBondingProgram: SplTokenBonding;
  splTokenMetadata: SplTokenMetadata;

  static ID = new PublicKey("TCo1sfSr2nCudbeJPykbif64rG9K1JNMGzrtzvPmp3y");
  static OPEN_COLLECTIVE_ID = new PublicKey(
    "3cYa5WvT2bgXSLxxu9XDJSHV3x5JZGM91Nc3B7jYhBL7"
  );
  static OPEN_COLLECTIVE_BONDING_ID = new PublicKey(
    "9Zse7YX2mPQFoyMuz2Gk2K8WcH83FY1BLfu34vN4sdHi"
  );
  static OPEN_COLLECTIVE_MINT_ID = new PublicKey(
    "openDKyuDPS6Ak1BuD3JtvkQGV3tzCxjpHUfe1mdC79"
  );

  static async init(
    provider: AnchorProvider,
    splCollectiveProgramId: PublicKey = SplTokenCollective.ID,
    splTokenBondingProgramId: PublicKey = SplTokenBonding.ID
  ): Promise<SplTokenCollective> {
    const SplCollectiveIDLJson = await anchor.Program.fetchIdl(
      splCollectiveProgramId,
      provider
    );

    // @ts-ignore
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
    provider: AnchorProvider;
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

  getTokenRef(ownerTokenRefKey: PublicKey): Promise<ITokenRef | null> {
    return this.getAccount(ownerTokenRefKey, this.tokenRefDecoder);
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
    tokenRef,
  }: ICreateCollectiveArgs): Promise<
    BigInstructionResult<{ collective: PublicKey; tokenBonding?: PublicKey }>
  > {
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];

    let metadataAdded = false;
    const addMetadata = async () => {
      if (metadata && !metadataAdded) {
        const { instructions: metadataInstructions, signers: metadataSigners } =
          await this.splTokenMetadata.createMetadataInstructions({
            mint: mint!,
            authority: mintAuthority,
            data: new DataV2({
              name: metadata.name,
              symbol: metadata.symbol,
              uri: metadata.uri,
              creators: null,
              sellerFeeBasisPoints: 0,
              collection: null,
              uses: null,
            }),
          });
        instructions.push(...metadataInstructions);
        signers.push(...metadataSigners);
      }

      metadataAdded = true;
    };

    if (!mint) {
      const targetMintKeypair =
        bonding?.targetMintKeypair || anchor.web3.Keypair.generate();
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

    const [collective, collectiveBump] = await SplTokenCollective.collectiveKey(
      mint
    );

    if (await this.provider.connection.getAccountInfo(collective)) {
      throw new Error("Collective already exists");
    }

    const [mintTokenRef] = await SplTokenCollective.mintTokenRefKey(mint);
    const tokenRefExists = !!(await this.provider.connection.getAccountInfo(
      mintTokenRef
    ));

    if (tokenRef || tokenRefExists) {
      instructions.push(
        await this.instruction.initializeCollectiveForSocialTokenV0(
          // @ts-ignore
          {
            authority: authority ? authority : null,
            config: toIdlConfig(config),
          },
          {
            accounts: {
              collective,
              mint: mint!,
              tokenRef: tokenRef ? tokenRef : mintTokenRef,
              payer,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
          }
        )
      );
    } else {
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
    }

    const instructions2: TransactionInstruction[] = [];
    const signers2: Signer[] = [];
    let tokenBonding: PublicKey | undefined;
    if (bonding) {
      tokenBonding = (
        await SplTokenBonding.tokenBondingKey(mint, bonding.index || 0)
      )[0];
      // Set back to token bonding's authority
      instructions2.push(
        Token.createSetAuthorityInstruction(
          TOKEN_PROGRAM_ID,
          mint,
          tokenBonding,
          "MintTokens",
          mintAuthority,
          []
        )
      );
      mintAuthority = tokenBonding;

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
    args: ICreateCollectiveArgs,
    commitment: Finality = "confirmed"
  ): Promise<{ collective: PublicKey; tokenBonding?: PublicKey }> {
    return this.executeBig(
      this.createCollectiveInstructions(args),
      args.payer,
      commitment
    );
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
    authority = this.wallet.publicKey,
  }: IClaimSocialTokenArgs): Promise<BigInstructionResult<null>> {
    const tokenRefAcct = (await this.getTokenRef(tokenRef))!;
    if (!tokenRefAcct.tokenBonding) {
      throw new Error(
        "Claiming token ref without token bonding not yet supported"
      );
    }

    const tokenBondingAcct = (await this.splTokenBondingProgram.getTokenBonding(
      tokenRefAcct.tokenBonding
    ))!;
    const ownerTokenRef = (
      await SplTokenCollective.ownerTokenRefKey({
        mint: tokenBondingAcct.baseMint,
        name: tokenRefAcct.name as PublicKey,
      })
    )[0];
    const name = tokenRefAcct.name! as PublicKey;
    const instructions0: TransactionInstruction[] = [];

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
      instructions0.push(
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
      instructions0.push(
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

    const [mintTokenRef] = await SplTokenCollective.mintTokenRefKey(
      tokenBondingAcct.targetMint
    );
    const [newTokenRef] = await PublicKey.findProgramAddress(
      SplTokenCollective.ownerTokenRefSeeds({
        mint: tokenBondingAcct.baseMint,
        owner,
      }),
      this.programId
    );

    const instructions1: TransactionInstruction[] = [];
    instructions1.push(
      await this.instruction.claimSocialTokenV0(
        {
          isPrimary,
          authority,
        },
        {
          accounts: {
            payer,
            collective: tokenRefAcct.collective || PublicKey.default,
            ownerTokenRef,
            newTokenRef,
            mintTokenRef,
            tokenBonding: tokenRefAcct.tokenBonding,
            tokenMetadata: tokenRefAcct.tokenMetadata,
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
            tokenProgram: TOKEN_PROGRAM_ID,
            tokenBondingProgram: this.splTokenBondingProgram.programId,
            tokenMetadataProgram: MetadataProgram.PUBKEY,
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
      const tokenMetadata = new Metadata(
        tokenRefAcct.tokenMetadata,
        tokenMetadataRaw!
      ).data;
      const { instructions: updateInstructions } =
        await this.splTokenMetadata.updateMetadataInstructions({
          data: new DataV2({
            name: tokenName || tokenMetadata.data.name,
            symbol: symbol || tokenMetadata.data.symbol,
            uri: tokenMetadata.data.uri,
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
          }),
          newAuthority: owner,
          updateAuthority: owner,
          metadata: tokenRefAcct.tokenMetadata,
        });
      instructions1.push(...updateInstructions);
    }

    const instructions2: TransactionInstruction[] = [];
    if (isPrimary) {
      const { instructions: setAsPrimaryInstrs } =
        await this.setAsPrimaryInstructions({
          tokenRef: mintTokenRef,
          payer,
          owner,
        });
      instructions2.push(...setAsPrimaryInstrs);
    }

    return {
      signers: [[], [], []],
      instructions: [instructions0, instructions1, instructions2],
      output: null,
    };
  }

  /**
   * Run {@link claimSocialTokenInstructions}
   * @param args
   */
  async claimSocialToken(args: IClaimSocialTokenArgs): Promise<void> {
    await this.executeBig(this.claimSocialTokenInstructions(args));
  }

  /**
   * Get the seeds for the PDA of a token ref given the various parameters.
   *
   * @param param0
   * @returns
   */
  static ownerTokenRefSeeds({
    owner,
    name,
    mint,
    isPrimary,
  }: ITokenRefKeyArgs): Buffer[] {
    const str = Buffer.from("owner-token-ref", "utf-8");
    if ((isPrimary || !mint) && !name) {
      if (!owner) {
        throw new Error("Owner is required for a primary token refs");
      }

      return [str, owner!.toBuffer()];
    } else {
      if (!mint) {
        throw new Error("Mint is required for non-primary token refs");
      }

      return [str, (name || owner)!.toBuffer(), mint.toBuffer()];
    }
  }

  static collectiveKey(
    mint: PublicKey,
    programId: PublicKey = SplTokenCollective.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("collective", "utf-8"), mint!.toBuffer()],
      programId
    );
  }

  static async ownerTokenRefKey(
    args: ITokenRefKeyArgs,
    programId: PublicKey = SplTokenCollective.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      this.ownerTokenRefSeeds(args),
      programId
    );
  }

  static async mintTokenRefKey(
    mint: PublicKey,
    programId: PublicKey = SplTokenCollective.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("mint-token-ref", "utf-8"), mint.toBuffer()],
      programId
    );
  }

  /**
   * Get instructions to set this ownerTokenRef as our primary token ref (lookups to "owner-token-ref", owner pda find this ownerTokenRef)
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

    const [primaryTokenRef, bumpSeed] =
      await SplTokenCollective.ownerTokenRefKey({
        isPrimary: true,
        owner,
      });

    return {
      signers: [],
      instructions: [
        await this.instruction.setAsPrimaryV0(
          {
            bumpSeed,
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
    collective,
    mint,
    name,
    owner,
    targetMintKeypair = anchor.web3.Keypair.generate(),
    metadata,
    nameClass,
    nameParent,
    tokenBondingParams,
    isPrimary = name ? false : true,
    authority,
  }: ICreateSocialTokenArgs): Promise<
    BigInstructionResult<{
      ownerTokenRef: PublicKey;
      mintTokenRef: PublicKey;
      tokenBonding: PublicKey | null;
      mint: PublicKey;
    }>
  > {
    let metadataUri = metadata?.uri;
    if (!owner && !name) {
      owner = this.wallet.publicKey;
    }

    if (!authority && !name) {
      authority = this.wallet.publicKey;
    }

    const curve = tokenBondingParams.curve;
    const programId = this.programId;
    const provider = this.provider;
    const instructions1: TransactionInstruction[] = [];
    const signers1: Signer[] = [];

    if (!mint && !collective) {
      mint = SplTokenCollective.OPEN_COLLECTIVE_MINT_ID;
    }
    const state = (await this.splTokenBondingProgram.getState())!;
    const isNative =
      mint?.equals(NATIVE_MINT) || mint?.equals(state.wrappedSolMint);
    if (isNative) {
      mint = state.wrappedSolMint;
    }

    let collectiveBumpSeed: number = 0;
    if (!collective) {
      [collective, collectiveBumpSeed] = await SplTokenCollective.collectiveKey(
        mint!
      );
    }

    const collectiveAcct = await this.getCollective(collective);
    if (collectiveAcct) {
      collectiveBumpSeed = collectiveAcct.bumpSeed;
    }
    const config: CollectiveConfigV0 | undefined = collectiveAcct?.config as
      | CollectiveConfigV0
      | undefined;
    if (!mint) {
      if (!collectiveAcct) {
        throw new Error("Must either provide a collective or a mint");
      }
      mint = collectiveAcct.mint;
    }

    // Token refs
    const [ownerTokenRef, ownerTokenRefBumpSeed] =
      await PublicKey.findProgramAddress(
        SplTokenCollective.ownerTokenRefSeeds({ mint, owner, name }),
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
          config?.unclaimedTokenBondingSettings?.targetMintDecimals ||
          9
      ))
    );

    const [mintTokenRef, mintTokenRefBumpSeed] =
      await SplTokenCollective.mintTokenRefKey(targetMint);

    console.log("ownerTokenRef", ownerTokenRef.toBase58());
    console.log("reverse", mintTokenRef.toBase58());
    const existing = await this.getTokenRef(ownerTokenRef);
    if (existing) {
      if (ignoreIfExists) {
        return {
          instructions: [],
          signers: [],
          output: {
            mint: existing.mint,
            ownerTokenRef,
            mintTokenRef,
            tokenBonding: existing.tokenBonding,
          },
        };
      }
      throw new Error("Social token already exists for this wallet or name");
    }

    // create metadata with payer as temporary authority
    console.log("Creating social token metadata...");
    // @ts-ignore
    let uri = metadataUri || config?.unclaimedTokenMetadataSettings?.uri;

    if (!uri) {
      throw new Error(
        "Must pass metadata.uri or it must be defined on the collective config"
      );
    }

    const tokenBonding = (
      await SplTokenBonding.tokenBondingKey(targetMint, 0)
    )[0];

    const {
      instructions: metadataInstructions,
      signers: metadataSigners,
      output: { metadata: tokenMetadata },
    } = await this.splTokenMetadata.createMetadataInstructions({
      mint: targetMint!,
      authority: owner ? owner : mintTokenRef,
      data: new DataV2({
        uri,
        collection: null,
        uses: null,
        creators: null,
        sellerFeeBasisPoints: 0,
        ...metadata,
      }),
    });
    instructions1.push(...metadataInstructions);
    signers1.push(...metadataSigners);

    instructions1.push(
      Token.createSetAuthorityInstruction(
        TOKEN_PROGRAM_ID,
        targetMint,
        tokenBonding,
        "MintTokens",
        payer,
        []
      )
    );

    // Create token bonding
    const instructions2: TransactionInstruction[] = [];
    const tokenBondingSettings = owner
      ? config?.claimedTokenBondingSettings
      : config?.unclaimedTokenBondingSettings;
    const signers2: Signer[] = [];
    const curveToUse = (curve ||
      (!owner &&
        // @ts-ignore
        collectiveAcct?.config?.unclaimedTokenBondingSettings?.curve) ||
      // @ts-ignore
      (owner && collectiveAcct?.config?.claimedTokenBondingSettings?.curve) ||
      // @ts-ignore
      collectiveAcct?.config?.unclaimedTokenBondingSettings?.curve ||
      // @ts-ignore
      collectiveAcct?.config?.claimedTokenBondingSettings?.curve)!;

    if (!curveToUse) {
      throw new Error("No curve provided");
    }

    const {
      instructions: bondingInstructions,
      signers: bondingSigners,
      output: {
        buyBaseRoyalties,
        buyTargetRoyalties,
        sellBaseRoyalties,
        sellTargetRoyalties,
        baseMint,
      },
    } = await this.splTokenBondingProgram.createTokenBondingInstructions({
      payer,
      index: 0,
      // @ts-ignore
      curve: curveToUse,
      baseMint: mint,
      targetMint,
      generalAuthority: mintTokenRef,
      reserveAuthority: mintTokenRef,
      curveAuthority: mintTokenRef,
      // @ts-ignore
      buyBaseRoyaltiesOwner: tokenBondingSettings?.buyBaseRoyalties.ownedByName
        ? mintTokenRef
        : undefined,
      // @ts-ignore
      sellBaseRoyaltiesOwner: tokenBondingSettings?.sellBaseRoyalties
        .ownedByName
        ? mintTokenRef
        : undefined,
      // @ts-ignore
      buyTargetRoyaltiesOwner: tokenBondingSettings?.buyTargetRoyalties
        .ownedByName
        ? mintTokenRef
        : undefined,
      // @ts-ignore
      sellTargetRoyaltiesOwner: tokenBondingSettings?.sellTargetRoyalties
        .ownedByName
        ? mintTokenRef
        : undefined,
      buyBaseRoyalties:
        // @ts-ignore
        tokenBondingSettings?.buyBaseRoyalties?.address || undefined,
      sellBaseRoyalties:
        // @ts-ignore
        tokenBondingSettings?.sellBaseRoyalties?.address || undefined,
      buyTargetRoyalties:
        // @ts-ignore
        tokenBondingSettings?.buyTargetRoyalties?.address || undefined,
      sellTargetRoyalties:
        // @ts-ignore
        tokenBondingSettings?.sellTargetRoyalties?.address || undefined,
      ...tokenBondingParams,
    });
    instructions2.push(...bondingInstructions);
    signers2.push(...bondingSigners);

    const initializeArgs = {
      authority:
        (collectiveAcct?.authority as PublicKey | undefined) ||
        PublicKey.default,
      collective,
      tokenMetadata: new PublicKey(tokenMetadata),
      tokenBonding,
      payer,
      baseMint,
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
      authority: authority || null,
      nameClass: nameClass || null,
      nameParent: nameParent || null,
      collectiveBumpSeed,
      ownerTokenRefBumpSeed,
      mintTokenRefBumpSeed,
    };
    console.log(args);

    const instructions3: TransactionInstruction[] = [];
    const signers3: Signer[] = [];
    if (owner) {
      instructions3.push(
        await this.instruction.initializeOwnedSocialTokenV0(args, {
          accounts: {
            initializeArgs,
            owner,
            payer,
            ownerTokenRef,
            mintTokenRef,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        })
      );

      if (isPrimary) {
        const { instructions: setAsPrimaryInstrs } =
          await this.setAsPrimaryInstructions({
            tokenRef: ownerTokenRef,
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
            name: name!,
            payer,
            ownerTokenRef,
            mintTokenRef,
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
        ownerTokenRef,
        mintTokenRef,
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
  async createSocialToken(
    args: ICreateSocialTokenArgs,
    commitment: Finality = "confirmed"
  ): Promise<{
    ownerTokenRef: PublicKey;
    mintTokenRef: PublicKey;
    tokenBonding: PublicKey | null;
    mint: PublicKey;
  }> {
    return this.executeBig(
      this.createSocialTokenInstructions(args),
      args.payer,
      commitment
    );
  }

  getUserTokensWithMeta(
    tokenAccounts?: TokenAccount[]
  ): Promise<ITokenWithMetaAndAccount[]> {
    return Promise.all(
      (tokenAccounts || []).map(async ({ pubkey, info }) => {
        const metadataKey = await Metadata.getPDA(info.mint);
        const [mintTokenRefKey] = await SplTokenCollective.mintTokenRefKey(
          info.mint
        );
        const account = await this.provider.connection.getAccountInfo(
          mintTokenRefKey
        );
        const ownerTokenRef =
          account && this.tokenRefDecoder(mintTokenRefKey, account);
        const tokenBondingKey = (
          await SplTokenBonding.tokenBondingKey(info.mint)
        )[0];
        const tokenBondingAccount =
          await this.provider.connection.getAccountInfo(tokenBondingKey);
        const tokenBonding =
          tokenBondingAccount &&
          this.splTokenBondingProgram.tokenBondingDecoder(
            tokenBondingKey,
            tokenBondingAccount
          );
        return {
          ...(await this.splTokenMetadata.getTokenMetadata(
            new PublicKey(metadataKey)
          )),
          tokenRef: ownerTokenRef || undefined,
          tokenBonding: tokenBonding || undefined,
          publicKey: pubkey,
          account: info,
        };
      })
    );
  }

  /**
   * Claims the reserve and general authority from any bonding curve
   * that has this token ref as the authority. Useful for setting bonding curves
   * that can later be claimed by the social token holder.
   *
   * @param param0
   * @returns
   */
  async claimBondingAuthorityInstructions({
    tokenBonding,
  }: IClaimBondingAuthorityArgs): Promise<InstructionResult<null>> {
    const tokenBondingAcct = (await this.splTokenBondingProgram.getTokenBonding(
      tokenBonding
    ))!;

    const [mintTokenRef] = await SplTokenCollective.mintTokenRefKey(
      tokenBondingAcct.baseMint
    );

    return {
      output: null,
      signers: [],
      instructions: [
        await this.instruction.claimBondingAuthorityV0({
          accounts: {
            mintTokenRef,
            tokenBondingUpdateAccounts: {
              tokenBonding: tokenBonding,
              baseMint: tokenBondingAcct.baseMint,
              targetMint: tokenBondingAcct.targetMint,
              buyBaseRoyalties: tokenBondingAcct.buyBaseRoyalties,
              sellBaseRoyalties: tokenBondingAcct.sellBaseRoyalties,
              buyTargetRoyalties: tokenBondingAcct.buyTargetRoyalties,
              sellTargetRoyalties: tokenBondingAcct.sellTargetRoyalties,
            },
            tokenBondingProgram: this.splTokenBondingProgram.programId,
          },
        }),
      ],
    };
  }

  /**
   * Runs {@link `claimBondingAuthorityInstructions`}
   *
   * @param args
   * @retruns
   */
  async claimBondingAuthority(
    args: IClaimBondingAuthorityArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(
      this.claimBondingAuthorityInstructions(args),
      this.wallet.publicKey,
      commitment
    );
  }

  /**
   * Update a bonding cruve.
   *
   * @param args
   * @returns
   */
  async updateTokenBondingInstructions({
    tokenRef,
    buyBaseRoyaltyPercentage,
    buyTargetRoyaltyPercentage,
    sellBaseRoyaltyPercentage,
    sellTargetRoyaltyPercentage,
    buyBaseRoyalties,
    buyTargetRoyalties,
    sellBaseRoyalties,
    sellTargetRoyalties,
    buyFrozen,
  }: IUpdateTokenBondingViaCollectiveArgs): Promise<InstructionResult<null>> {
    const tokenRefAcct = (await this.getTokenRef(tokenRef))!;
    if (!tokenRefAcct.tokenBonding) {
      throw new Error(
        "Cannot update token bonding on a token ref that has no token bonding"
      );
    }

    if (!tokenRefAcct.authority) {
      throw new Error(
        "No authority on this token. Cannot update token bonding."
      );
    }

    const collectiveAcct =
      tokenRefAcct.collective &&
      (await this.getCollective(tokenRefAcct.collective))!;

    const tokenBondingAcct = (await this.splTokenBondingProgram.getTokenBonding(
      tokenRefAcct.tokenBonding
    ))!;

    if (!tokenBondingAcct.generalAuthority) {
      throw new Error(
        "Cannot update a token bonding account that has no authority"
      );
    }

    const [mintTokenRef] = await SplTokenCollective.mintTokenRefKey(
      tokenBondingAcct.targetMint
    );

    const args: IdlTypes<SplTokenCollectiveIDL>["UpdateTokenBondingV0ArgsWrapper"] =
      {
        tokenBondingAuthority: tokenBondingAcct.generalAuthority as PublicKey,
        buyBaseRoyaltyPercentage: definedOr(
          percent(buyBaseRoyaltyPercentage),
          tokenBondingAcct.buyBaseRoyaltyPercentage
        ),
        buyTargetRoyaltyPercentage: definedOr(
          percent(buyTargetRoyaltyPercentage),
          tokenBondingAcct.buyTargetRoyaltyPercentage
        ),
        sellBaseRoyaltyPercentage: definedOr(
          percent(sellBaseRoyaltyPercentage),
          tokenBondingAcct.sellBaseRoyaltyPercentage
        ),
        sellTargetRoyaltyPercentage: definedOr(
          percent(sellTargetRoyaltyPercentage),
          tokenBondingAcct.sellTargetRoyaltyPercentage
        ),
        buyFrozen:
          typeof buyFrozen === "undefined"
            ? (tokenBondingAcct.buyFrozen as boolean)
            : buyFrozen,
      };

    console.log({
      tokenRefAuthority: tokenRefAcct.authority as PublicKey,
      collective: tokenRefAcct.collective || PublicKey.default,
      authority:
        (collectiveAcct &&
          (collectiveAcct.authority as PublicKey | undefined)) ||
        PublicKey.default,
      mintTokenRef: mintTokenRef,
      tokenBonding: tokenRefAcct.tokenBonding,
      tokenBondingProgram: this.splTokenBondingProgram.programId,
      baseMint: tokenBondingAcct.baseMint,
      targetMint: tokenBondingAcct.targetMint,
      buyBaseRoyalties: buyBaseRoyalties || tokenBondingAcct.buyBaseRoyalties,
      buyTargetRoyalties:
        buyTargetRoyalties || tokenBondingAcct.buyTargetRoyalties,
      sellBaseRoyalties:
        sellBaseRoyalties || tokenBondingAcct.sellBaseRoyalties,
      sellTargetRoyalties:
        sellTargetRoyalties || tokenBondingAcct.sellTargetRoyalties,
    });
    return {
      output: null,
      signers: [],
      instructions: [
        await this.instruction.updateTokenBondingV0(args, {
          accounts: {
            tokenRefAuthority: tokenRefAcct.authority as PublicKey,
            collective: tokenRefAcct.collective || PublicKey.default,
            authority:
              (collectiveAcct &&
                (collectiveAcct.authority as PublicKey | undefined)) ||
              PublicKey.default,
            mintTokenRef: mintTokenRef,
            tokenBonding: tokenRefAcct.tokenBonding,
            tokenBondingProgram: this.splTokenBondingProgram.programId,
            baseMint: tokenBondingAcct.baseMint,
            targetMint: tokenBondingAcct.targetMint,
            buyBaseRoyalties:
              buyBaseRoyalties || tokenBondingAcct.buyBaseRoyalties,
            buyTargetRoyalties:
              buyTargetRoyalties || tokenBondingAcct.buyTargetRoyalties,
            sellBaseRoyalties:
              sellBaseRoyalties || tokenBondingAcct.sellBaseRoyalties,
            sellTargetRoyalties:
              sellTargetRoyalties || tokenBondingAcct.sellTargetRoyalties,
          },
        }),
      ],
    };
  }

  /**
   * Runs {@link `updateTokenBondingInstructions`}
   *
   * @param args
   * @retruns
   */
  async updateTokenBonding(
    args: IUpdateTokenBondingViaCollectiveArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(
      this.updateTokenBondingInstructions(args),
      this.wallet.publicKey,
      commitment
    );
  }

  async updateCurveInstructions({
    tokenRef,
    curve,
    adminKey,
  }: IUpdateCurveViaCollectiveArgs): Promise<InstructionResult<null>> {
    const tokenRefAcct = (await this.getTokenRef(tokenRef))!;
    if (!tokenRefAcct.tokenBonding) {
      throw new Error(
        "Cannot update curve on a token ref that has no token bonding"
      );
    }

    const collectiveAcct =
      tokenRefAcct.collective &&
      (await this.getCollective(tokenRefAcct.collective))!;

    const tokenBondingAcct = (await this.splTokenBondingProgram.getTokenBonding(
      tokenRefAcct.tokenBonding
    ))!;

    if (!tokenBondingAcct.curveAuthority) {
      throw new Error(
        "Cannot update curve for a token bonding account that has no curve authority"
      );
    }

    const [mintTokenRef] = await SplTokenCollective.mintTokenRefKey(
      tokenBondingAcct.targetMint
    );

    const auth = adminKey
      ? adminKey
      : (collectiveAcct &&
          (collectiveAcct.authority as PublicKey | undefined)) ||
        PublicKey.default;

    const tokenRefAuth = adminKey
      ? adminKey
      : (tokenRefAcct.authority as PublicKey);

    return {
      output: null,
      signers: [],
      instructions: [
        await this.instruction.updateCurveV0({
          accounts: {
            tokenRefAuthority: tokenRefAuth,
            collective: tokenRefAcct.collective || PublicKey.default,
            authority: auth,
            mintTokenRef: mintTokenRef,
            tokenBonding: tokenRefAcct.tokenBonding,
            tokenBondingProgram: this.splTokenBondingProgram.programId,
            baseMint: tokenBondingAcct.baseMint,
            targetMint: tokenBondingAcct.targetMint,
            curve,
          },
        }),
      ],
    };
  }

  /**
   * Runs {@link `updateCurveInstructions`}
   *
   * @param args
   * @retruns
   */
  async updateCurve(
    args: IUpdateCurveViaCollectiveArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(
      this.updateCurveInstructions(args),
      this.wallet.publicKey,
      commitment
    );
  }

  async getOptionalNameRecord(
    name: PublicKey | undefined
  ): Promise<NameRegistryState | null> {
    if (!name || name.equals(PublicKey.default)) {
      return null;
    }

    let nameAccountRaw = await this.provider.connection.getAccountInfo(name);
    if (nameAccountRaw) {
      return deserializeUnchecked(
        NameRegistryState.schema,
        NameRegistryState,
        nameAccountRaw.data
      );
    }

    return null;
  }

  /**
   * Opt out a social token
   *
   * @param args
   * @returns
   */
  async optOutInstructions({
    tokenRef,
    handle,
    nameClass,
    nameParent,
  }: IOptOutArgs): Promise<InstructionResult<null>> {
    const tokenRefAcct = (await this.getTokenRef(tokenRef))!;
    if (!tokenRefAcct.tokenBonding) {
      throw new Error(
        "Cannot currently opt out on a token ref that has no token bonding"
      );
    }

    const nameAcct = await this.getOptionalNameRecord(
      tokenRefAcct.name as PublicKey
    );
    if (!nameClass && nameAcct) {
      nameClass = nameAcct.class;
    }

    if (!nameParent && nameAcct) {
      nameParent = nameAcct.parentName;
    }

    let nameParentAcct = await this.getOptionalNameRecord(nameParent);

    const tokenBondingAcct = (await this.splTokenBondingProgram.getTokenBonding(
      tokenRefAcct.tokenBonding
    ))!;

    const [mintTokenRef] = await SplTokenCollective.mintTokenRefKey(
      tokenBondingAcct.targetMint
    );

    const [ownerTokenRef] = await SplTokenCollective.ownerTokenRefKey({
      name: tokenRefAcct.name as PublicKey | undefined,
      owner: tokenRefAcct.isClaimed
        ? (tokenRefAcct.owner as PublicKey)
        : undefined,
      mint: tokenBondingAcct?.baseMint,
    });

    const instructions: TransactionInstruction[] = [];
    if (!tokenRefAcct.isClaimed && !handle) {
      throw new Error(
        "Handle must be provided for opting out of unclaimed tokens"
      );
    }

    const tokenBondingUpdateAccounts = {
      tokenBonding: tokenRefAcct.tokenBonding! as PublicKey,
      baseMint: tokenBondingAcct.baseMint,
      targetMint: tokenBondingAcct.targetMint,
      buyBaseRoyalties: tokenBondingAcct.buyBaseRoyalties,
      sellBaseRoyalties: tokenBondingAcct.sellBaseRoyalties,
      buyTargetRoyalties: tokenBondingAcct.buyTargetRoyalties,
      sellTargetRoyalties: tokenBondingAcct.sellTargetRoyalties,
    };

    if (tokenRefAcct.isClaimed) {
      const [primaryTokenRef] = await SplTokenCollective.ownerTokenRefKey({
        owner: tokenRefAcct.owner as PublicKey,
        isPrimary: true,
      });

      instructions.push(
        await this.instruction.changeOptStatusClaimedV0(
          {
            isOptedOut: true,
          },
          {
            accounts: {
              primaryTokenRef,
              ownerTokenRef,
              mintTokenRef,
              owner: tokenRefAcct.owner!,
              tokenBondingUpdateAccounts,
              tokenBondingProgram: this.splTokenBondingProgram.programId,
            },
          }
        )
      );
    } else {
      instructions.push(
        await this.instruction.changeOptStatusUnclaimedV0(
          {
            hashedName: await getHashedName(handle!),
            isOptedOut: true,
          },
          {
            accounts: {
              ownerTokenRef,
              mintTokenRef,
              name: tokenRefAcct.name as PublicKey,
              tokenBondingUpdateAccounts,
              tokenBondingProgram: this.splTokenBondingProgram.programId,
            },
            remainingAccounts: [
              {
                pubkey: nameClass || PublicKey.default,
                isWritable: false,
                isSigner: !!nameClass && !nameClass.equals(PublicKey.default),
              },
              {
                pubkey: nameParent || PublicKey.default,
                isWritable: false,
                isSigner: false,
              },
              {
                pubkey: nameParentAcct?.owner || PublicKey.default,
                isWritable: false,
                isSigner: !!nameParent && !nameParent.equals(PublicKey.default),
              },
            ],
          }
        )
      );
    }

    return {
      output: null,
      signers: [],
      instructions,
    };
  }

  /**
   * Runs {@link `optOutInstructions`}
   *
   * @param args
   * @retruns
   */
  async optOut(
    args: IOptOutArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(this.optOutInstructions(args), args.payer, commitment);
  }

  /**
   * Update the owner wallet of a social token
   *
   * @param args
   * @returns
   */
  async updateOwnerInstructions({
    payer = this.wallet.publicKey,
    tokenRef,
    newOwner,
  }: IUpdateOwnerArgs): Promise<
    InstructionResult<{ ownerTokenRef: PublicKey }>
  > {
    const tokenRefAcct = (await this.getTokenRef(tokenRef))!;
    if (!tokenRefAcct.tokenBonding) {
      throw new Error("Cannot update a token ref that has no token bonding");
    }
    if (!tokenRefAcct.isClaimed) {
      throw new Error("Cannot update owner on an unclaimed token ref");
    }

    const tokenBondingAcct = (await this.splTokenBondingProgram.getTokenBonding(
      tokenRefAcct.tokenBonding
    ))!;

    const [mintTokenRef] = await SplTokenCollective.mintTokenRefKey(
      tokenBondingAcct.targetMint
    );

    const [oldOwnerTokenRef] = await SplTokenCollective.ownerTokenRefKey({
      owner: tokenRefAcct.owner! as PublicKey,
      mint: tokenBondingAcct?.baseMint,
    });
    const [newOwnerTokenRef, ownerTokenRefBumpSeed] =
      await SplTokenCollective.ownerTokenRefKey({
        owner: newOwner,
        mint: tokenBondingAcct?.baseMint,
      });
    const [oldPrimaryTokenRef] = await SplTokenCollective.ownerTokenRefKey({
      owner: tokenRefAcct.owner! as PublicKey,
      isPrimary: true,
    });
    const [newPrimaryTokenRef, primaryTokenRefBumpSeed] =
      await SplTokenCollective.ownerTokenRefKey({
        owner: newOwner,
        isPrimary: true,
      });
    return {
      output: {
        ownerTokenRef: newOwnerTokenRef,
      },
      signers: [],
      instructions: [
        await this.instruction.updateOwnerV0(
          {
            ownerTokenRefBumpSeed,
            primaryTokenRefBumpSeed,
          },
          {
            accounts: {
              newOwner,
              payer,
              baseMint: tokenBondingAcct.baseMint,
              oldOwnerTokenRef,
              oldPrimaryTokenRef,
              newPrimaryTokenRef,
              newOwnerTokenRef,
              mintTokenRef,
              owner: tokenRefAcct.owner! as PublicKey,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
          }
        ),
      ],
    };
  }

  /**
   * Runs {@link `updateOwnerInstructions`}
   *
   * @param args
   * @retruns
   */
  updateOwner(
    args: IUpdateOwnerArgs,
    commitment: Commitment = "confirmed"
  ): Promise<{ ownerTokenRef: PublicKey }> {
    return this.execute(
      this.updateOwnerInstructions(args),
      args.payer,
      commitment
    );
  }

  /**
   * Update the authority of a social token
   *
   * @param args
   * @returns
   */
  async updateAuthorityInstructions({
    payer = this.wallet.publicKey,
    tokenRef,
    newAuthority,
    owner,
  }: IUpdateAuthorityArgs): Promise<InstructionResult<null>> {
    const tokenRefAcct = (await this.getTokenRef(tokenRef))!;
    if (!tokenRefAcct.tokenBonding) {
      throw new Error("Cannot update a token ref that has no token bonding");
    }
    if (!tokenRefAcct.isClaimed) {
      throw new Error("Cannot update authority on an unclaimed token ref");
    }

    owner = owner || (tokenRefAcct.owner! as PublicKey);

    const tokenBondingAcct = (await this.splTokenBondingProgram.getTokenBonding(
      tokenRefAcct.tokenBonding
    ))!;

    const [mintTokenRef] = await SplTokenCollective.mintTokenRefKey(
      tokenBondingAcct.targetMint
    );

    const [ownerTokenRef] = await SplTokenCollective.ownerTokenRefKey({
      owner,
      mint: tokenBondingAcct?.baseMint,
    });

    const [primaryTokenRef] = await SplTokenCollective.ownerTokenRefKey({
      owner,
      isPrimary: true,
    });

    return {
      output: null,
      signers: [],
      instructions: [
        await this.instruction.updateAuthorityV0(
          {
            newAuthority,
          },
          {
            accounts: {
              payer,
              primaryTokenRef,
              baseMint: tokenBondingAcct.baseMint,
              ownerTokenRef,
              mintTokenRef,
              authority: tokenRefAcct.authority! as PublicKey,
            },
          }
        ),
      ],
    };
  }

  /**
   * Runs {@link `updateAuthorityInstructions`}
   *
   * @param args
   * @retruns
   */
  updateAuthority(args: IUpdateAuthorityArgs): Promise<null> {
    return this.execute(this.updateAuthorityInstructions(args), args.payer);
  }
}
