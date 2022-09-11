import {
  CreateMetadataV2,
  DataV2,
  Metadata,
} from "@metaplex-foundation/mpl-token-metadata";
import * as anchor from "@project-serum/anchor";
import { IdlTypes, Program, AnchorProvider } from "@project-serum/anchor";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import {
  Commitment,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  AnchorSdk,
  createMintInstructions,
  getMintInfo,
  getTokenAccount,
  InstructionResult,
  percent,
  SplTokenMetadata,
  TypedAccountParser,
} from "@strata-foundation/spl-utils";
import BN from "bn.js";
import { BondingHierarchy } from "./bondingHierarchy";
import { fromCurve, IPricingCurve, ITransitionFee } from "./curves";
import {
  CurveV0,
  ProgramStateV0,
  SplTokenBondingIDL,
  TokenBondingV0,
} from "./generated/spl-token-bonding";
import { BondingPricing } from "./pricing";
import { amountAsNum, asDecimal, toBN, toNumber, toU128 } from "./utils";

export * from "./bondingHierarchy";
export * from "./curves";
export * from "./generated/spl-token-bonding";
export * from "./pricing";
export * from "./utils";

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function anyDefined(...args: any | undefined[]): boolean {
  return args.some((a: any | undefined) => typeof a !== "undefined");
}

function definedOr<A>(value: A | undefined, def: A): A {
  if (typeof value == "undefined") {
    return def;
  }

  return value!;
}

/**
 * The curve config required by the smart contract is unwieldy, implementors of `CurveConfig` wrap the interface
 */
export interface ICurveConfig {
  toRawConfig(): CurveV0;
}

export interface IPrimitiveCurve {
  toRawPrimitiveConfig(): any;
}

/**
 * Curve configuration for c(S^(pow/frac)) + b
 */
export class ExponentialCurveConfig implements ICurveConfig, IPrimitiveCurve {
  c: BN;
  b: BN;
  pow: number;
  frac: number;

  constructor({
    c = 1,
    b = 0,
    pow = 1,
    frac = 1,
  }: {
    c?: number | BN;
    b?: number | BN;
    pow?: number;
    frac?: number;
  }) {
    this.c = toU128(c);
    this.b = toU128(b);
    this.pow = pow;
    this.frac = frac;

    if (this.b.gt(new BN(0)) && this.c.gt(new BN(0))) {
      throw new Error(
        "Unsupported: Cannot define an exponential function with `b`, the math to go from base to target amount becomes too hard."
      );
    }
  }

  toRawPrimitiveConfig(): any {
    return {
      exponentialCurveV0: {
        // @ts-ignore
        c: this.c,
        // @ts-ignore
        b: this.b,
        // @ts-ignore
        pow: this.pow,
        // @ts-ignore
        frac: this.frac,
      },
    };
  }

  toRawConfig(): CurveV0 {
    return {
      definition: {
        timeV0: {
          curves: [
            {
              // @ts-ignore
              offset: new BN(0),
              // @ts-ignore
              curve: this.toRawPrimitiveConfig(),
            },
          ],
        },
      },
    };
  }
}

/**
 * Curve configuration for c(S^(pow/frac)) + b
 */
export class TimeDecayExponentialCurveConfig
  implements ICurveConfig, IPrimitiveCurve
{
  c: BN;
  k0: BN;
  k1: BN;
  d: BN;
  interval: number;

  constructor({
    c = 1,
    k0 = 0,
    k1 = 1,
    d = 1,
    interval = 24 * 60 * 60,
  }: {
    c?: number | BN;
    k0?: number | BN;
    k1?: number | BN;
    d?: number | BN;
    interval?: number;
  }) {
    this.c = toU128(c);
    this.k0 = toU128(k0);
    this.k1 = toU128(k1);
    this.d = toU128(d);
    this.interval = interval;
  }

  toRawPrimitiveConfig(): any {
    return {
      timeDecayExponentialCurveV0: {
        // @ts-ignore
        c: this.c,
        // @ts-ignore
        k0: this.k0,
        k1: this.k1,
        d: this.d,
        // @ts-ignore
        interval: this.interval,
      },
    };
  }

  toRawConfig(): CurveV0 {
    return {
      definition: {
        timeV0: {
          curves: [
            {
              // @ts-ignore
              offset: new BN(0),
              // @ts-ignore
              curve: this.toRawPrimitiveConfig(),
            },
          ],
        },
      },
    };
  }
}

/**
 * Curve configuration that allows the curve to change parameters at discrete time offsets from the go live date
 */
export class TimeCurveConfig implements ICurveConfig {
  curves: {
    curve: IPrimitiveCurve;
    offset: BN;
    buyTransitionFees: ITransitionFee | null;
    sellTransitionFees: ITransitionFee | null;
  }[] = [];

  addCurve(
    timeOffset: number,
    curve: IPrimitiveCurve,
    buyTransitionFees: ITransitionFee | null = null,
    sellTransitionFees: ITransitionFee | null = null
  ): TimeCurveConfig {
    if (this.curves.length == 0 && timeOffset != 0) {
      throw new Error("First time offset must be 0");
    }

    this.curves.push({
      curve,
      offset: new BN(timeOffset),
      buyTransitionFees,
      sellTransitionFees,
    });

    return this;
  }

  toRawConfig(): CurveV0 {
    return {
      definition: {
        timeV0: {
          // @ts-ignore
          curves: this.curves.map(
            ({ curve, offset, buyTransitionFees, sellTransitionFees }) => ({
              curve: curve.toRawPrimitiveConfig(),
              offset,
              buyTransitionFees,
              sellTransitionFees,
            })
          ),
        },
      },
    };
  }
}

export interface IInitializeCurveArgs {
  /** The configuration for the shape of curve */
  config: ICurveConfig;
  /** The payer to create this curve, defaults to provider.wallet */
  payer?: PublicKey;
  /** The keypair to use for this curve */
  curveKeypair?: Keypair;
}

export interface ICreateTokenBondingOutput {
  tokenBonding: PublicKey;
  baseMint: PublicKey;
  targetMint: PublicKey;
  buyBaseRoyalties: PublicKey;
  buyTargetRoyalties: PublicKey;
  sellBaseRoyalties: PublicKey;
  sellTargetRoyalties: PublicKey;
  baseStorage: PublicKey;
}

export interface ICreateTokenBondingArgs {
  /** The payer to create this token bonding, defaults to provider.wallet */
  payer?: PublicKey;
  /** The shape of the bonding curve. Must be created using {@link SplTokenBonding.initializeCurve} */
  curve: PublicKey;
  /** The base mint that the `targetMint` will be priced in terms of. `baseMint` tokens will fill the bonding curve reserves */
  baseMint: PublicKey;
  /**
   * The mint this bonding curve will create on `buy`. If not provided, specify `targetMintDecimals` and it will create one for you
   *
   * It can be useful to pass the mint in if you're creating a bonding curve for an existing mint. Keep in mind,
   * the authority on this mint will need to be set to the token bonding pda
   */
  targetMint?: PublicKey; // If not provided, will create one with `targetMintDecimals`
  /**
   * **Default:** New generated keypair
   *
   * Pass in the keypair to use for the mint. Useful if you want a vanity keypair
   */
  targetMintKeypair?: anchor.web3.Keypair;
  /** If `targetMint` is not defined, will create a mint with this number of decimals */
  targetMintDecimals?: number;
  /**
   * Account to store royalties in terms of `baseMint` tokens when the {@link SplTokenBonding.buy} command is issued
   *
   * If not provided, will create an Associated Token Account with `buyBaseRoyaltiesOwner`

   * Note that this can be explicitly set to null if there are no royalties
  */
  buyBaseRoyalties?: PublicKey | null;
  /** Only required when `buyBaseRoyalties` is undefined. The owner of the `buyBaseRoyalties` account. **Default:** `provider.wallet` */
  buyBaseRoyaltiesOwner?: PublicKey;
  /**
   * Account to store royalties in terms of `targetMint` tokens when the {@link SplTokenBonding.buy} command is issued
   *
   * If not provided, will create an Associated Token Account with `buyTargetRoyaltiesOwner`
   *
   * Note that this can be explicitly set to null if there are no royalties
   */
  buyTargetRoyalties?: PublicKey | null;
  /** Only required when `buyTargetRoyalties` is undefined. The owner of the `buyTargetRoyalties` account. **Default:** `provider.wallet` */
  buyTargetRoyaltiesOwner?: PublicKey;
  /**
   * Account to store royalties in terms of `baseMint` tokens when the {@link SplTokenBonding.sell} command is issued
   *
   * If not provided, will create an Associated Token Account with `sellBaseRoyaltiesOwner`
   *
   * Note that this can be explicitly set to null if there are no royalties
   */
  sellBaseRoyalties?: PublicKey | null;
  /** Only required when `sellBaseRoyalties` is undefined. The owner of the `sellBaseRoyalties` account. **Default:** `provider.wallet` */
  sellBaseRoyaltiesOwner?: PublicKey;
  /**
   * Account to store royalties in terms of `targetMint` tokens when the {@link SplTokenBonding.sell} command is issued
   *
   * If not provided, will create an Associated Token Account with `sellTargetRoyaltiesOwner`
   *
   *  Note that this can be explicitly set to null if there are no royalties
   */
  sellTargetRoyalties?: PublicKey | null;
  /** Only required when `sellTargetRoyalties` is undefined. The owner of the `sellTargetRoyalties` account. **Default:** `provider.wallet` */
  sellTargetRoyaltiesOwner?: PublicKey;
  /**
   * General authority to change things like royalty percentages and freeze the curve. This is the least dangerous authority
   * **Default:** Wallet public key. Pass null to explicitly not set this authority.
   */
  generalAuthority?: PublicKey | null;
  /**
   * Authority to swap or change the reserve account. **This authority is dangerous. Use with care**
   *
   * From a trust perspective, this authority should almost always be held by another program that handles migrating bonding
   * curves, instead of by an individual.
   *
   * **Default:** null. You most likely don't need this permission, if it is being set you should do so explicitly.
   */
  reserveAuthority?: PublicKey | null;

