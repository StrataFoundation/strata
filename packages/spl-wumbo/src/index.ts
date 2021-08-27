import * as anchor from "@wum.bo/anchor";
import {
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { createMintInstructions } from "@project-serum/common";
import BN, { max } from "bn.js";
import { Program, IdlTypes } from "@wum.bo/anchor";
import { SplWumboIDL, SplWumboIDLJson, WumboV0 } from "./generated/spl-wumbo";

export * from "./generated/spl-wumbo";

interface CreateWumboArgs {
  payer?: PublicKey;
  wumboMint: PublicKey;
  baseCurve: PublicKey;
}

interface CreateSocialTokenV0Args {
  payer?: PublicKey;
  wumboInstance: PublicKey;
  tokenBonding: PublicKey;
}

interface InstructionResult<A> {
  instructions: TransactionInstruction[];
  signers: Signer[];
  output: A;
}

const NAME_PROGRAM_ID_STR = "namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX";
const TOKEN_METADATA_PROGRAM_ID_STR = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";

export class SplWumbo {
  program: Program<SplWumboIDL>;

  constructor(program: Program<SplWumboIDL>) {
    this.program = program;
  }

  get provider() {
    return this.program.provider;
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

  sendInstructions(instructions: TransactionInstruction[], signers: Signer[]): Promise<string> {
    const tx = new Transaction();
    tx.add(...instructions);
    return this.provider.send(tx, signers);
  }

  async createWumboInstructions({
    payer = this.wallet.publicKey,
    wumboMint,
    baseCurve,
  }: CreateWumboArgs): Promise<InstructionResult<{ wumbo: PublicKey }>> {
    const programId = this.programId;
    const provider = this.provider;

    const [wumbo, wumboBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("wumbo", "utf-8"), wumboMint.toBuffer()],
      programId
    );

    return {
      output: { wumbo },
      instructions: [
        await this.instruction.initializeWumboV0(
          { wumboBumpSeed },
          {
            accounts: {
              payer,
              wumboMint,
              baseCurve,
              nameProgramId: new PublicKey(NAME_PROGRAM_ID_STR),
              wumbo,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
          }
        ),
      ],
      signers: [],
    };
  }

  async createWumbo(args: CreateWumboArgs): Promise<PublicKey> {
    const {
      output: { wumbo },
      instructions,
      signers,
    } = await this.createWumboInstructions(args);
    await this.sendInstructions(instructions, signers);

    return wumbo;
  }
}
