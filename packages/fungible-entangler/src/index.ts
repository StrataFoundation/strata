import * as anchor from "@project-serum/anchor";
import { IdlTypes, Program, Provider } from "@project-serum/anchor";
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

type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T; // from lodash

const truthy = <T>(value: T): value is Truthy<T> => !!value;

export interface ICreateFungibleEntanglerOutput {
  // entangler: PublicKey;
  // storage: PublicKey;
  // mint: PublicKey;
  // childEntangler: PublicKey;
  // childStorage: PublicKey;
  // childMint: PublicKey;
}

interface ICreateFungibleEntanglerArgs {
  /** The payer to create this fungible entangler, defaults to provider.wallet */
  payer?: PublicKey;
  /**  The mint we will be creating an entangler for */
  mint: PublicKey;
  /** The amount of that mint we will be entangling */
  amount: number;
  /**
   * General authority to change things like freeze swap.
   * **Default:** Wallet public key. Pass null to explicitly not set this authority.
   */
  authority?: PublicKey | null;
  /** The date this entangler will go live. Before this date, {@link FungibleEntangler.swap} is disabled. **Default:** 1 second ago */
  goLiveDate?: Date;
  /** The date this entangler will shut down. After this date, {@link FungibleEntangler.swap} is disabled. **Default:** null */
  freezeSwapDate?: Date;
}

interface ICreateFungibleChildEntanglerArgs {
  /** The payer to create this fungible child entangler, defaults to provider.wallet */
  payer?: PublicKey;
}

interface ISwapArgs {
  /** The payer to run this transaction, defaults to provider.wallet */
  payer?: PublicKey;
}

export class FungibleEntangler extends AnchorSdk<any> {
  static ID = new PublicKey("Ae6wbxtjpoKGCuSdHGQXRudmdpSfGpu6KHtjDcWEDjP8");

  // static async init(
  //   provider: Provider,
  //   fungibleEntanglerProgramId: PublicKey = FungibleEntangler.ID
  // ): Promise<FungibleEntangler> {
  //   const FungibleEntanglerIDLJson = await anchor.Program.fetchIdl(
  //     fungibleEntanglerProgramId,
  //     provider
  //   );

  //   const fungibleEntangler = new anchor.Program<FungibleEntanglerIDL>(
  //     FungibleEntanglerIDLJson as FungibleEntanglerIDL,
  //     provider
  //   ) as anchor.Program<FungibleEntanglerIDL>;

  //   return new this(provider, fungibleEntangler);
  // }

  constructor(provider: Provider, program: Program<any>) {
    super({ provider, program });
  }

  async createFungibleEntanglerInstructions({}: ICreateFungibleEntanglerArgs): Promise<
    InstructionResult<ICreateFungibleEntanglerOutput>
  > {
    const publicKey = this.provider.wallet.publicKey;
    const instructions: TransactionInstruction[] = [];

    // TODO: Implement
    return { instructions, signers: [], output: {} };
  }

  async createFungibleEntangler(
    args: ICreateFungibleEntanglerArgs,
    commitment: Commitment = "confirmed"
  ): Promise<{}> {
    // TODO: Implement;
    return Promise.resolve({});
    // return this.execute(
    //   this.createFungibleEntanglerInstructions(args),
    //   args.payer,
    //   commitment
    // );
  }

  async createFungibleChildEntanglerInstructions({}: ICreateFungibleChildEntanglerArgs): Promise<
    InstructionResult<{}>
  > {
    const publicKey = this.provider.wallet.publicKey;
    const instructions: TransactionInstruction[] = [];

    // TODO: implement

    return { instructions, signers: [], output: {} };
  }
}
