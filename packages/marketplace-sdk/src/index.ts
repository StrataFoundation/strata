import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import {
  AnchorProvider,
  BorshAccountsCoder,
  Provider,
} from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import { Finality, Keypair, PublicKey, Signer, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import {
  ExponentialCurveConfig,
  ICreateTokenBondingArgs,
  ICreateTokenBondingOutput,
  ICurveConfig,
  ITokenBonding,
  SplTokenBonding,
  TimeDecayExponentialCurveConfig,
  toBN,
} from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import {
  FungibleEntangler,
  ICreateFungibleEntanglerOutput,
} from "@strata-foundation/fungible-entangler";
import {
  Attribute,
  BigInstructionResult,
  createMintInstructions,
  getMintInfo,
  getTokenAccount,
  InstructionResult,
  percent,
  SplTokenMetadata,
} from "@strata-foundation/spl-utils";
import BN from "bn.js";
import bs58 from "bs58";
import { Buffer } from "buffer";

export const FEES_WALLET = new PublicKey(
  "989wTE33inEx5k3o8pxSSSU9HEmf9Sj4PSqF6NZbxHkp"
);
export const FIXED_CURVE_FEES = 0;
export const LBC_CURVE_FEES = 0;

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
  bondingArgs?: Partial<ICreateTokenBondingArgs>;
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
  bondingArgs?: Partial<ICreateTokenBondingArgs>;
}

interface ILbcCurveArgs {
  /** Max tokens to be sold */
  maxSupply: number;
  /** Interval in seconds to sell them over */
  interval: number;
  /**
   * Starting price
   */
  startPrice: number;
  /**
   * Minimum price (finishing price if no one buys anything)
   */
  minPrice: number;
  /** Optional, the time decay exponential */
  timeDecay?: number;
}