  /**
   * Authority to swap or change the underlying curve. **This authority is dangerous. Use with care**
   *
   * From a trust perspective, this authority should almost always be held by another program that handles migrating bonding
   * curves, instead of by an individual.
   *
   * **Default:** null. You most likely don't need this permission, if it is being set you should do so explicitly.
   */
  curveAuthority?: PublicKey | null;
  /** Number from 0 to 100. Default: 0 */
  buyBaseRoyaltyPercentage?: number;
  /** Number from 0 to 100. Default: 0 */
  buyTargetRoyaltyPercentage?: number;
  /** Number from 0 to 100. Default: 0 */
  sellBaseRoyaltyPercentage?: number;
  /** Number from 0 to 100. Default: 0 */
  sellTargetRoyaltyPercentage?: number;
  /** Maximum `targetMint` tokens this bonding curve will mint before disabling {@link SplTokenBonding.buy}. **Default:** infinite */
  mintCap?: BN;
  /** Maximum `targetMint` tokens that can be purchased in a single call to {@link SplTokenBonding.buy}. Useful for limiting volume. **Default:** 0 */
  purchaseCap?: BN;
  /** The date this bonding curve will go live. Before this date, {@link SplTokenBonding.buy} and {@link SplTokenBonding.sell} are disabled. **Default:** 1 second ago */
  goLiveDate?: Date;
  /** The date this bonding curve will shut down. After this date, {@link SplTokenBonding.buy} and {@link SplTokenBonding.sell} are disabled. **Default:** null */
  freezeBuyDate?: Date;
  /** Should this bonding curve be frozen initially? It can be unfrozen using {@link SplTokenBonding.updateTokenBonding}. **Default:** false */
  buyFrozen?: boolean;
  /** Should this bonding curve have sell functionality? **Default:** false */
  sellFrozen?: boolean;
  /**
   *
   * Should the bonding curve's price change based on funds entering or leaving the reserves account outside of buy/sell
   *
   * Setting this to `false` means that sending tokens into the reserves improves value for all holders,
   * withdrawing money from reserves (via reserve authority) detracts value from holders.
   *
   */
  ignoreExternalReserveChanges?: boolean;
  /**
   * Should the bonding curve's price change based on external burning of target tokens?
   *
   * Setting this to `false` enables what is called a "sponsored burn". With a sponsored burn,
   * burning tokens increases the value for all holders
   */
  ignoreExternalSupplyChanges?: boolean;
  /**
   * Multiple bonding curves can exist for a given target mint.
   * 0 is reserved for the one where the program owns mint authority and can mint new tokens. All other curves may exist as
   * markeplace curves
   */
  index?: number;

  advanced?: {
    /**
     * Initial padding is an advanced feature, incorrect use could lead to insufficient reserves to cover sells
     *
     * Start the curve off at a given reserve and supply synthetically. This means price can start nonzero. The current use case
     * for this is LBCs. Note that a curve cannot be adaptive. ignoreExternalReserveChanges and ignoreExternalSupplyChanges
     * must be true
     * */
    initialSupplyPad: BN | number;
    /**
     * Initial padding is an advanced feature, incorrect use could lead to insufficient reserves to cover sells
     * */
    initialReservesPad: BN | number;
  };
}

export interface IUpdateTokenBondingCurveArgs {
  tokenBonding: PublicKey;
  curve: PublicKey;
}

export interface IUpdateTokenBondingArgs {
  /** The bonding curve to update */
  tokenBonding: PublicKey;
  /** Number from 0 to 100. **Default:** current */
  buyBaseRoyaltyPercentage?: number;
  /** Number from 0 to 100. **Default:** current */
  buyTargetRoyaltyPercentage?: number;
  /** Number from 0 to 100. **Default:** current */
  sellBaseRoyaltyPercentage?: number;
  /** Number from 0 to 100. **Default:** current */
  sellTargetRoyaltyPercentage?: number;
  /** A new account to store royalties. **Default:** current */
  buyBaseRoyalties?: PublicKey;
  /** A new account to store royalties. **Default:** current */
  buyTargetRoyalties?: PublicKey;
  /** A new account to store royalties. **Default:** current */
  sellBaseRoyalties?: PublicKey;
  /** A new account to store royalties. **Default:** current */
  sellTargetRoyalties?: PublicKey;
  generalAuthority?: PublicKey | null;
  reserveAuthority?: PublicKey | null;
  /** Should this bonding curve be frozen, disabling buy and sell? It can be unfrozen using {@link SplTokenBonding.updateTokenBonding}. **Default:** current */
  buyFrozen?: boolean;
}

export interface IBuyArgs {
  tokenBonding: PublicKey;
  /** The payer to run this transaction, defaults to provider.wallet */
  payer?: PublicKey;
  /** The source account to purchase with. **Default:** ata of `sourceAuthority` */
  source?: PublicKey;
  /** The source destination to purchase to. **Default:** ata of `sourceAuthority` */
  destination?: PublicKey;
  /** The wallet funding the purchase. **Default:** Provider wallet */
  sourceAuthority?: PublicKey;
  /** Must provide either base amount or desired target amount */
  desiredTargetAmount?: BN | number;
  baseAmount?: BN | number;
  expectedOutputAmount?:
    | BN
    | number /** Expected output amount of `targetMint` before slippage */;
  /** When using desiredTargetAmount, the expected base amount used before slippage */
  expectedBaseAmount?: BN | number;
  /** Decimal number. max price will be (1 + slippage) * price_for_desired_target_amount */
  slippage: number;
}

/** DEPRECATED. Will be removed in a future version */
export interface IExtraInstructionArgs {
  tokenBonding: ITokenBonding;
  isBuy: boolean;
  amount: BN | undefined;
}

export interface IPreInstructionArgs {
  tokenBonding: ITokenBonding;
  isBuy: boolean;
  amount: BN | undefined;
  desiredTargetAmount?: BN | number;
  isFirst: boolean;
}

export interface IPostInstructionArgs {
  isBuy: boolean;
  amount: number | BN | undefined;
  isLast: boolean; // is this the last swap transaction
}

export interface ISwapArgs {
  baseMint: PublicKey;
  targetMint: PublicKey;
  /** The payer to run this transaction, defaults to provider.wallet */
  payer?: PublicKey;
  /** The wallet funding the purchase. **Default:** Provider wallet */
  sourceAuthority?: PublicKey;
  /** The amount of baseMint to purchase with */
  baseAmount?: BN | number;
  expectedOutputAmount?:
    | BN
    | number /** Expected output amount before slippage */;
  expectedBaseAmount?:
    | BN
    | number /** Only when `desiredOutputAmount` present: Expected base amount before slippage */;
  /**
   * Desired output amount. If specified, uses buy({ desiredTargetAmount }) for the last stage of the swap. This
   * is useful in decimals 0 type situation where you want the whole item or nothing
   */
  desiredTargetAmount?: BN | number;
  /** The slippage PER TRANSACTION */
  slippage: number;

  /** DEPRECATED. Will be removed in a future version. Please use preInstructions instead */
  extraInstructions?: (
    args: IExtraInstructionArgs
  ) => Promise<InstructionResult<null>>;
  /** Optionally inject extra instructions before each trade. Usefull for adding txn fees */
  preInstructions?: (
    args: IPreInstructionArgs
  ) => Promise<InstructionResult<null>>;
  /** Optionally inject extra instructions after each transaction */
  postInstructions?: (
    args: IPostInstructionArgs
  ) => Promise<InstructionResult<null>>;

  /** If the token is entangled, this is the mint of the entangled token */
  entangled?: PublicKey | null;

  /**
   * Number of times to retry the checks for a change in balance. Default: 5
   */
  balanceCheckTries?: number;
}

export interface ISellArgs {
  tokenBonding: PublicKey;
  /** The payer to run this transaction, defaults to provider.wallet */
  payer?: PublicKey;
  source?: PublicKey /** `targetMint` source account to sell from. **Default:** ATA of sourceAuthority */;
  destination?: PublicKey /** `baseMint` destination for tokens from the reserve. **Default:** ATA of wallet */;
  sourceAuthority?: PublicKey /** **Default:** wallet */;
  targetAmount: BN | number /** The amount of `targetMint` tokens to sell. */;
  expectedOutputAmount?:
    | BN
    | number /** Expected output amount of `baseMint` before slippage */;
  slippage: number /* Decimal number. max price will be (1 + slippage) * price_for_desired_target_amount */;
}

