import { Idl, Program, Provider } from "@project-serum/anchor";
import { PublicKey, Signer, TransactionInstruction } from "@solana/web3.js";
import { BigInstructionResult, InstructionResult } from ".";
import { sendInstructions, sendMultipleInstructions } from "./transaction";

export abstract class AnchorSdk<IDL extends Idl> {
  program: Program<IDL>;
  provider: Provider;

  static ID: PublicKey;

  constructor(args: { provider: Provider; program: Program<IDL> }) {
    this.program = args.program;
    this.provider = args.provider;
  }


  get programId() {
    return this.program.programId;
  }

  get rpc() {
    return this.program.rpc;
  }

  get instruction() {
    return this.program.instruction;
  }

  get wallet() {
    return this.provider.wallet;
  }

  get account() {
    return this.program.account;
  }

  get errors() {
    return this.program.idl.errors?.reduce((acc, err) => {
      acc.set(err.code, `${err.name}: ${err.msg}`);
      return acc;
    }, new Map<number, string>());
  }

  sendInstructions(
    instructions: TransactionInstruction[],
    signers: Signer[],
    payer?: PublicKey
  ): Promise<string> {
    return sendInstructions(
      this.errors || new Map(),
      this.provider,
      instructions,
      signers,
      payer
    );
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