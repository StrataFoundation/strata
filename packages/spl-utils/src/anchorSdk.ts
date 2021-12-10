import { AccountNamespace, Idl, InstructionNamespace, Program, Provider, RpcNamespace } from "@project-serum/anchor";
import { AllInstructions } from "@project-serum/anchor/dist/cjs/program/namespace/types";
import { Wallet } from "@project-serum/common";
import { PublicKey, Signer, TransactionInstruction } from "@solana/web3.js";
import { TypedAccountParser } from ".";
import { BigInstructionResult, InstructionResult, sendInstructions, sendMultipleInstructions } from "./transaction";

export abstract class AnchorSdk<IDL extends Idl> {
  program: Program<IDL>;
  provider: Provider;
  programId: PublicKey;
  rpc: RpcNamespace<IDL, AllInstructions<IDL>>;
  instruction: InstructionNamespace<IDL, IDL["instructions"][number]>;
  wallet: Wallet;
  account: AccountNamespace<IDL>;
  errors: Map<number, string> | undefined;

  static ID: PublicKey;

  constructor(args: { provider: Provider; program: Program<IDL> }) {
    this.program = args.program;
    this.provider = args.provider;
    this.programId = args.program.programId;
    this.rpc = args.program.rpc;
    this.instruction = args.program.instruction;
    this.wallet = args.provider.wallet;
    this.account = args.program.account;
    this.errors = args.program.idl.errors?.reduce((acc, err) => {
      acc.set(err.code, `${err.name}: ${err.msg}`);
      return acc;
    }, new Map<number, string>());
  }

  protected async getAccount<T>(key: PublicKey, decoder: TypedAccountParser<T>): Promise<T | null> {
    const account = await this.provider.connection.getAccountInfo(key);

    if (account) {
      return decoder(key, account);
    }
    
    return null;
  }

  async sendInstructions(
    instructions: TransactionInstruction[],
    signers: Signer[],
    payer?: PublicKey
  ): Promise<string> {
    try {
      return await sendInstructions(
        this.errors || new Map(),
        this.provider,
        instructions,
        signers,
        payer
      );
    } catch (e: any) {
      // If all compute was consumed, this can often mean that the bonding price moved too much, causing
      // our root estimates to be off.
      if (e.logs && e.logs.some((l: string) => l == "Program TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN consumed 200000 of 200000 compute units")) {
        throw new Error("The price has moved too much, please try again.")
      }
      throw e;
    }
  }

  async execute<Output>(command: Promise<InstructionResult<Output>>, payer: PublicKey = this.wallet.publicKey): Promise<Output> {
    const { instructions, signers, output } = await command;
    if (instructions.length > 0) {
      await this.sendInstructions(instructions, signers, payer);
    }
    return output;
  }

  async executeBig<Output>(command: Promise<BigInstructionResult<Output>>, payer: PublicKey = this.wallet.publicKey): Promise<Output> {
    const { instructions, signers, output } = await command;
    if (instructions.length > 0) {
      await sendMultipleInstructions(
        this.errors || new Map(),
        this.provider,
        instructions,
        signers,
        payer
      );
    }
    return output;
  }
}