interface ICreateLiquidityBootstrapperArgs
  extends ILbcCurveArgs {
  payer?: PublicKey;
  /**
   * Optionally, use this keypair to create the target mint
   */
  targetMintKeypair?: Keypair;
  /**
   * Optionally, use this mint. You must have mint authority
   */
  targetMint?: PublicKey;
  /**
   * Wallet who will recieve the funds from the liquidity bootstrapping
   */
  authority?: PublicKey;
  /**
   * The token metadata for the LBC item
   */
  metadata?: DataV2;

  /**
   * The update authority on the metadata created. **Default:** authority
   */
  metadataUpdateAuthority?: PublicKey;

  /**
   * The mint to base the sales off of
   */
  baseMint: PublicKey;

  /**
   * Optionally -- override bonding params
   */
  bondingArgs?: Partial<ICreateTokenBondingArgs>;
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

interface IDisburseCurveArgs {
  payer?: PublicKey;
  /**
   * The token bonding id of the bounty
   */
  tokenBonding: PublicKey;
  /**
   * The destination to disburse funds to (ata)
   */
  destination?: PublicKey;

  /**
   * The destination wallet to disburse funds to (if not providing destination)
   */
  destinationWallet?: PublicKey;

  /** If this is an initial token offering, also close the second curve */
  includeRetrievalCurve?: boolean;

  /** Should this only transfer reserves, or transfer and close? */
  closeBonding?: Boolean;

  /** Should this close the passed entangler for token offerings? */
  closeEntangler?: Boolean;

  parentEntangler?: PublicKey;
  childEntangler?: PublicKey;
}

interface ICreateTokenBondingForSetSupplyArgs
  extends ICreateTokenBondingArgs,
    Omit<ICreateRetrievalCurveForSetSupplyArgs, "targetMint"> {}

interface ICreateRetrievalCurveForSetSupplyArgs {
  payer?: PublicKey;
  /** The source for the set supply (**Default:** ata of provider wallet) */
  source?: PublicKey;
  /** The mint we're selling a set supply of */
  supplyMint: PublicKey;
  /** The set supply to sell */
  supplyAmount: number;
  /** Optional override of the default fixed constant price curve */
  fixedCurve?: PublicKey;

  /**
   * Authority to swap or change the reserve account.
   */
  reserveAuthority?: PublicKey | null;

  targetMint: PublicKey;
}

interface ICreateManualTokenArgs {
  payer?: PublicKey;
  /**
   * Optional vanity keypair
   */
  mintKeypair?: Keypair;
  decimals: number;
  amount: number;
  metadata: DataV2;
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
    provider: AnchorProvider,
    splTokenBondingProgramId: PublicKey = SplTokenBonding.ID,
    splTokenCollectiveProgramId: PublicKey = SplTokenCollective.ID,
    fungibleEntanglerProgramId: PublicKey = FungibleEntangler.ID
  ): Promise<MarketplaceSdk> {
    return new this(
      provider,
      await SplTokenBonding.init(provider, splTokenBondingProgramId),
      await SplTokenCollective.init(provider, splTokenCollectiveProgramId),
      await FungibleEntangler.init(provider, fungibleEntanglerProgramId),
      await SplTokenMetadata.init(provider)
    );
  }

  constructor(
    readonly provider: AnchorProvider,
    readonly tokenBondingSdk: SplTokenBonding,
    readonly tokenCollectiveSdk: SplTokenCollective,
    readonly fungibleEntanglerSdk: FungibleEntangler,
    readonly tokenMetadataSdk: SplTokenMetadata
  ) {}

  async createManualTokenInstructions({
    mintKeypair = Keypair.generate(),
    decimals,
    metadata,
    amount,
    payer = this.provider.wallet.publicKey,
  }: ICreateManualTokenArgs): Promise<InstructionResult<{ mint: PublicKey }>> {
    const publicKey = this.provider.wallet.publicKey;
    var mint = mintKeypair.publicKey;
    var instructions: TransactionInstruction[] = [];
    var ata = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      publicKey
    );
    instructions.push(
      ...(await createMintInstructions(
        this.provider,
        publicKey,
        mint,
        0,
        publicKey
      ))
    );
    var metadataInstructions =
      await this.tokenMetadataSdk.createMetadataInstructions({
        mint,
        authority: publicKey,
        data: metadata,
      });
    instructions.push(...metadataInstructions.instructions);
    instructions.push(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        ata,
        publicKey,
        publicKey
      )
    );
    instructions.push(
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mint,
        ata,
        publicKey,
        [],
        amount,
      )
    );
    return {
      instructions,
      signers: [mintKeypair],
      output: { mint },
    };
  }

  async createManualToken(
    args: ICreateManualTokenArgs
  ): Promise<{ mint: PublicKey }> {
    const { instructions, signers, output } =
      await this.createManualTokenInstructions(args);
    await this.tokenMetadataSdk.sendInstructions(
      instructions,
      signers,
      args.payer
    );
    return output;
  }

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

  async disburseBountyInstructions(
    args: IDisburseCurveArgs
  ): Promise<InstructionResult<null>> {
    return this.disburseCurveInstructions(args);
  }

  /**
   * Disburses all of the funds from the curve to the specified address
   * and closes the bonding curve
   *
   * If the bounty is owned by a previous unclaimed social token, handles the changeover of owners
   *
   * @param param0
   * @returns
   */
  async disburseCurveInstructions({
    tokenBonding,
    destination,
    destinationWallet = this.provider.wallet.publicKey,
    includeRetrievalCurve,
    closeBonding = true,
    parentEntangler,
    childEntangler,
    closeEntangler,
  }: IDisburseCurveArgs): Promise<InstructionResult<null>> {
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];
    const tokenBondingAcct = (await this.tokenBondingSdk.getTokenBonding(
      tokenBonding
    ))!;
    let authority: PublicKey | null = null;
    try {
      const tokenRef = await this.tokenCollectiveSdk.getTokenRef(
        tokenBondingAcct.reserveAuthority! as PublicKey
      );

      if (tokenRef) {
        authority = tokenRef.owner;

        const { instructions: i0, signers: s0 } =
          await this.tokenCollectiveSdk.claimBondingAuthorityInstructions({
            tokenBonding,
          });
        instructions.push(...i0);
        signers.push(...s0);
      }
    } catch (e: any) {
      // ignore
    }

    const reserveAmount = await this.tokenBondingSdk.getTokenAccountBalance(
      tokenBondingAcct.baseStorage
    );
    const { instructions: i1, signers: s1 } =
      await this.tokenBondingSdk?.transferReservesInstructions({
        amount: reserveAmount!,
        destination,
        destinationWallet,
        tokenBonding,
        reserveAuthority: authority || undefined,
      });
    instructions.push(...i1);
    signers.push(...s1);

    if (closeBonding) {
      const { instructions: i2, signers: s2 } =
        await this.tokenBondingSdk.closeInstructions({
          tokenBonding,
          generalAuthority: authority || undefined,
        });
      instructions.push(...i2);
      signers.push(...s2);
    }

    if (closeEntangler && parentEntangler && childEntangler) {
      const parentEntanglerAcct =
        (await this.fungibleEntanglerSdk.getParentEntangler(parentEntangler))!;
      const childEntanglerAcct =
        (await this.fungibleEntanglerSdk.getChildEntangler(childEntangler))!;
      const childAmount = await this.tokenBondingSdk.getTokenAccountBalance(
        childEntanglerAcct.childStorage
      );
      const parentAmount = await this.tokenBondingSdk.getTokenAccountBalance(
        parentEntanglerAcct.parentStorage
      );

      const transferChild =
        await this.fungibleEntanglerSdk.transferInstructions({
          childEntangler,
          amount: childAmount,
          destination,
          destinationWallet,
        });
      const transferParent =
        await this.fungibleEntanglerSdk.transferInstructions({
          parentEntangler,
          amount: parentAmount,
          destination,
          destinationWallet,
        });

      const closeChild = await this.fungibleEntanglerSdk.closeInstructions({
        childEntangler,
      });

      const closeParent = await this.fungibleEntanglerSdk.closeInstructions({
        parentEntangler,
      });

      instructions.push(
        ...transferChild.instructions,
        ...transferParent.instructions,
        ...closeChild.instructions,
        ...closeParent.instructions
      );
      signers.push(
        ...transferChild.signers,
        ...transferParent.signers,
        ...closeChild.signers,
        ...closeParent.signers
      );
    }

    if (includeRetrievalCurve) {
      const retrievalInstrs = await this.disburseCurveInstructions({
        tokenBonding: (
          await SplTokenBonding.tokenBondingKey(tokenBondingAcct.targetMint, 1)
        )[0],
        includeRetrievalCurve: false,
        destinationWallet,
        destination,
      });
      instructions.push(...retrievalInstrs.instructions);
      signers.push(...retrievalInstrs.signers);
    }

    return {
      output: null,
      instructions,
      signers,
    };
  }

  async disburseBounty(
    args: IDisburseCurveArgs,
    finality?: Finality
  ): Promise<null> {
    return this.disburseCurve(args, finality);
  }

  /**
   * Executes `disburseCurveInstructions`
   * @param args
   * @returns
   */
  async disburseCurve(
    args: IDisburseCurveArgs,
    finality?: Finality
  ): Promise<null> {
    return this.tokenBondingSdk.execute(
      this.disburseCurveInstructions(args),
      args.payer,
      finality
    );
  }

  async getBounties({
    baseMint,
  }: {
    baseMint?: PublicKey;
  }): Promise<GetBountyItem[]> {
    const state = await this.tokenBondingSdk.getState();
    if (baseMint?.equals(NATIVE_MINT)) {
      baseMint = state!.wrappedSolMint;
    }
    const descriminator =
      BorshAccountsCoder.accountDiscriminator("tokenBondingV0");
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
              Buffer.from(new Uint8Array([0, 0])),
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

    return mints.map((mint, index) => {
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
    metadataUpdateAuthority = this.provider.wallet.publicKey,
    metadata,
    targetMintKeypair = Keypair.generate(),
    decimals,
  }: ICreateMetadataForBondingArgs): Promise<
    InstructionResult<{ metadata: PublicKey; mint: PublicKey }>
  > {
    const targetMint = targetMintKeypair.publicKey;
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];

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
    targetMintKeypair = Keypair.generate(),
  }: ICreateMarketItemArgs): Promise<
    BigInstructionResult<{ tokenBonding: PublicKey; targetMint: PublicKey }>
  > {
    if (!price && !bondingArgs?.curve) {
      throw new Error("Must either pass price or bondingArgs.curve");
    }

    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];

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
      const feeModifier =  1;
      const {
        instructions: curveInstructions,
        signers: curveSigners,
        output: { curve: outCurve },
      } = await this.tokenBondingSdk.initializeCurveInstructions({
        config: new ExponentialCurveConfig({
          c: 0,
          pow: 0,
          frac: 1,
          b: price * feeModifier,
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
      reserveAuthority: seller,
      generalAuthority: seller,
      curveAuthority: seller,
      targetMint,
      mintCap: quantity
        ? new BN(
            (
              quantity * Math.pow(10, bondingArgs?.targetMintDecimals || 0)
            ).toLocaleString("fullwide", {
              useGrouping: false,
            })
          )
        : undefined,
      ignoreExternalReserveChanges: true,
      ignoreExternalSupplyChanges: true,
      sellFrozen: true,
      buyBaseRoyaltyPercentage:  0,
      buyBaseRoyaltiesOwner: FEES_WALLET,
      sellBaseRoyaltyPercentage: 0,
      sellTargetRoyaltyPercentage: 0,
      buyTargetRoyaltyPercentage: 0,
      baseMint,
      targetMintDecimals: 0,
      ...bondingArgs,
      curve: curve!,
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
   * Executes `createMarketItemIntructions`
   * @param args
   * @returns
   */
  async createMarketItem(
    args: ICreateMarketItemArgs,
    finality?: Finality
  ): Promise<{ tokenBonding: PublicKey; targetMint: PublicKey }> {
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
      tokenBonding.mintCap == null &&
      tokenBonding.purchaseCap == null
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
    targetMintKeypair = Keypair.generate(),
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

    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];

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

  static lbcCurve({
    interval,
    startPrice,
    minPrice,
    maxSupply,
    timeDecay,
  }: ILbcCurveArgs): {
    reserves: number;
    supply: number;
    curveConfig: ICurveConfig;
  } {
    if (startPrice < minPrice) {
      throw new Error("Max price must be more than min price");
    }
    if (minPrice == 0) {
      throw new Error("Min price must be more than 0");
    }
    maxSupply = maxSupply * 2;
    minPrice = minPrice / 2; // Account for ending with k = 1 instead of k = 0
    // end price = start price / (1 + k0)
    // (1 + k0) (end price) = start price
    // (1 + k0)  = (start price) / (end price)
    // k0  = (start price) / (end price) - 1
    const k0 = startPrice / minPrice - 1;
    const k1 = 1; // Price should never stop increasing, or it's easy to have a big price drop at the end.

    return {
      curveConfig: new TimeDecayExponentialCurveConfig({
        k1,
        k0,
        interval,
        c: 1, // Not needed
        d: timeDecay || 1 / Math.max(k0 - 1, 1),
      }),
      reserves: minPrice * maxSupply,
      supply: maxSupply,
    };
  }

  /**
   * Creates an LBC
   *
   * @param param0
   * @returns
   */
  async createLiquidityBootstrapperInstructions({
    payer = this.provider.wallet.publicKey,
    authority = this.provider.wallet.publicKey,
    targetMint,
    targetMintKeypair,
    metadata,
    metadataUpdateAuthority = authority,
    interval,
    startPrice,
    minPrice,
    maxSupply,
    bondingArgs,
    baseMint,
  }: ICreateLiquidityBootstrapperArgs): Promise<
    BigInstructionResult<{ tokenBonding: PublicKey; targetMint: PublicKey }>
  > {
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];
    const feeModifier = 1;
    const {
      reserves: initialReservesPad,
      supply: initialSupplyPad,
      curveConfig,
    } = MarketplaceSdk.lbcCurve({
      interval,
      startPrice: startPrice * feeModifier,
      minPrice: minPrice * feeModifier,
      maxSupply,
    });

    let curve: PublicKey | undefined = bondingArgs?.curve;
    if (!curve) {
      const {
        output: { curve: outCurve },
        instructions: curveInstructions,
        signers: curveSigners,
      } = await this.tokenBondingSdk.initializeCurveInstructions({
        config: curveConfig,
      });
      instructions.push(...curveInstructions);
      signers.push(...curveSigners);
      curve = outCurve;
    }

    const baseMintAcct = await getMintInfo(this.provider, baseMint);

    metadataUpdateAuthority = metadataUpdateAuthority || authority;
    const decimals =
      typeof bondingArgs?.targetMintDecimals == "undefined"
        ? baseMintAcct.decimals
        : bondingArgs.targetMintDecimals;

    if (targetMintKeypair && metadata) {
      const {
        output: { mint: outTargetMint },
        signers: metadataSigners,
        instructions: metadataInstructions,
      } = await this.createMetadataForBondingInstructions({
        metadata,
        targetMintKeypair,
        metadataUpdateAuthority: metadataUpdateAuthority!,
        decimals,
      });
      targetMint = outTargetMint;
      instructions.push(...metadataInstructions);
      signers.push(...metadataSigners);
    }

    if (targetMint && (await this.tokenBondingSdk.accountExists(targetMint))) {
      const mint = await getMintInfo(this.provider, targetMint);
      const mintAuthority = (
        await SplTokenBonding.tokenBondingKey(targetMint)
      )[0];
      if (!mint.mintAuthority) {
        throw new Error("Mint must have an authority");
      }

      if (!mint.mintAuthority!.equals(mintAuthority)) {
        instructions.push(
          await Token.createSetAuthorityInstruction(
            TOKEN_PROGRAM_ID,
            targetMint,
            mintAuthority,
            "MintTokens",
            mint.mintAuthority!,
            []
          )
        );
      }
    }

    const {
      output: { tokenBonding, targetMint: bondingTargetMint },
      instructions: tokenBondingInstructions,
      signers: tokenBondingSigners,
    } = await this.tokenBondingSdk.createTokenBondingInstructions({
      payer,
      curve: curve!,
      reserveAuthority: authority,
      generalAuthority: authority,
      ignoreExternalReserveChanges: true,
      ignoreExternalSupplyChanges: true,
      targetMint,
      sellBaseRoyaltyPercentage: 0,
      sellTargetRoyaltyPercentage: 0,
      buyTargetRoyaltyPercentage: 0,
      baseMint,
      advanced: {
        initialSupplyPad,
        initialReservesPad,
      },
      mintCap: toBN(maxSupply, decimals),
      buyBaseRoyaltyPercentage: 0,
      buyBaseRoyaltiesOwner: FEES_WALLET,
      ...bondingArgs,
    });

    return {
      output: {
        tokenBonding,
        targetMint: bondingTargetMint,
      },
      instructions: [instructions, tokenBondingInstructions],
      signers: [signers, tokenBondingSigners],
    };
  }

  /**
   * Executes `createLiquidityBootstrapperIntructions`
   * @param args
   * @returns
   */
  async createLiquidityBootstrapper(
    args: ICreateLiquidityBootstrapperArgs,
    finality?: Finality
  ): Promise<{ tokenBonding: PublicKey; targetMint: PublicKey }> {
    return this.tokenBondingSdk.executeBig(
      this.createLiquidityBootstrapperInstructions(args),
      args.payer,
      finality
    );
  }

  /**
   * Sell `supplyAmount` supply of tokens of `supplyMint` by creating a system of two bonding curves:
   *
   *    Offer bonding curve - sells an intermediary token for the base token
   *    Retrieval bonding curve - allows burning the intermediary token for the set supply
   */
  async createTokenBondingForSetSupplyInstructions({
    supplyAmount,
    reserveAuthority = this.provider.wallet.publicKey,
    supplyMint,
    source = this.provider.wallet.publicKey,
    fixedCurve = new PublicKey(MarketplaceSdk.FIXED_CURVE),
    ...args
  }: ICreateTokenBondingForSetSupplyArgs): Promise<
    BigInstructionResult<{
      offer: ICreateTokenBondingOutput;
      retrieval: ICreateFungibleEntanglerOutput;
    }>
  > {
    const supplyMintAcc = await getMintInfo(this.provider, supplyMint);
    const sourceAcct = await this.provider.connection.getAccountInfo(source);

    // Source is a wallet, need to get the ATA
    if (!sourceAcct || sourceAcct.owner.equals(SystemProgram.programId)) {
      const ataSource = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        supplyMint,
        source,
        true
      );
      if (!(await this.tokenBondingSdk.accountExists(ataSource))) {
        throw new Error(
          `Source of ${source?.toBase58()} does not hold any ${supplyMint.toBase58()} tokens`
        );
      }

      source = ataSource;
    }

    const offeringInstrs =
      await this.tokenBondingSdk.createTokenBondingInstructions({
        ...args,
        targetMintDecimals: supplyMintAcc.decimals,
        reserveAuthority,
        mintCap: toBN(supplyAmount, supplyMintAcc),
        ignoreExternalReserveChanges: true,
        ignoreExternalSupplyChanges: true, // Necessary because we're going to be burning supply on the other curve
      });

    const retrievalInstrs =
      await this.fungibleEntanglerSdk.createFungibleEntanglerInstructions({
        authority: reserveAuthority!,
        dynamicSeed: Keypair.generate().publicKey.toBuffer(),
        amount: supplyAmount,
        parentMint: supplyMint, // swaps from childMint to parentMint
        childMint: offeringInstrs.output.targetMint,
      });

    return {
      instructions: [offeringInstrs.instructions, retrievalInstrs.instructions],
      signers: [offeringInstrs.signers, retrievalInstrs.signers],
      output: {
        offer: offeringInstrs.output,
        retrieval: retrievalInstrs.output,
      },
    };
  }

  /**
   * Executes `createTokenBondingForSetSupplyInstructions`
   * @param args
   * @returns
   */
  async createTokenBondingForSetSupply(
    args: ICreateTokenBondingForSetSupplyArgs,
    finality?: Finality
  ): Promise<{
    offer: ICreateTokenBondingOutput;
    retrieval: ICreateFungibleEntanglerOutput;
  }> {
    return this.tokenBondingSdk.executeBig(
      this.createTokenBondingForSetSupplyInstructions(args),
      args.payer,
      finality
    );
  }
}
