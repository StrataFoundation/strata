import {
  DataV2,
  Metadata,
  MetadataData,
} from "@metaplex-foundation/mpl-token-metadata";
import { AccountsCoder, Provider } from "@project-serum/anchor";
import { Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { Finality, Keypair, PublicKey } from "@solana/web3.js";
import {
  ExponentialCurveConfig,
  ICreateTokenBondingArgs,
  ITokenBonding,
  SplTokenBonding,
} from "@strata-foundation/spl-token-bonding";
import {
  Attribute,
  BigInstructionResult,
  createMintInstructions,
  getMintInfo,
  IMetadataExtension,
  InstructionResult,
  ITokenWithMeta,
  SplTokenMetadata,
} from "@strata-foundation/spl-utils";
import BN from "bn.js";
import bs58 from "bs58";

type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T; // from lodash

const truthy = <T>(value: T): value is Truthy<T> => !!value;

export type GetBountyItem = {
  tokenBondingKey: PublicKey;
  targetMint: PublicKey;
  baseMint: PublicKey;
  reserveBalanceFromBonding: BN;
  goLiveUnixTime: BN;
};

interface ICreateMarketItemArgs {
  payer?: PublicKey;
  /**
   * Optionally, use this keypair to create the target mint
   */
  targetMintKeypair?: Keypair;
  /**
   * Wallet who will receive the proceeds of this sale. **Default:** provider wallet publicKey
   */
  seller?: PublicKey;
  /**
   * The update authority on the metadata created. **Default:** Seller
   */
  metadataUpdateAuthority?: PublicKey;
  /**
   * The token metadata for the marketplace item
   */
  metadata: DataV2;
  /**
   * The quantity to stop selling at
   */
  quantity?: number;
  /**
   * The price to sell them for. If not provided, should pass `bondingArgs.curve`
   */
  price?: number;

  /**
   * The mint to base the sales off of
   */
  baseMint: PublicKey;

  /**
   * Optionally -- override bonding params
   */
  bondingArgs?: ICreateTokenBondingArgs;
}

interface ICreateBountyArgs {
  payer?: PublicKey;
  /**
   * Optionally, use this keypair to create the target mint
   */
  targetMintKeypair?: Keypair;
  /**
   * Wallet who will approve the bounty and disburse the funds
   */
  authority?: PublicKey;
  /**
   * The update authority on the metadata created. **Default:** authority
   */
  metadataUpdateAuthority?: PublicKey;
  /**
   * The token metadata for the marketplace item
   */
  metadata: DataV2;

  /**
   * The mint to base the sales off of
   */
  baseMint: PublicKey;

  /**
   * Optionally -- override bonding params
   */
  bondingArgs?: ICreateTokenBondingArgs;
}

interface ICreateMetadataForBondingArgs {
  /**
   * The update authority on the metadata created. **Default:** Seller
   */
  metadataUpdateAuthority?: PublicKey;
  /**
   * The token metadata for the marketplace item
   */
  metadata: DataV2;
  /**
   * Optionally, use this keypair to create the target mint
   */
  targetMintKeypair?: Keypair;
  /**
   * Decimals for the mint
   */
  decimals: number;
}

export class MarketplaceSdk {
  static FIXED_CURVE = "fixmyQQ8cCVFh8Pp5LwZg4N3rXkym7sUXmGehxHqTAS";

  static bountyAttributes({
    mint,
    contact,
    discussion,
  }: {
    mint: PublicKey;
    contact: string;
    discussion: string;
  }): Attribute[] {
    return [
      {
        trait_type: "is_strata_bounty",
        display_type: "Strata Bounty",
        value: "true",
      },
      {
        trait_type: "bounty_uri",
        display_type: "Bounty URI",
        value: `https://marketplace.strataprotocol.com/bounties/${mint}`,
      },
      {
        trait_type: "contact",
        display_type: "Contact",
        value: contact,
      },
      {
        trait_type: "discussion",
        display_type: "Discussion",
        value: discussion,
      },
    ];
  }

  static async init(
    provider: Provider,
    splTokenBondingProgramId: PublicKey = SplTokenBonding.ID
  ): Promise<MarketplaceSdk> {
    return new this(
      provider,
      await SplTokenBonding.init(provider, splTokenBondingProgramId),
      await SplTokenMetadata.init(provider)
    );
  }

  constructor(
    readonly provider: Provider,
    readonly tokenBondingSdk: SplTokenBonding,
    readonly tokenMetadataSdk: SplTokenMetadata
  ) {}

  async createFixedCurve({
    keypair,
  }: {
    keypair: Keypair;
  }): Promise<PublicKey> {
    const curve = await this.tokenBondingSdk.initializeCurve({
      curveKeypair: keypair,
      config: new ExponentialCurveConfig({
        c: 0,
        pow: 0,
        frac: 1,
        b: 1,
      }),
    });

    return curve;
  }

  async getBounties({
    baseMint,
  }: {
    baseMint?: PublicKey;
  }): Promise<GetBountyItem[]> {
    const descriminator = AccountsCoder.accountDiscriminator("tokenBondingV0");
    const filters = [
      {
        memcmp: {
          offset: 0,
          bytes: bs58.encode(
            Buffer.concat([descriminator, baseMint?.toBuffer()].filter(truthy))
          ),
        },
      },
      {
        // All royalties should be 0 and curve should be fixed and mint cap + purchase cap not defined
        memcmp: {
          offset:
            descriminator.length +
            32 + // base mint
            32 + // target mint
            33 + // general authority
            33 + // reserve authority
            1 + // curve authority
            32 + // base storage
            32 * 4, // royalties
          bytes: bs58.encode(
            Buffer.concat([
              new u64(0).toBuffer(),
              new u64(0).toBuffer(),
              new PublicKey(MarketplaceSdk.FIXED_CURVE).toBuffer(),
              new Uint8Array([0, 0])
            ])
          ),
        },
      },
    ];
    const mints = await this.provider.connection.getProgramAccounts(
      this.tokenBondingSdk.programId,
      {
        // Just get the base and target mints
        dataSlice: {
          length: 64,
          offset: descriminator.length,
        },
        filters,
      }
    );
    const goLives = await this.provider.connection.getProgramAccounts(
      this.tokenBondingSdk.programId,
      {
        // Just get the go lives
        dataSlice: {
          offset:
            descriminator.length +
            32 + // base mint
            32 + // target mint
            33 + // general authority
            33 + // reserve authority
            1 + // curve authority
            32 + // base storage
            32 * 4 + // royalties,
            4 * 4 + // royalties amounts,
            32 + // curve
            1 + // Mint cap
            1, // Purchase cap
          length: 8,
        },
        filters,
      }
    );
    const contributions = await this.provider.connection.getProgramAccounts(
      this.tokenBondingSdk.programId,
      {
        // Just get the contributions
        dataSlice: {
          offset:
            descriminator.length +
            32 + // base mint
            32 + // target mint
            33 + // general authority
            33 + // reserve authority
            1 + // curve authority
            32 + // base storage
            32 * 4 + // royalties,
            4 * 4 + // royalties amounts,
            32 + // curve
            1 + // Mint cap
            1 + // Purchase cap
            8 + // go live,
            1 + // freeze buy,
            8 + // created,
            1 + // buy frozen
            1 + // sell frozen
            2 +
            1 +
            1 +
            1 +
            2, // seeds
          length: 8,
        },
        filters,
      }
    );

    return mints
      .map((mint, index) => {
        const goLive = goLives[index];
        const contribution = contributions[index];
        return {
          tokenBondingKey: mint.pubkey,
          baseMint: new PublicKey(mint.account.data.slice(0, 32)),
          targetMint: new PublicKey(mint.account.data.slice(32, 64)),
          goLiveUnixTime: new BN(goLive.account.data, 10, "le"),
          reserveBalanceFromBonding: new BN(contribution.account.data, 10, "le"),
        };
      });
  }

  async createMetadataForBondingInstructions({
    metadataUpdateAuthority,
    metadata,
    targetMintKeypair = Keypair.generate(),
    decimals,
  }: ICreateMetadataForBondingArgs): Promise<
    InstructionResult<{ metadata: PublicKey; mint: PublicKey }>
  > {
    console.log("decimals", decimals);
    const targetMint = targetMintKeypair.publicKey;
    const instructions = [];
    const signers = [];

    instructions.push(
      ...(await createMintInstructions(
        this.tokenBondingSdk.provider,
        this.provider.wallet.publicKey,
        targetMint,
        decimals
      ))
    );
    signers.push(targetMintKeypair);
    const {
      instructions: metadataInstructions,
      signers: metadataSigners,
      output,
    } = await this.tokenMetadataSdk.createMetadataInstructions({
      data: metadata,
      mint: targetMint,
      mintAuthority: this.provider.wallet.publicKey,
      authority: metadataUpdateAuthority,
    });
    instructions.push(...metadataInstructions);
    signers.push(...metadataSigners);

    instructions.push(
      Token.createSetAuthorityInstruction(
        TOKEN_PROGRAM_ID,
        targetMint,
        (await SplTokenBonding.tokenBondingKey(targetMint))[0],
        "MintTokens",
        this.provider.wallet.publicKey,
        []
      )
    );

    return {
      instructions,
      signers,
      output: {
        ...output,
        mint: targetMint,
      },
    };
  }

  /**
   * Creates a market item selling a quantity qty for a price
   *
   * @param param0
   * @returns
   */
  async createMarketItemInstructions({
    payer = this.provider.wallet.publicKey,
    seller = this.provider.wallet.publicKey,
    metadata,
    metadataUpdateAuthority = seller,
    quantity,
    price,
    bondingArgs,
    baseMint,
    targetMintKeypair,
  }: ICreateMarketItemArgs): Promise<
    BigInstructionResult<{ tokenBonding: PublicKey }>
  > {
    if (!price && !bondingArgs?.curve) {
      throw new Error("Must either pass price or bondingArgs.curve");
    }

    const instructions = [];
    const signers = [];

    metadataUpdateAuthority = metadataUpdateAuthority || seller;

    const {
      output: { mint: targetMint },
      signers: metadataSigners,
      instructions: metadataInstructions,
    } = await this.createMetadataForBondingInstructions({
      targetMintKeypair,
      metadata,
      metadataUpdateAuthority: metadataUpdateAuthority!,
      decimals: bondingArgs?.targetMintDecimals || 0,
    });

    instructions.push(...metadataInstructions);
    signers.push(...metadataSigners);

    let curve = bondingArgs?.curve;
    if (price) {
      const {
        instructions: curveInstructions,
        signers: curveSigners,
        output: { curve: outCurve },
      } = await this.tokenBondingSdk.initializeCurveInstructions({
        config: new ExponentialCurveConfig({
          c: 0,
          pow: 0,
          frac: 1,
          b: price,
        }),
      });
      instructions.push(...curveInstructions);
      signers.push(...curveSigners);
      curve = outCurve;
    }

    const {
      output: { tokenBonding },
      instructions: tokenBondingInstructions,
      signers: tokenBondingSigners,
    } = await this.tokenBondingSdk.createTokenBondingInstructions({
      payer,
      curve: curve!,
      reserveAuthority: seller,
      generalAuthority: seller,
      curveAuthority: seller,
      targetMint,
      mintCap: quantity ? new BN(quantity) : undefined,
      ignoreExternalReserveChanges: true,
      ignoreExternalSupplyChanges: true,
      sellFrozen: true,
      buyBaseRoyaltyPercentage: 0,
      sellBaseRoyaltyPercentage: 0,
      sellTargetRoyaltyPercentage: 0,
      buyTargetRoyaltyPercentage: 0,
      baseMint,
      ...bondingArgs,
    });

    return {
      output: {
        tokenBonding,
      },
      instructions: [instructions, tokenBondingInstructions],
      signers: [signers, tokenBondingSigners],
    };
  }

  /**
   * Executes `createMarketItemIntructions`
   * @param args
   * @returns
   */
  async createMarketItem(
    args: ICreateMarketItemArgs,
    finality?: Finality
  ): Promise<{ tokenBonding: PublicKey }> {
    return this.tokenBondingSdk.executeBig(
      this.createMarketItemInstructions(args),
      args.payer,
      finality
    );
  }

  static isNormalBounty(tokenBonding: ITokenBonding | undefined): boolean {
    if (!tokenBonding) {
      return true;
    }

    return (
      tokenBonding.buyBaseRoyaltyPercentage == 0 &&
      tokenBonding.sellBaseRoyaltyPercentage == 0 &&
      tokenBonding.buyTargetRoyaltyPercentage == 0 &&
      tokenBonding.sellTargetRoyaltyPercentage == 0 &&
      tokenBonding.curve.equals(new PublicKey(MarketplaceSdk.FIXED_CURVE)) &&
      tokenBonding.curveAuthority == null &&
      !tokenBonding.ignoreExternalReserveChanges &&
      !tokenBonding.ignoreExternalSupplyChanges &&
      tokenBonding.mintCap == 0 &&
      tokenBonding.purchaseCap == 0
    );
  }

  /**
   * Creates a bounty
   *
   * @param param0
   * @returns
   */
  async createBountyInstructions({
    payer = this.provider.wallet.publicKey,
    authority = this.provider.wallet.publicKey,
    targetMintKeypair,
    metadata,
    metadataUpdateAuthority = authority,
    bondingArgs,
    baseMint,
  }: ICreateBountyArgs): Promise<
    BigInstructionResult<{ tokenBonding: PublicKey; targetMint: PublicKey }>
  > {
    const curve =
      bondingArgs?.curve || new PublicKey(MarketplaceSdk.FIXED_CURVE);
    const baseMintAcct = await getMintInfo(this.provider, baseMint);

    const instructions = [];
    const signers = [];

    metadataUpdateAuthority = metadataUpdateAuthority || authority;

    const {
      output: { mint: targetMint },
      signers: metadataSigners,
      instructions: metadataInstructions,
    } = await this.createMetadataForBondingInstructions({
      metadata,
      targetMintKeypair,
      metadataUpdateAuthority: metadataUpdateAuthority!,
      decimals:
        typeof bondingArgs?.targetMintDecimals == "undefined"
          ? baseMintAcct.decimals
          : bondingArgs.targetMintDecimals,
    });

    instructions.push(...metadataInstructions);
    signers.push(...metadataSigners);

    const {
      output: { tokenBonding },
      instructions: tokenBondingInstructions,
      signers: tokenBondingSigners,
    } = await this.tokenBondingSdk.createTokenBondingInstructions({
      payer,
      curve: curve!,
      reserveAuthority: authority,
      generalAuthority: authority,
      targetMint,
      buyBaseRoyaltyPercentage: 0,
      sellBaseRoyaltyPercentage: 0,
      sellTargetRoyaltyPercentage: 0,
      buyTargetRoyaltyPercentage: 0,
      baseMint,
      ...bondingArgs,
    });

    return {
      output: {
        tokenBonding,
        targetMint,
      },
      instructions: [instructions, tokenBondingInstructions],
      signers: [signers, tokenBondingSigners],
    };
  }

  /**
   * Executes `createBountyIntructions`
   * @param args
   * @returns
   */
  async createBounty(
    args: ICreateBountyArgs,
    finality?: Finality
  ): Promise<{ tokenBonding: PublicKey; targetMint: PublicKey }> {
    return this.tokenBondingSdk.executeBig(
      this.createBountyInstructions(args),
      args.payer,
      finality
    );
  }
}