export interface ICloseArgs {
  tokenBonding: PublicKey;
  /** The payer to run this transaction. **Default:** provider.wallet */
  payer?: PublicKey;
  /** Account to receive the rent sol. **Default**: provide.wallet */
  refund?: PublicKey;
  /**
   * Optional (**Default**: General authority on the token bonding). This parameter is only needed when updating the general
   * authority in the same txn as ruunning close
   */
  generalAuthority?: PublicKey;
}

export interface ITransferReservesArgs {
  /** The payer to run this transaction, defaults to provider.wallet */
  payer?: PublicKey;
  tokenBonding: PublicKey;
  amount: BN | number;
  /**
   * The destination for the reserves **Default:** ata of destinationWallet
   */
  destination?: PublicKey;
  /**
   * The destination wallet for the reserves **Default:**
   */
  destinationWallet?: PublicKey;
  /**
   * Optional (**Default**: Reserve authority on the token bonding). This parameter is only needed when updating the reserve
   * authority in the same txn as ruunning transfer
   */
  reserveAuthority?: PublicKey;
}

export interface IBuyBondingWrappedSolArgs {
  amount:
    | BN
    | number /** The amount of wSOL to buy. If a number, multiplied out to get lamports. If BN, it's lamports */;
  destination?: PublicKey /** The destination twSOL account. **Default:** ATA of owner */;
  source?: PublicKey /** The source of non-wrapped SOL */;
  payer?: PublicKey;
}

export interface ISellBondingWrappedSolArgs {
  amount:
    | BN
    | number /** The amount of wSOL to buy. If a number, multiplied out to get lamports. If BN, it's lamports */;
  source?: PublicKey /** The twSOL source account. **Default:** ATA of owner */;
  destination?: PublicKey /** The destination to send the actual SOL lamports. **Default:** provider wallet */;
  owner?: PublicKey /** The owner of the twSOL source account. **Default:** provider wallet */;
  payer?: PublicKey;
  all?: boolean /** Sell all and close this account? **Default:** false */;
}

/**
 * Unified token bonding interface wrapping the raw TokenBondingV0
 */
export interface ITokenBonding extends TokenBondingV0 {
  publicKey: PublicKey;
}

export interface IProgramState extends ProgramStateV0 {
  publicKey: PublicKey;
}

/**
 * Unified curve interface wrapping the raw CurveV0
 */
export interface ICurve extends CurveV0 {
  publicKey: PublicKey;
}

export class SplTokenBonding extends AnchorSdk<SplTokenBondingIDL> {
  state: IProgramState | undefined;

  static ID = new PublicKey("TBondmkCYxaPCKG4CHYfVTcwQ8on31xnJrPzk8F8WsS");

  static async init(
    provider: AnchorProvider,
    splTokenBondingProgramId: PublicKey = SplTokenBonding.ID
  ): Promise<SplTokenBonding> {
    const SplTokenBondingIDLJson = await anchor.Program.fetchIdl(
      splTokenBondingProgramId,
      provider
    );
    const splTokenBonding = new anchor.Program<SplTokenBondingIDL>(
      SplTokenBondingIDLJson as SplTokenBondingIDL,
      splTokenBondingProgramId,
      provider
    ) as anchor.Program<SplTokenBondingIDL>;

    return new this(provider, splTokenBonding);
  }

  constructor(provider: AnchorProvider, program: Program<SplTokenBondingIDL>) {
    super({ provider, program });
  }

  curveDecoder: TypedAccountParser<ICurve> = (pubkey, account) => {
    const coded = this.program.coder.accounts.decode<CurveV0>(
      "CurveV0",
      account.data
    );

    return {
      ...coded,
      publicKey: pubkey,
    };
  };

  tokenBondingDecoder: TypedAccountParser<ITokenBonding> = (
    pubkey,
    account
  ) => {
    const coded = this.program.coder.accounts.decode<ITokenBonding>(
      "TokenBondingV0",
      account.data
    );

    return {
      ...coded,
      publicKey: pubkey,
    };
  };

  getTokenBonding(tokenBondingKey: PublicKey): Promise<ITokenBonding | null> {
    return this.getAccount(tokenBondingKey, this.tokenBondingDecoder);
  }

  getCurve(curveKey: PublicKey): Promise<ICurve | null> {
    return this.getAccount(curveKey, this.curveDecoder);
  }

