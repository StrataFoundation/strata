import { DataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { Provider } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Finality, PublicKey, Keypair } from "@solana/web3.js";
import {
  SplTokenBonding,
  ICreateTokenBondingArgs,
  ExponentialCurveConfig,
} from "@strata-foundation/spl-token-bonding";
import {
  BigInstructionResult,
  createMintInstructions,
  InstructionResult,
  SplTokenMetadata,
} from "@strata-foundation/spl-utils";
import BN from "bn.js";

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
   * Account to deposit the resulting funds in. **Default:** ATA on seller
   */
  salesAccount?: PublicKey;
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
}

export class MarketplaceSdk {
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

  async createMetadataForBondingInstructions({
    metadataUpdateAuthority,
    metadata,
    targetMintKeypair = Keypair.generate(),
  }: ICreateMetadataForBondingArgs): Promise<
    InstructionResult<{ metadata: PublicKey; mint: PublicKey }>
  > {
    const targetMint = targetMintKeypair.publicKey;
    const instructions = [];
    const signers = [];

    instructions.push(
      ...(await createMintInstructions(
        this.tokenBondingSdk.provider,
        this.provider.wallet.publicKey,
        targetMint,
        0
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
      metadata,
      metadataUpdateAuthority: metadataUpdateAuthority!,
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
}
