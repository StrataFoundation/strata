import * as anchor from "@wum.bo/anchor";
import BN from "bn.js";
import {
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { NAME_PROGRAM_ID } from "@solana/spl-name-service";
import { Program } from "@wum.bo/anchor";
import { SplWumboIDL } from "./generated/spl-wumbo";

export * from "./generated/spl-wumbo";

const METADATA_UPDATE_PREFIX = "metadata-upate";
const WUMBO_PREFIX = "wumbo";
const UNCLAIMED_REF_PREFIX = "unclaimed-ref";
const CLAIMED_REF_PREFIX = "claimed-ref";
const BONDING_PREFIX = "bonding";
const FOUNDER_REWARDS_PREFIX = "founder-rewards";
const REVERSE_TOKEN_REF_PREFIX = "reverse-token-ref";

interface CreateWumboArgs {
  payer?: PublicKey;
  tokenMint: PublicKey;
  tokenCurve: PublicKey;
}

interface CreateSocialTokenArgs {
  payer?: PublicKey;
  wumbo: PublicKey;
  tokenBonding: PublicKey;
  tokenStaking: PublicKey;
  name: PublicKey;
  nameOwner?: PublicKey;
}

interface InstructionResult<A> {
  instructions: TransactionInstruction[];
  signers: Signer[];
  output: A;
}

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
    tokenMint,
    tokenCurve,
    payer = this.wallet.publicKey,
  }: CreateWumboArgs): Promise<InstructionResult<{ wumbo: PublicKey }>> {
    const programId = this.programId;
    const provider = this.provider;

    const [wumbo, bump] = await PublicKey.findProgramAddress(
      [Buffer.from(WUMBO_PREFIX, "utf-8"), tokenMint.toBuffer()],
      programId
    );

    return {
      output: { wumbo },
      instructions: [
        await this.instruction.initializeWumbo(
          { bump },
          {
            accounts: {
              wumbo,
              tokenMint,
              tokenCurve,
              nameServiceProgram: NAME_PROGRAM_ID,
              payer,
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

  async createSocialTokenInstructions({
    payer = this.wallet.publicKey,
    wumbo,
    tokenBonding,
    tokenStaking,
    name,
    nameOwner = anchor.web3.PublicKey.default,
  }: CreateSocialTokenArgs): Promise<
    InstructionResult<{
      tokenRef: PublicKey;
      reverseTokenRef: PublicKey;
      founderRewardsAccount: PublicKey;
    }>
  > {
    let tokenRefPrefix;
    let tokenRefSeed;

    if (nameOwner != this.wallet.publicKey) {
      tokenRefPrefix = CLAIMED_REF_PREFIX;
      tokenRefSeed = nameOwner.toBuffer();
    } else {
      tokenRefPrefix = UNCLAIMED_REF_PREFIX;
      tokenRefSeed = name.toBuffer();
    }

    const [tokenRef, tokenRefBump] = await PublicKey.findProgramAddress(
      [Buffer.from(tokenRefPrefix, "utf-8"), wumbo.toBuffer(), tokenRefSeed],
      this.programId
    );

    const [reverseTokenRef, reverseTokenRefBump] = await PublicKey.findProgramAddress(
      [Buffer.from(REVERSE_TOKEN_REF_PREFIX, "utf-8"), wumbo.toBuffer(), tokenBonding.toBuffer()],
      this.programId
    );

    const [founderRewardsAccount] = await PublicKey.findProgramAddress(
      [Buffer.from(FOUNDER_REWARDS_PREFIX, "utf-8"), tokenRef.toBuffer()],
      this.programId
    );

    return {
      output: {
        tokenRef,
        reverseTokenRef,
        founderRewardsAccount,
      },
      instructions: [
        this.instruction.initializeSocialTokenV0(
          {
            tokenRefPrefix,
            tokenRefSeed,
            tokenRefBump,
            reverseTokenRefBump,
          },
          {
            accounts: {
              wumbo,
              tokenRef,
              reverseTokenRef,
              tokenBonding,
              tokenStaking,
              founderRewardsAccount,
              name,
              nameOwner,
              payer,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
          }
        ),
      ],
      signers: [],
    };
  }

  async createSocialToken(args: CreateSocialTokenArgs): Promise<{
    tokenRef: PublicKey;
    reverseTokenRef: PublicKey;
    founderRewardsAccount: PublicKey;
  }> {
    const {
      output: { tokenRef, reverseTokenRef, founderRewardsAccount },
      instructions,
      signers,
    } = await this.createSocialTokenInstructions(args);
    await this.sendInstructions(instructions, signers);

    return { tokenRef, reverseTokenRef, founderRewardsAccount };
  }
}
