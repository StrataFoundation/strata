import { BorshAccountsCoder, Provider } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import {
  Commitment,
  Finality,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
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

type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T; // from lodash

const truthy = <T>(value: T): value is Truthy<T> => !!value;

interface ICreateFungibleEntanglerArgs {
  /** The payer to create this fungible entangler, defaults to provider.wallet */
  payer?: PublicKey;
}

interface ICreateFungibleChildEntanglerArgs {
  /** The payer to create this fungible child entangler, defaults to provider.wallet */
  payer?: PublicKey;
}

interface ISwapArgs {
  /** The payer to run this transaction, defaults to provider.wallet */
  payer?: PublicKey;
}

export class FungibleEntanglerSdk {
  static async init(provider: Provider): Promise<FungibleEntanglerSdk> {
    return new this(provider);
  }

  constructor(readonly provider: Provider) {}

  async createFungibleEntanglerInstructions({}: ICreateFungibleEntanglerArgs): Promise<
    InstructionResult<{}>
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