  /**
   * This is an admin function run once to initialize the smart contract.
   *
   * @returns Instructions needed to create sol storage
   */
  async initializeSolStorageInstructions({
    mintKeypair,
  }: {
    mintKeypair: Keypair;
  }): Promise<InstructionResult<null>> {
    const exists = await this.getState();
    if (exists) {
      return {
        output: null,
        instructions: [],
        signers: [],
      };
    }

    console.log("Sol storage does not exist, creating...");
    const [state, bumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("state", "utf-8")],
      this.programId
    );
    const [solStorage, solStorageBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("sol-storage", "utf-8")],
      this.programId
    );
    const [wrappedSolAuthority, mintAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("wrapped-sol-authority", "utf-8")],
        this.programId
      );

    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];
    signers.push(mintKeypair);

    instructions.push(
      ...[
        SystemProgram.createAccount({
          fromPubkey: this.wallet.publicKey,
          newAccountPubkey: mintKeypair.publicKey,
          space: 82,
          lamports:
            await this.provider.connection.getMinimumBalanceForRentExemption(
              82
            ),
          programId: TOKEN_PROGRAM_ID,
        }),
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          mintKeypair.publicKey,
          9,
          this.wallet.publicKey,
          wrappedSolAuthority
        ),
      ]
    );

    instructions.push(
      ...new CreateMetadataV2(
        {
          feePayer: this.wallet.publicKey,
        },
        {
          metadata: await Metadata.getPDA(mintKeypair.publicKey),
          mint: mintKeypair.publicKey,
          metadataData: new DataV2({
            name: "Token Bonding Wrapped SOL",
            symbol: "twSOL",
            uri: "",
            sellerFeeBasisPoints: 0,
            // @ts-ignore
            creators: null,
            collection: null,
            uses: null,
          }),
          mintAuthority: this.wallet.publicKey,
          updateAuthority: this.wallet.publicKey,
        }
      ).instructions
    );

    instructions.push(
      Token.createSetAuthorityInstruction(
        TOKEN_PROGRAM_ID,
        mintKeypair.publicKey,
        wrappedSolAuthority,
        "MintTokens",
        this.wallet.publicKey,
        []
      )
    );

    instructions.push(
      await this.instruction.initializeSolStorageV0(
        {
          solStorageBumpSeed,
          bumpSeed,
          mintAuthorityBumpSeed,
        },
        {
          accounts: {
            state,
            payer: this.wallet.publicKey,
            solStorage,
            mintAuthority: wrappedSolAuthority,
            wrappedSolMint: mintKeypair.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    );

    return {
      instructions,
      signers,
      output: null,
    };
  }

  /**
   * Admin command run once to initialize the smart contract
   */
  initializeSolStorage({
    mintKeypair,
  }: {
    mintKeypair: Keypair;
  }): Promise<null> {
    return this.execute(this.initializeSolStorageInstructions({ mintKeypair }));
  }

  /**
   * Create a curve shape for use in a TokenBonding instance
   *
   * @param param0
   * @returns
   */
  async initializeCurveInstructions({
    payer = this.wallet.publicKey,
    config: curveConfig,
    curveKeypair = anchor.web3.Keypair.generate(),
  }: IInitializeCurveArgs): Promise<InstructionResult<{ curve: PublicKey }>> {
    const curve = curveConfig.toRawConfig();
    return {
      output: {
        curve: curveKeypair.publicKey,
      },
      signers: [curveKeypair],
      instructions: [
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: curveKeypair.publicKey,
          space: 500,
          lamports:
            await this.provider.connection.getMinimumBalanceForRentExemption(
              500
            ),
          programId: this.programId,
        }),
        await this.instruction.createCurveV0(curve, {
          accounts: {
            payer,
            curve: curveKeypair.publicKey,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }),
      ],
    };
  }

  /**
   * See {@link initializeCurve}
   * @param args
   * @returns
   */
  async initializeCurve(
    args: IInitializeCurveArgs,
    commitment: Commitment = "confirmed"
  ): Promise<PublicKey> {
    return (
      await this.execute(
        this.initializeCurveInstructions(args),
        args.payer,
        commitment
      )
    ).curve;
  }

  /**
   * Get the PDA key of a TokenBonding given the target mint and index
   *
   * `index` = 0 is the default bonding curve that can mint `targetMint`. All other curves are curves that allow burning of `targetMint` for some different base.
   *
   * @param targetMint
   * @param index
   * @returns
   */
  static async tokenBondingKey(
    targetMint: PublicKey,
    index: number = 0,
    programId: PublicKey = SplTokenBonding.ID
  ): Promise<[PublicKey, number]> {
    const pad = Buffer.alloc(2);
    new BN(index, 16, "le").toArrayLike(Buffer).copy(pad);
    return PublicKey.findProgramAddress(
      [Buffer.from("token-bonding", "utf-8"), targetMint!.toBuffer(), pad],
      programId
    );
  }

  static async wrappedSolMintAuthorityKey(
    programId: PublicKey = SplTokenBonding.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("wrapped-sol-authority", "utf-8")],
      programId
    );
  }

  /**
   * Create a bonding curve
   *
   * @param param0
   * @returns
   */
  async createTokenBondingInstructions({
    generalAuthority = this.wallet.publicKey,
    curveAuthority = null,
    reserveAuthority = null,
    payer = this.wallet.publicKey,
    curve,
    baseMint,
    targetMint,
    buyBaseRoyalties,
    buyBaseRoyaltiesOwner = this.wallet.publicKey,
    buyTargetRoyalties,
    buyTargetRoyaltiesOwner = this.wallet.publicKey,
    sellBaseRoyalties,
    sellBaseRoyaltiesOwner = this.wallet.publicKey,
    sellTargetRoyalties,
    sellTargetRoyaltiesOwner = this.wallet.publicKey,
    buyBaseRoyaltyPercentage = 0,
    buyTargetRoyaltyPercentage = 0,
    sellBaseRoyaltyPercentage = 0,
    sellTargetRoyaltyPercentage = 0,
    mintCap,
    purchaseCap,
    goLiveDate,
    freezeBuyDate,
    targetMintDecimals,
    targetMintKeypair = Keypair.generate(),
    buyFrozen = false,
    ignoreExternalReserveChanges = false,
    ignoreExternalSupplyChanges = false,
    sellFrozen = false,
    index,
    advanced = {
      initialSupplyPad: 0,
      initialReservesPad: 0,
    },
  }: ICreateTokenBondingArgs): Promise<
    InstructionResult<ICreateTokenBondingOutput>
  > {
    if (!targetMint) {
      if (sellTargetRoyalties || buyTargetRoyalties) {
        throw new Error(
          "Cannot define target royalties if mint is not defined"
        );
      }

      if (typeof targetMintDecimals == "undefined") {
        throw new Error("Cannot define mint without decimals ");
      }
    }

    if (!goLiveDate) {
      goLiveDate = new Date(0);
      goLiveDate.setUTCSeconds((await this.getUnixTime()) - 10);
    }

    const provider = this.provider;
    const state = (await this.getState())!;
    let isNative =
      baseMint.equals(NATIVE_MINT) || baseMint.equals(state.wrappedSolMint);
    if (isNative) {
      baseMint = state.wrappedSolMint;
    }

    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];
    let shouldCreateMint = false;
    if (!targetMint) {
      signers.push(targetMintKeypair);
      targetMint = targetMintKeypair.publicKey;
      shouldCreateMint = true;
    }

    // Find the proper bonding index to use that isn't taken.
    let indexToUse = index || 0;
    const getTokenBonding: () => Promise<[PublicKey, Number]> = () => {
      return SplTokenBonding.tokenBondingKey(targetMint!, indexToUse);
    };
    const getTokenBondingAccount = async () => {
      return this.provider.connection.getAccountInfo(
        (await getTokenBonding())[0]
      );
    };
    if (!index) {
      // Find an empty voucher account
      while (await getTokenBondingAccount()) {
        indexToUse++;
      }
    } else {
      indexToUse = index;
    }

    const [tokenBonding, bumpSeed] = await SplTokenBonding.tokenBondingKey(
      targetMint!,
      indexToUse
    );

    if (shouldCreateMint) {
      instructions.push(
        ...(await createMintInstructions(
          provider,
          tokenBonding,
          targetMint,
          targetMintDecimals
        ))
      );
    }

    const baseStorageKeypair = anchor.web3.Keypair.generate();
    signers.push(baseStorageKeypair);
    const baseStorage = baseStorageKeypair.publicKey;

    instructions.push(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: baseStorage!,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
        lamports:
          await this.provider.connection.getMinimumBalanceForRentExemption(
            AccountLayout.span
          ),
      }),
      Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        baseMint,
        baseStorage,
        tokenBonding
      )
    );

    if (isNative) {
      buyBaseRoyalties =
        buyBaseRoyalties === null
          ? null
          : buyBaseRoyalties || buyBaseRoyaltiesOwner;
      sellBaseRoyalties =
        sellBaseRoyalties === null
          ? null
          : sellBaseRoyalties || sellBaseRoyaltiesOwner;
    }

    let createdAccts: Set<string> = new Set();
    if (typeof buyTargetRoyalties === "undefined") {
      buyTargetRoyalties = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        targetMint,
        buyTargetRoyaltiesOwner,
        true
      );

      // If sell target royalties are undefined, we'll do this in the next step
      if (
        !createdAccts.has(buyTargetRoyalties.toBase58()) &&
        !(await this.accountExists(buyTargetRoyalties))
      ) {
        console.log("Creating buy target royalties...");
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            targetMint,
            buyTargetRoyalties,
            buyTargetRoyaltiesOwner,
            payer
          )
        );
        createdAccts.add(buyTargetRoyalties.toBase58());
      }
    }

    if (typeof sellTargetRoyalties === "undefined") {
      sellTargetRoyalties = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        targetMint,
        sellTargetRoyaltiesOwner,
        true
      );

      if (
        !createdAccts.has(sellTargetRoyalties.toBase58()) &&
        !(await this.accountExists(sellTargetRoyalties))
      ) {
        console.log("Creating sell target royalties...");
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            targetMint,
            sellTargetRoyalties,
            sellTargetRoyaltiesOwner,
            payer
          )
        );
        createdAccts.add(buyTargetRoyalties!.toBase58());
      }
    }

    if (typeof buyBaseRoyalties === "undefined") {
      buyBaseRoyalties = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        baseMint,
        buyBaseRoyaltiesOwner,
        true
      );

      // If sell base royalties are undefined, we'll do this in the next step
      if (
        !createdAccts.has(buyBaseRoyalties.toBase58()) &&
        !(await this.accountExists(buyBaseRoyalties))
      ) {
        console.log("Creating base royalties...", buyBaseRoyalties.toBase58());
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            baseMint,
            buyBaseRoyalties,
            buyBaseRoyaltiesOwner,
            payer
          )
        );
        createdAccts.add(buyBaseRoyalties.toBase58());
      }
    }

    if (typeof sellBaseRoyalties === "undefined") {
      sellBaseRoyalties = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        baseMint,
        sellBaseRoyaltiesOwner,
        true
      );

      if (
        !createdAccts.has(sellBaseRoyalties.toBase58()) &&
        !(await this.accountExists(sellBaseRoyalties))
      ) {
        console.log("Creating base royalties...", sellBaseRoyalties.toBase58());
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            baseMint,
            sellBaseRoyalties,
            sellBaseRoyaltiesOwner,
            payer
          )
        );
        createdAccts.add(sellBaseRoyalties.toBase58());
      }
    }
    const pads = {
      initialReservesPad: advanced.initialReservesPad
        ? toBN(
            advanced.initialReservesPad,
            await getMintInfo(this.provider, baseMint)
          )
        : new BN(0),
      initialSupplyPad: advanced.initialSupplyPad
        ? toBN(
            advanced.initialSupplyPad,
            typeof targetMintDecimals == "undefined"
              ? (await getMintInfo(this.provider, targetMint)).decimals
              : targetMintDecimals
          )
        : new BN(0),
    };

    instructions.push(
      await this.instruction.initializeTokenBondingV0(
        {
          index: indexToUse,
          goLiveUnixTime: new BN(Math.floor(goLiveDate.valueOf() / 1000)),
          freezeBuyUnixTime: freezeBuyDate
            ? new BN(Math.floor(freezeBuyDate.valueOf() / 1000))
            : null,
          buyBaseRoyaltyPercentage: percent(buyBaseRoyaltyPercentage) || 0,
          buyTargetRoyaltyPercentage: percent(buyTargetRoyaltyPercentage) || 0,
          sellBaseRoyaltyPercentage: percent(sellBaseRoyaltyPercentage) || 0,
          sellTargetRoyaltyPercentage:
            percent(sellTargetRoyaltyPercentage) || 0,
          mintCap: mintCap || null,
          purchaseCap: purchaseCap || null,
          generalAuthority,
          curveAuthority,
          reserveAuthority,
          bumpSeed,
          buyFrozen,
          ignoreExternalReserveChanges,
          ignoreExternalSupplyChanges,
          sellFrozen,
          ...pads,
        },
        {
          accounts: {
            payer: payer,
            curve,
            tokenBonding,
            baseMint,
            targetMint,
            baseStorage,
            buyBaseRoyalties:
              buyBaseRoyalties === null
                ? this.wallet.publicKey // Default to this wallet, it just needs a system program acct
                : buyBaseRoyalties,
            buyTargetRoyalties:
              buyTargetRoyalties === null
                ? this.wallet.publicKey // Default to this wallet, it just needs a system program acct
                : buyTargetRoyalties,
            sellBaseRoyalties:
              sellBaseRoyalties === null
                ? this.wallet.publicKey // Default to this wallet, it just needs a system program acct
                : sellBaseRoyalties,
            sellTargetRoyalties:
              sellTargetRoyalties === null
                ? this.wallet.publicKey // Default to this wallet, it just needs a system program acct
                : sellTargetRoyalties,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
            clock: SYSVAR_CLOCK_PUBKEY,
          },
        }
      )
    );

    return {
      output: {
        baseMint,
        tokenBonding,
        targetMint,
        buyBaseRoyalties: buyBaseRoyalties || this.wallet.publicKey,
        buyTargetRoyalties: buyTargetRoyalties || this.wallet.publicKey,
        sellBaseRoyalties: sellBaseRoyalties || this.wallet.publicKey,
        sellTargetRoyalties: sellTargetRoyalties || this.wallet.publicKey,
        baseStorage,
      },
      instructions,
      signers,
    };
  }

  /**
   * General utility function to check if an account exists
   * @param account
   * @returns
   */
  async accountExists(account: anchor.web3.PublicKey): Promise<boolean> {
    return Boolean(await this.provider.connection.getAccountInfo(account));
  }

  /**
   * Runs {@link `createTokenBondingInstructions`}
   *
   * @param args
   * @returns
   */
  createTokenBonding(
    args: ICreateTokenBondingArgs,
    commitment: Commitment = "confirmed"
  ): Promise<ICreateTokenBondingOutput> {
    return this.execute(
      this.createTokenBondingInstructions(args),
      args.payer,
      commitment
    );
  }

  async getUnixTime(): Promise<number> {
    const acc = await this.provider.connection.getAccountInfo(
      SYSVAR_CLOCK_PUBKEY
    );
    //@ts-ignore
    return Number(acc!.data.readBigInt64LE(8 * 4));
  }

  async updateCurveInstructions({
    tokenBonding: tokenBondingKey,
    curve
  }: IUpdateTokenBondingCurveArgs) {
    const tokenBonding = (await this.getTokenBonding(tokenBondingKey))!;
    if (!tokenBonding) {
      throw new Error(
        "Token bonding does not exist"
      );
    }

    if (!tokenBonding.curveAuthority) {
      throw new Error(
        "No curve authority on this bonding curve"
      );
    }
    return {
      output: null,
      signers: [],
      instructions: [
        await this.instruction.updateCurveV0({curveAuthority: tokenBonding.curveAuthority},
          {
          accounts: {
            tokenBonding: tokenBondingKey,
            curveAuthority: tokenBonding.curveAuthority,
            curve,
          },
        }),
      ],
    };
  }

  /**
   * Runs {@link updateCurveInstructions}
   * @param args
   */
   async updateCurve(
    args: IUpdateTokenBondingCurveArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(
      this.updateCurveInstructions(args),
      this.wallet.publicKey,
      commitment
    );
  }

  /**
   * Update a bonding curve.
   *
   * @param param0
   * @returns
   */
  async updateTokenBondingInstructions({
    tokenBonding,
    buyBaseRoyaltyPercentage,
    buyTargetRoyaltyPercentage,
    sellBaseRoyaltyPercentage,
    sellTargetRoyaltyPercentage,
    buyBaseRoyalties,
    buyTargetRoyalties,
    sellBaseRoyalties,
    sellTargetRoyalties,
    generalAuthority,
    reserveAuthority,
    buyFrozen,
  }: IUpdateTokenBondingArgs): Promise<InstructionResult<null>> {
    const tokenBondingAcct = (await this.getTokenBonding(tokenBonding))!;

    const generalChanges = anyDefined(
      buyBaseRoyaltyPercentage,
      buyTargetRoyaltyPercentage,
      sellBaseRoyaltyPercentage,
      sellTargetRoyaltyPercentage,
      buyBaseRoyalties,
      buyTargetRoyalties,
      sellBaseRoyalties,
      sellTargetRoyalties,
      generalAuthority,
      buyFrozen
    );

    const reserveAuthorityChanges = anyDefined(reserveAuthority);

    const instructions: TransactionInstruction[] = [];

    if (generalChanges) {
      if (!tokenBondingAcct.generalAuthority) {
        throw new Error(
          "Cannot update a token bonding account that has no authority"
        );
      }

      const args: IdlTypes<SplTokenBondingIDL>["UpdateTokenBondingV0Args"] = {
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
        generalAuthority:
          generalAuthority === null
            ? null
            : generalAuthority! ||
              (tokenBondingAcct.generalAuthority as PublicKey),
        buyFrozen:
          typeof buyFrozen === "undefined"
            ? (tokenBondingAcct.buyFrozen as boolean)
            : buyFrozen,
      };
      instructions.push(
        await this.instruction.updateTokenBondingV0(args, {
          accounts: {
            tokenBonding,
            generalAuthority: (tokenBondingAcct.generalAuthority as PublicKey)!,
            baseMint: tokenBondingAcct.baseMint,
            targetMint: tokenBondingAcct.targetMint,
            buyTargetRoyalties:
              buyTargetRoyalties || tokenBondingAcct.buyTargetRoyalties,
            buyBaseRoyalties:
              buyBaseRoyalties || tokenBondingAcct.buyBaseRoyalties,
            sellTargetRoyalties:
              sellTargetRoyalties || tokenBondingAcct.sellTargetRoyalties,
            sellBaseRoyalties:
              sellBaseRoyalties || tokenBondingAcct.sellBaseRoyalties,
          },
        })
      );
    }

    if (reserveAuthorityChanges) {
      if (!tokenBondingAcct.reserveAuthority) {
        throw new Error(
          "Cannot update reserve authority of a token bonding account that has no reserve authority"
        );
      }

      instructions.push(
        await this.instruction.updateReserveAuthorityV0(
          {
            newReserveAuthority: reserveAuthority || null,
          },
          {
            accounts: {
              tokenBonding,
              reserveAuthority:
                (tokenBondingAcct.reserveAuthority as PublicKey)!,
            },
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
   * Runs {@link updateTokenBonding}
   * @param args
   */
  async updateTokenBonding(
    args: IUpdateTokenBondingArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(
      this.updateTokenBondingInstructions(args),
      this.wallet.publicKey,
      commitment
    );
  }

  /**
   * Instructions to buy twSOL from normal SOL.
   *
   * We wrap SOL so that the bonding contract isn't soaking up a bunch o SOL and damaging the security of the network.
   * The plan is to create a DAO for Strata that will govern what happens with this SOL.
   *
   * @param param0
   * @returns
   */
  async buyBondingWrappedSolInstructions({
    payer = this.wallet.publicKey,
    destination,
    source = this.wallet.publicKey,
    amount,
  }: IBuyBondingWrappedSolArgs): Promise<
    InstructionResult<{ destination: PublicKey }>
  > {
    const state = (await this.getState())!;
    const stateAddress = (
      await PublicKey.findProgramAddress(
        [Buffer.from("state", "utf-8")],
        this.programId
      )
    )[0];
    const mintAuthority = (
      await SplTokenBonding.wrappedSolMintAuthorityKey(this.programId)
    )[0];
    const mint = await getMintInfo(this.provider, state.wrappedSolMint);

    let usedAta = false;
    if (!destination) {
      destination = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        state.wrappedSolMint,
        source,
        true
      );
      usedAta = true;
    }
    const instructions: TransactionInstruction[] = [];

    if (usedAta && !(await this.accountExists(destination))) {
      instructions.push(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          state.wrappedSolMint,
          destination,
          source,
          payer
        )
      );
    }

    instructions.push(
      await this.instruction.buyWrappedSolV0(
        {
          amount: toBN(amount, mint),
        },
        {
          accounts: {
            state: stateAddress,
            wrappedSolMint: state.wrappedSolMint,
            mintAuthority: mintAuthority,
            solStorage: state.solStorage,
            source,
            destination,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        }
      )
    );

    return {
      signers: [],
      output: {
        destination,
      },
      instructions,
    };
  }

  /**
   * Invoke `buyBondingWrappedSol` instructions
   * @param args
   * @returns
   */
  buyBondingWrappedSol(
    args: IBuyBondingWrappedSolArgs,
    commitment: Commitment = "confirmed"
  ): Promise<{ destination: PublicKey }> {
    return this.execute(
      this.buyBondingWrappedSolInstructions(args),
      args.payer,
      commitment
    );
  }

  /**
   * Instructions to sell twSOL back into normal SOL.
   *
   * @param param0
   * @returns
   */
  async sellBondingWrappedSolInstructions({
    source,
    owner = this.wallet.publicKey,
    destination = this.wallet.publicKey,
    amount,
    all = false,
  }: ISellBondingWrappedSolArgs): Promise<InstructionResult<null>> {
    const state = (await this.getState())!;
    const stateAddress = (
      await PublicKey.findProgramAddress(
        [Buffer.from("state", "utf-8")],
        this.programId
      )
    )[0];
    const mint = await getMintInfo(this.provider, state.wrappedSolMint);

    if (!source) {
      source = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        state.wrappedSolMint,
        owner,
        true
      );
    }

    const instructions: TransactionInstruction[] = [];

    instructions.push(
      await this.instruction.sellWrappedSolV0(
        {
          amount: toBN(amount, mint),
          all,
        },
        {
          accounts: {
            state: stateAddress,
            wrappedSolMint: state.wrappedSolMint,
            solStorage: state.solStorage,
            source,
            owner,
            destination,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        }
      )
    );

    if (all) {
      instructions.push(
        Token.createCloseAccountInstruction(
          TOKEN_PROGRAM_ID,
          source,
          destination,
          owner,
          []
        )
      );
    }

    return {
      signers: [],
      output: null,
      instructions,
    };
  }

  /**
   * Execute `sellBondingWrappedSolInstructions`
   * @param args
   * @returns
   */
  async sellBondingWrappedSol(
    args: ISellBondingWrappedSolArgs,
    commitment: Commitment = "confirmed"
  ): Promise<null> {
    return this.execute(
      this.sellBondingWrappedSolInstructions(args),
      args.payer,
      commitment
    );
  }

  /**
   * Issue a command to buy `targetMint` tokens with `baseMint` tokens.
   *
   * @param param0
   * @returns
   */
  async buyInstructions({
    tokenBonding,
    source,
    sourceAuthority = this.wallet.publicKey,
    destination,
    desiredTargetAmount,
    baseAmount,
    expectedOutputAmount,
    expectedBaseAmount,
    slippage,
    payer = this.wallet.publicKey,
  }: IBuyArgs): Promise<InstructionResult<null>> {
    const state = (await this.getState())!;
    const tokenBondingAcct = (await this.getTokenBonding(tokenBonding))!;
    const isNative =
      tokenBondingAcct.baseMint.equals(NATIVE_MINT) ||
      tokenBondingAcct.baseMint.equals(state.wrappedSolMint);

    // @ts-ignore
    const targetMint = await getMintInfo(
      this.provider,
      tokenBondingAcct.targetMint
    );

    const baseMint = await getMintInfo(
      this.provider,
      tokenBondingAcct.baseMint
    );

    const baseStorage = await getTokenAccount(
      this.provider,
      tokenBondingAcct.baseStorage
    );

    const curve = await this.getPricingCurve(
      tokenBondingAcct.curve,
      amountAsNum(
        tokenBondingAcct.ignoreExternalReserveChanges
          ? tokenBondingAcct.reserveBalanceFromBonding
          : baseStorage.amount,
        baseMint
      ),
      amountAsNum(
        tokenBondingAcct.ignoreExternalSupplyChanges
          ? tokenBondingAcct.supplyFromBonding
          : targetMint.supply,
        targetMint
      ),
      tokenBondingAcct.goLiveUnixTime.toNumber()
    );

    const instructions: TransactionInstruction[] = [];
    // let req = ComputeBudgetProgram.setComputeUnitLimit({units: 400000});
    // instructions.push(req);

    if (!destination) {
      destination = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenBondingAcct.targetMint,
        sourceAuthority,
        true
      );

      if (!(await this.accountExists(destination))) {
        console.log("Creating target account");
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            tokenBondingAcct.targetMint,
            destination,
            sourceAuthority,
            payer
          )
        );
      }
    }

    let buyTargetAmount: any = null;
    let buyWithBase: any = null;
    let maxPrice: number = 0;

    const unixTime = await this.getUnixTime();

    if (desiredTargetAmount) {
      const desiredTargetAmountNum = toNumber(desiredTargetAmount, targetMint);

      const neededAmount =
        desiredTargetAmountNum *
        (1 / (1 - asDecimal(tokenBondingAcct.buyTargetRoyaltyPercentage)));

      const min = expectedBaseAmount
        ? toNumber(expectedBaseAmount, targetMint)
        : curve.buyTargetAmount(
            desiredTargetAmountNum,
            tokenBondingAcct.buyBaseRoyaltyPercentage,
            tokenBondingAcct.buyTargetRoyaltyPercentage,
            unixTime
          );

      maxPrice = min * (1 + slippage);

      buyTargetAmount = {
        targetAmount: new BN(
          Math.floor(neededAmount * Math.pow(10, targetMint.decimals))
        ),
        maximumPrice: toBN(maxPrice, baseMint),
      };
    }

    if (baseAmount) {
      const baseAmountNum = toNumber(baseAmount, baseMint);
      maxPrice = baseAmountNum;

      const min = expectedOutputAmount
        ? toNumber(expectedOutputAmount, targetMint)
        : curve.buyWithBaseAmount(
            baseAmountNum,
            tokenBondingAcct.buyBaseRoyaltyPercentage,
            tokenBondingAcct.buyTargetRoyaltyPercentage,
            unixTime
          );

      buyWithBase = {
        baseAmount: toBN(baseAmount, baseMint),
        minimumTargetAmount: new BN(
          Math.ceil(min * (1 - slippage) * Math.pow(10, targetMint.decimals))
        ),
      };
    }

    if (!source) {
      if (isNative) {
        source = sourceAuthority;
      } else {
        source = await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenBondingAcct.baseMint,
          sourceAuthority,
          true
        );

        if (!(await this.accountExists(source))) {
          console.warn(
            "Source account for bonding buy does not exist, if it is not created in an earlier instruction this can cause an error"
          );
        }
      }
    }

    const args: IdlTypes<SplTokenBondingIDL>["BuyV0Args"] = {
      // @ts-ignore
      buyTargetAmount,
      // @ts-ignore
      buyWithBase,
    };

    const common = {
      tokenBonding,
      // @ts-ignore
      curve: tokenBondingAcct.curve,
      baseMint: tokenBondingAcct.baseMint,
      targetMint: tokenBondingAcct.targetMint,
      baseStorage: tokenBondingAcct.baseStorage,
      buyBaseRoyalties: tokenBondingAcct.buyBaseRoyalties,
      buyTargetRoyalties: tokenBondingAcct.buyTargetRoyalties,
      tokenProgram: TOKEN_PROGRAM_ID,
      clock: SYSVAR_CLOCK_PUBKEY,
      destination,
    };

    if (isNative) {
      instructions.push(
        await this.instruction.buyNativeV0(args, {
          accounts: {
            common,
            state: state.publicKey,
            wrappedSolMint: state.wrappedSolMint,
            mintAuthority: (
              await SplTokenBonding.wrappedSolMintAuthorityKey(this.programId)
            )[0],
            solStorage: state.solStorage,
            systemProgram: SystemProgram.programId,
            source,
          },
        })
      );
    } else {
      instructions.push(
        await this.instruction.buyV1(args, {
          accounts: {
            common,
            state: state.publicKey,
            source,
            sourceAuthority,
          },
        })
      );
    }

    return {
      output: null,
      signers: [],
      instructions,
    };
  }

  /**
   * Runs {@link buy}
   * @param args
   */
  async buy(
    args: IBuyArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(this.buyInstructions(args), args.payer, commitment);
  }

  async getTokenAccountBalance(
    account: PublicKey,
    commitment: Commitment = "confirmed"
  ): Promise<BN> {
    const acct = await this.provider.connection.getAccountInfo(
      account,
      commitment
    );
    if (acct) {
      return u64.fromBuffer(AccountLayout.decode(acct.data).amount);
    }

    return new BN(0);
  }

  /**
   * Swap from any base mint to any target mint that are both on a shared link of bonding curves.
   * Intelligently traverses using either buy or sell, executing multiple txns to either sell baseAmount
   * or buy with baseAmount
   *
   * @param param0
   */
  async swap({
    payer = this.wallet.publicKey,
    sourceAuthority = this.wallet.publicKey,
    baseMint,
    targetMint,
    baseAmount,
    expectedBaseAmount,
    desiredTargetAmount,
    expectedOutputAmount,
    slippage,
    balanceCheckTries = 5,
    extraInstructions = () =>
      Promise.resolve({
        instructions: [],
        signers: [],
        output: null,
      }),
    preInstructions = async () => {
      return {
        instructions: [],
        signers: [],
        output: null,
      };
    },
    postInstructions = () =>
      Promise.resolve({
        instructions: [],
        signers: [],
        output: null,
      }),
    entangled = null,
  }: ISwapArgs): Promise<{ targetAmount: number }> {
    const hierarchyFromTarget = await this.getBondingHierarchy(
      (
        await SplTokenBonding.tokenBondingKey(targetMint)
      )[0],
      baseMint
    );

    const hierarchyFromBase = await this.getBondingHierarchy(
      (
        await SplTokenBonding.tokenBondingKey(baseMint)
      )[0],
      targetMint
    );

    const hierarchy = [hierarchyFromTarget, hierarchyFromBase].find(
      (hierarchy) => hierarchy?.contains(baseMint, targetMint)
    );

    if (!hierarchy) {
      throw new Error(
        `No bonding curve hierarchies found for base or target that contain both ${baseMint.toBase58()} and ${targetMint.toBase58()}`
      );
    }

    const isBuy = hierarchy.tokenBonding.targetMint.equals(targetMint);
    const arrHierarchy = hierarchy?.toArray() || [];
    const baseMintInfo = await getMintInfo(this.provider, baseMint);
    let currAmount = baseAmount ? toBN(baseAmount, baseMintInfo) : undefined;

    const hierarchyToTraverse = isBuy ? arrHierarchy.reverse() : arrHierarchy;
    const processedMints: any[] = [];
    for (const [index, subHierarchy] of hierarchyToTraverse.entries()) {
      const isLastHop = index === arrHierarchy.length - 1;
      const tokenBonding = subHierarchy.tokenBonding;
      const baseIsSol = tokenBonding.baseMint.equals(
        (await this.getState())?.wrappedSolMint!
      );

      const ataMint =
        entangled && isBuy
          ? entangled
          : isBuy
          ? tokenBonding.targetMint
          : tokenBonding.baseMint;
      const ata = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        ataMint,
        sourceAuthority,
        true
      );

      const getBalance = async (): Promise<BN> => {
        if (!isBuy && baseIsSol) {
          const amount =
            (
              await this.provider.connection.getAccountInfo(
                sourceAuthority,
                "single"
              )
            )?.lamports || 0;
          return new BN(amount);
        } else {
          return this.getTokenAccountBalance(ata, "single");
        }
      };

      const preBalance = await getBalance();
      let instructions: TransactionInstruction[];
      let signers: Signer[];

      let currMint;
      if (isBuy) {
        console.log(
          `Actually doing ${tokenBonding.baseMint.toBase58()} to ${tokenBonding.targetMint.toBase58()}`
        );
        ({ instructions, signers } = await this.buyInstructions({
          payer,
          sourceAuthority,
          baseAmount: currAmount,
          tokenBonding: tokenBonding.publicKey,
          expectedOutputAmount:
            isLastHop && !desiredTargetAmount
              ? expectedOutputAmount
              : undefined,
          desiredTargetAmount:
            isLastHop && desiredTargetAmount ? desiredTargetAmount : undefined,
          expectedBaseAmount:
            isLastHop && desiredTargetAmount ? expectedBaseAmount : undefined,
          slippage,
        }));
        currMint = tokenBonding.targetMint;
      } else {
        console.log(
          `SELL doing ${tokenBonding.baseMint.toBase58()} to ${tokenBonding.targetMint.toBase58()}`
        );
        ({ instructions, signers } = await this.sellInstructions({
          payer,
          sourceAuthority,
          targetAmount: currAmount!,
          tokenBonding: tokenBonding.publicKey,
          expectedOutputAmount: isLastHop ? expectedOutputAmount : undefined,
          slippage,
        }));
        currMint = tokenBonding.baseMint;
      }

      const { instructions: extraInstrs, signers: extraSigners } =
        await extraInstructions({
          tokenBonding,
          amount: currAmount,
          isBuy,
        });

      const { instructions: preInstrs, signers: preSigners } =
        await preInstructions({
          tokenBonding,
          amount: currAmount,
          desiredTargetAmount,
          isBuy,
          isFirst: index == 0,
        });

      const { instructions: postInstrs, signers: postSigners } =
        await postInstructions({
          isLast: isLastHop,
          amount: expectedOutputAmount,
          isBuy,
        });

      try {
        await this.sendInstructions(
          [...extraInstrs, ...preInstrs, ...instructions, ...postInstrs],
          [...extraSigners, ...preSigners, ...signers, ...postSigners],
          payer
        );
      } catch (e: any) {
        // Throw a nice error if the swap partially succeeded.
        if (processedMints.length > 0) {
          const splTokenMetadata = await SplTokenMetadata.init(this.provider);
          const lastMint = processedMints[processedMints.length - 1];
          const metadataKey = await Metadata.getPDA(lastMint);
          const metadata = await splTokenMetadata.getMetadata(metadataKey);
          const name = metadata?.data.symbol || lastMint.toBase58();

          const err = new Error(
            `Swap partially failed, check your wallet for ${name} tokens. Error: ${e.toString()}`
          );
          err.stack = e.stack;

          throw err;
        }

        throw e;
      }

      processedMints.push(currMint);

      async function newBalance(tries: number = 0): Promise<BN> {
        if (tries > balanceCheckTries) {
          return new BN(0);
        }
        let postBalance = await getBalance();
        // Sometimes it can take a bit for Solana to catch up
        // Wait and see if the balance truly hasn't changed.
        if (postBalance.eq(preBalance)) {
          console.log(
            "No balance change detected while swapping, trying again",
            tries
          );
          await sleep(5000);
          return newBalance(tries + 1);
        }

        return postBalance;
      }

      const postBalance = await newBalance();

      currAmount = postBalance!.sub(preBalance || new BN(0));
      // Fees, or something else caused the balance to be negative. Just report the change
      // and quit
      if (currAmount.eq(new BN(0))) {
        const targetMintInfo = await getMintInfo(
          this.provider,
          isBuy ? tokenBonding.targetMint : tokenBonding.baseMint
        );
        return {
          targetAmount:
            toNumber(postBalance!, targetMintInfo) -
            toNumber(preBalance, targetMintInfo),
        };
      }
    }

    const targetMintInfo = await getMintInfo(this.provider, targetMint);
    return {
      targetAmount: toNumber(currAmount!, targetMintInfo),
    };
  }

  async getState(): Promise<(IProgramState & { publicKey: PublicKey }) | null> {
    if (this.state) {
      return this.state;
    }

    const stateAddress = (
      await PublicKey.findProgramAddress(
        [Buffer.from("state", "utf-8")],
        this.programId
      )
    )[0];

    const stateRaw = await this.account.programStateV0.fetchNullable(
      stateAddress
    );
    const state: IProgramState | null = stateRaw
      ? {
          ...stateRaw,
          publicKey: stateAddress,
        }
      : null;
    if (state) {
      this.state = state;
    }

    return state;
  }

  /**
   * Instructions to burn `targetMint` tokens in exchange for `baseMint` tokens
   *
   * @param param0
   * @returns
   */
  async sellInstructions({
    tokenBonding,
    source,
    sourceAuthority = this.wallet.publicKey,
    destination,
    targetAmount,
    expectedOutputAmount,
    slippage,
    payer = this.wallet.publicKey,
  }: ISellArgs): Promise<InstructionResult<null>> {
    const state = (await this.getState())!;
    const tokenBondingAcct = (await this.getTokenBonding(tokenBonding))!;
    if (tokenBondingAcct.sellFrozen) {
      throw new Error("Sell is frozen on this bonding curve");
    }

    const isNative =
      tokenBondingAcct.baseMint.equals(NATIVE_MINT) ||
      tokenBondingAcct.baseMint.equals(state.wrappedSolMint);

    // @ts-ignore
    const targetMint = await getMintInfo(
      this.provider,
      tokenBondingAcct.targetMint
    );
    const baseMint = await getMintInfo(
      this.provider,
      tokenBondingAcct.baseMint
    );
    const baseStorage = await getTokenAccount(
      this.provider,
      tokenBondingAcct.baseStorage
    );
    // @ts-ignore
    const curve = await this.getPricingCurve(
      tokenBondingAcct.curve,
      amountAsNum(
        tokenBondingAcct.ignoreExternalReserveChanges
          ? tokenBondingAcct.reserveBalanceFromBonding
          : baseStorage.amount,
        baseMint
      ),
      amountAsNum(
        tokenBondingAcct.ignoreExternalSupplyChanges
          ? tokenBondingAcct.supplyFromBonding
          : targetMint.supply,
        targetMint
      ),
      tokenBondingAcct.goLiveUnixTime.toNumber()
    );

    const instructions: TransactionInstruction[] = [];
    // let req = ComputeBudgetProgram.setComputeUnitLimit({units: 350000});
    // instructions.push(req);
    if (!source) {
      source = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenBondingAcct.targetMint,
        sourceAuthority,
        true
      );

      if (!(await this.accountExists(source))) {
        console.warn(
          "Source account for bonding buy does not exist, if it is not created in an earlier instruction this can cause an error"
        );
      }
    }

    if (!destination) {
      if (isNative) {
        destination = sourceAuthority;
      } else {
        destination = await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenBondingAcct.baseMint,
          sourceAuthority,
          true
        );

        if (!(await this.accountExists(destination))) {
          console.log("Creating base account");
          instructions.push(
            Token.createAssociatedTokenAccountInstruction(
              ASSOCIATED_TOKEN_PROGRAM_ID,
              TOKEN_PROGRAM_ID,
              tokenBondingAcct.baseMint,
              destination,
              sourceAuthority,
              payer
            )
          );
        }
      }
    }

    const unixTime = await this.getUnixTime();
    const targetAmountNum = toNumber(targetAmount, targetMint);

    const min = expectedOutputAmount
      ? toNumber(expectedOutputAmount, baseMint)
      : curve.sellTargetAmount(
          targetAmountNum,
          tokenBondingAcct.sellBaseRoyaltyPercentage,
          tokenBondingAcct.sellTargetRoyaltyPercentage,
          unixTime
        );

    const args: IdlTypes<SplTokenBondingIDL>["SellV0Args"] = {
      targetAmount: toBN(targetAmount, targetMint),
      minimumPrice: new BN(
        Math.ceil(min * (1 - slippage) * Math.pow(10, baseMint.decimals))
      ),
    };

    const common = {
      tokenBonding,
      // @ts-ignore
      curve: tokenBondingAcct.curve,
      baseMint: tokenBondingAcct.baseMint,
      targetMint: tokenBondingAcct.targetMint,
      baseStorage: tokenBondingAcct.baseStorage,
      sellBaseRoyalties: tokenBondingAcct.sellBaseRoyalties,
      sellTargetRoyalties: tokenBondingAcct.sellTargetRoyalties,
      source,
      sourceAuthority,
      tokenProgram: TOKEN_PROGRAM_ID,
      clock: SYSVAR_CLOCK_PUBKEY,
    };
    if (isNative) {
      instructions.push(
        await this.instruction.sellNativeV0(args, {
          accounts: {
            common,
            destination,
            state: state.publicKey,
            wrappedSolMint: state.wrappedSolMint,
            mintAuthority: (
              await SplTokenBonding.wrappedSolMintAuthorityKey(this.programId)
            )[0],
            solStorage: state.solStorage,
            systemProgram: SystemProgram.programId,
          },
        })
      );
    } else {
      instructions.push(
        await this.instruction.sellV1(args, {
          accounts: {
            common,
            state: state.publicKey,
            destination,
          },
        })
      );
    }

    return {
      output: null,
      signers: [],
      instructions,
    };
  }

  /**
   * Runs {@link sell}
   * @param args
   */
  async sell(
    args: ISellArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(this.sellInstructions(args), args.payer, commitment);
  }

  /**
   * Instructions to close the bonding curve
   *
   * @param param0
   * @returns
   */
  async closeInstructions({
    tokenBonding,
    generalAuthority,
    refund = this.wallet.publicKey,
  }: ICloseArgs): Promise<InstructionResult<null>> {
    const tokenBondingAcct = (await this.getTokenBonding(tokenBonding))!;

    if (!tokenBondingAcct.generalAuthority) {
      throw new Error(
        "Cannot close a bonding account with no general authority"
      );
    }

    return {
      output: null,
      signers: [],
      instructions: [
        await this.instruction.closeTokenBondingV0({
          accounts: {
            refund,
            tokenBonding,
            generalAuthority:
              generalAuthority ||
              (tokenBondingAcct.generalAuthority! as PublicKey),
            targetMint: tokenBondingAcct.targetMint,
            baseStorage: tokenBondingAcct.baseStorage,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        }),
      ],
    };
  }

  /**
   * Runs {@link closeInstructions}
   * @param args
   */
  async close(
    args: ICloseArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(this.closeInstructions(args), args.payer, commitment);
  }

  /**
   * Instructions to transfer the reserves of the bonding curve
   *
   * @param param0
   * @returns
   */
  async transferReservesInstructions({
    tokenBonding,
    destination,
    amount,
    reserveAuthority,
    destinationWallet = this.wallet.publicKey,
    payer = this.wallet.publicKey,
  }: ITransferReservesArgs): Promise<InstructionResult<null>> {
    const tokenBondingAcct = (await this.getTokenBonding(tokenBonding))!;
    const state = (await this.getState())!;
    const isNative =
      tokenBondingAcct.baseMint.equals(NATIVE_MINT) ||
      tokenBondingAcct.baseMint.equals(state.wrappedSolMint);
    const baseMint = await getMintInfo(
      this.provider,
      tokenBondingAcct.baseMint
    );
    const instructions: TransactionInstruction[] = [];

    if (!tokenBondingAcct.reserveAuthority) {
      throw new Error(
        "Cannot transfer reserves on a bonding account with no reserve authority"
      );
    }

    if (!destination && isNative) {
      destination = destinationWallet;
    }

    const destAcct =
      destination &&
      (await this.provider.connection.getAccountInfo(destination));

    // Destination is a wallet, need to get the ATA
    if (
      !isNative &&
      (!destAcct || destAcct.owner.equals(SystemProgram.programId))
    ) {
      const ataDestination = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenBondingAcct.baseMint,
        destinationWallet,
        false // Explicitly don't allow owner off curve. You need to pass destination as an already created thing to do this
      );
      if (!(await this.accountExists(ataDestination))) {
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            tokenBondingAcct.baseMint,
            ataDestination,
            destinationWallet,
            payer
          )
        );
      }

      destination = ataDestination;
    }

    const common = {
      tokenBonding,
      reserveAuthority:
        reserveAuthority || (tokenBondingAcct.reserveAuthority! as PublicKey),
      baseMint: tokenBondingAcct.baseMint,
      baseStorage: tokenBondingAcct.baseStorage,
      tokenProgram: TOKEN_PROGRAM_ID,
    };
    const args = {
      amount: toBN(amount, baseMint),
    };
    if (isNative) {
      instructions.push(
        await this.instruction.transferReservesNativeV0(args, {
          accounts: {
            common,
            destination: destination!,
            state: state.publicKey,
            wrappedSolMint: state.wrappedSolMint,
            mintAuthority: (
              await SplTokenBonding.wrappedSolMintAuthorityKey(this.programId)
            )[0],
            solStorage: state.solStorage,
            systemProgram: SystemProgram.programId,
          },
        })
      );
    } else {
      instructions.push(
        await this.instruction.transferReservesV0(args, {
          accounts: {
            common,
            destination: destination!,
          },
        })
      );
    }
    return {
      output: null,
      signers: [],
      instructions,
    };
  }

  /**
   * Runs {@link closeInstructions}
   * @param args
   */
  async transferReserves(
    args: ITransferReservesArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(
      this.transferReservesInstructions(args),
      args.payer,
      commitment
    );
  }

  /**
   * Get a class capable of displaying pricing information or this token bonding at its current reserve and supply
   *
   * @param tokenBonding
   * @returns
   */
  async getBondingPricingCurve(
    tokenBonding: PublicKey
  ): Promise<IPricingCurve> {
    const tokenBondingAcct = (await this.getTokenBonding(tokenBonding))!;
    const targetMint = await getMintInfo(
      this.provider,
      tokenBondingAcct.targetMint
    );
    const baseMint = await getMintInfo(
      this.provider,
      tokenBondingAcct.baseMint
    );
    const baseStorage = await getTokenAccount(
      this.provider,
      tokenBondingAcct.baseStorage
    );

    return await this.getPricingCurve(
      tokenBondingAcct.curve,
      amountAsNum(
        tokenBondingAcct.ignoreExternalReserveChanges
          ? tokenBondingAcct.reserveBalanceFromBonding
          : baseStorage.amount,
        baseMint
      ),
      amountAsNum(
        tokenBondingAcct.ignoreExternalSupplyChanges
          ? tokenBondingAcct.supplyFromBonding
          : targetMint.supply,
        targetMint
      ),
      tokenBondingAcct.goLiveUnixTime.toNumber()
    );
  }

  /**
   * Given some reserves and supply, get a pricing model for a curve at `key`.
   *
   * @param key
   * @param baseAmount
   * @param targetSupply
   * @param goLiveUnixTime
   * @returns
   */
  async getPricingCurve(
    key: PublicKey,
    baseAmount: number,
    targetSupply: number,
    goLiveUnixTime: number
  ): Promise<IPricingCurve> {
    const curve = await this.getCurve(key);
    return fromCurve(curve, baseAmount, targetSupply, goLiveUnixTime);
  }

  async getPricing(
    tokenBondingKey: PublicKey | undefined
  ): Promise<BondingPricing | undefined> {
    const hierarchy = await this.getBondingHierarchy(tokenBondingKey);
    if (hierarchy) {
      return new BondingPricing({
        hierarchy: hierarchy,
      });
    }
  }

  /**
   * Fetch the token bonding curve and all of its direct ancestors
   *
   * @param tokenBondingKey
   * @returns
   */
  async getBondingHierarchy(
    tokenBondingKey: PublicKey | undefined,
    stopAtMint?: PublicKey | undefined
  ): Promise<BondingHierarchy | undefined> {
    if (!tokenBondingKey) {
      return;
    }

    const [wrappedSolMint, tokenBonding] = await Promise.all([
      this.getState().then((s) => s?.wrappedSolMint!),
      this.getTokenBonding(tokenBondingKey),
    ]);

    if (stopAtMint?.equals(NATIVE_MINT)) {
      stopAtMint = wrappedSolMint;
    }

    if (!tokenBonding) {
      return;
    }

    const pricingCurve = await this.getBondingPricingCurve(tokenBondingKey);

    const parentKey = (
      await SplTokenBonding.tokenBondingKey(tokenBonding.baseMint)
    )[0];
    const ret = new BondingHierarchy({
      parent: stopAtMint?.equals(tokenBonding.baseMint)
        ? undefined
        : await this.getBondingHierarchy(parentKey, stopAtMint),
      tokenBonding,
      pricingCurve,
      wrappedSolMint,
    });
    (ret.parent || ({} as any)).child = ret;
    return ret;
  }
}
