import * as anchor from "@wum.bo/anchor";
import { Program, BN } from "@wum.bo/anchor";
import { createMintInstructions } from "@project-serum/common";
import { NATIVE_MINT } from "@solana/spl-token";
import {
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { SplWumboIDL } from "./generated/spl-wumbo";
import { SplTokenBonding } from "@wum.bo/spl-token-bonding";
import { SplTokenStaking } from "@wum.bo/spl-token-staking";
import { getHashedName, getNameAccountKey, NameRegistryState } from "@solana/spl-name-service";

export * from "./generated/spl-wumbo";

interface CreateWumboArgs {
  payer?: PublicKey;
  authority?: PublicKey;
}

interface CreateSocialTokenArgs {
  payer?: PublicKey;
  wumbo: PublicKey;
  tokenBonding: PublicKey;
  tokenStaking: PublicKey;
  name: string;
  nameOwner?: PublicKey;
}

interface InstructionResult<A> {
  instructions: TransactionInstruction[];
  signers: Signer[];
  output: A;
}

// TODO
// add nameParent
// add nameClass
export class SplWumbo {
  program: Program<SplWumboIDL>;
  splTokenBondingProgram: SplTokenBonding;
  splTokenStakingProgram: SplTokenStaking;

  constructor(
    program: Program<SplWumboIDL>,
    splTokenBondingProgram: SplTokenBonding,
    splTokenStakingProgram: SplTokenStaking
  ) {
    this.program = program;
    this.splTokenBondingProgram = splTokenBondingProgram;
    this.splTokenStakingProgram = splTokenStakingProgram;
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

  percent(percent: number): number {
    return Math.floor((percent / 100) * 4294967295); // unit32 max value
  }

  sendInstructions(instructions: TransactionInstruction[], signers: Signer[]): Promise<string> {
    const tx = new Transaction();
    tx.add(...instructions);
    return this.provider.send(tx, signers);
  }

  async createWumboInstructions({
    payer = this.wallet.publicKey,
    authority = this.wallet.publicKey, // TODO: Set proper authority
  }: CreateWumboArgs): Promise<InstructionResult<{ wumbo: PublicKey }>> {
    const programId = this.programId;
    const provider = this.provider;
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];

    console.log("Creating wumbo mint...");
    const wumboMintKeypair = anchor.web3.Keypair.generate();
    signers.push(wumboMintKeypair);
    const wumboMint = wumboMintKeypair.publicKey;

    const [targetMintAuthority, _] = await PublicKey.findProgramAddress(
      [Buffer.from("target-authority", "utf-8"), wumboMint.toBuffer()],
      this.splTokenBondingProgram.programId
    );

    instructions.push(
      ...(await createMintInstructions(provider, targetMintAuthority, wumboMint, 9))
    );

    console.log("Creating wumbo curve...");
    const {
      output: { curve },
      instructions: curveInstructions,
      signers: curveSigners,
    } = await this.splTokenBondingProgram.initializeLogCurveInstructions({
      c: new BN(1000000000000), // 1
      g: new BN(100000000000), // 0.1
      taylorIterations: 15,
    });
    signers.push(...curveSigners);
    instructions.push(...curveInstructions);

    console.log("Creating wumbo token bonding...");
    const { instructions: tokenBondingInstructions, signers: tokenBondingSigners } =
      await this.splTokenBondingProgram.createTokenBondingInstructions({
        curve,
        authority,
        baseMint: NATIVE_MINT,
        targetMint: wumboMint,
        baseRoyaltyPercentage: this.percent(0),
        targetRoyaltyPercentage: this.percent(20),
        mintCap: new BN(10), // TODO get proper mintcap
      });
    signers.push(...tokenBondingSigners);
    instructions.push(...tokenBondingInstructions);

    console.log("Creating wumbo...");
    const [wumbo, wumboBump] = await PublicKey.findProgramAddress(
      [Buffer.from("wumbo", "utf-8"), wumboMint.toBuffer()],
      programId
    );

    instructions.push(
      await this.instruction.initializeWumbo(
        {
          bump: wumboBump,
          metadataDefaults: {
            symbol: "UN",
            name: "UNCLAIMED",
            arweaveUri: "asdfasfasdfe", //TODO: get arweaveUri
          },
          tokenBondingDefaults: {
            curve,
            ...this.splTokenBondingProgram.defaults,
          },
          tokenStakingDefaults: {
            ...this.splTokenStakingProgram.defaults,
          },
        },
        {
          accounts: {
            wumbo,
            mint: wumboMint,
            curve,
            payer,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    );

    return {
      output: { wumbo },
      instructions,
      signers,
    };
  }

  async createWumbo(args: CreateWumboArgs = {}): Promise<PublicKey> {
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
  }: CreateSocialTokenArgs): Promise<
    InstructionResult<{
      tokenRef: PublicKey;
      reverseTokenRefBonding: PublicKey;
      reverseTokenRefStaking: PublicKey;
    }>
  > {
    const programId = this.programId;
    const provider = this.provider;
    const hashedName = await getHashedName(name);

    // create tokenBonding and tokenStaking with defaults

    const nameKey = await getNameAccountKey(hashedName); // TODO what is nameClass and nameParent here?
    // nameClass = verifier = wallet that is verifying
    // nameClass = gatekeeper BonfidaWallet
    // inDev = ourwallet
    // nameParent = Parent name requires verifying it
    // nameParent = tld "WumboTwitterTdl" dev "Twitter", prod;
    let nameOwner, nameExists: boolean, tokenRefPrefix: string, tokenRefSeed: Buffer;

    // fetch name entry and check owner
    // if owner of name entry === pubKey
    // claimed or unclaimed;
    try {
      const nameRegistryState = await NameRegistryState.retrieve(provider.connection, nameKey);

      if (nameRegistryState.owner.toBase58() !== payer.toBase58()) {
        throw new Error("Only the owner of this name can create a claimed coin");
      }

      nameOwner = nameRegistryState.owner;
      tokenRefPrefix = "claimed-ref";
      tokenRefSeed = nameRegistryState.owner.toBuffer();
      nameExists = true;
    } catch (e) {
      console.log("Creating an unclaimed coin, could not find name registry state", e);
      tokenRefPrefix = "unclaimed-ref";
      tokenRefSeed = nameKey.toBuffer();
      nameExists = false;
    }

    const [tokenRef, tokenRefBump] = await PublicKey.findProgramAddress(
      [Buffer.from(tokenRefPrefix, "utf-8"), wumbo.toBuffer(), tokenRefSeed],
      programId
    );

    const [reverseTokenRefBonding, reverseTokenRefBondingBump] = await PublicKey.findProgramAddress(
      [Buffer.from("reverse-token-ref", "utf-8"), wumbo.toBuffer(), tokenBonding.toBuffer()],
      programId
    );

    const [reverseTokenRefStaking, reverseTokenRefStakingBump] = await PublicKey.findProgramAddress(
      [Buffer.from("reverse-token-ref", "utf-8"), wumbo.toBuffer(), tokenStaking.toBuffer()],
      programId
    );

    // socialToken should be update authority on metadata
    return {
      output: {
        tokenRef,
        reverseTokenRefBonding,
        reverseTokenRefStaking,
      },
      instructions: [
        // targetMint
        // metadata
        // bonding
        // staking
        this.instruction.initializeSocialTokenV0(
          {
            tokenRefPrefix,
            tokenRefSeed,
            tokenRefBump,
            reverseTokenRefBondingBump,
            reverseTokenRefStakingBump,
          },
          {
            accounts: {
              wumbo,
              tokenBonding,
              tokenStaking,
              name: nameKey,
              nameOwner: nameExists ? (nameOwner as PublicKey) : anchor.web3.PublicKey.default,
              tokenRef,
              reverseTokenRefBonding,
              reverseTokenRefStaking,
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
    reverseTokenRefBonding: PublicKey;
    reverseTokenRefStaking: PublicKey;
  }> {
    const {
      output: { tokenRef, reverseTokenRefBonding, reverseTokenRefStaking },
      instructions,
      signers,
    } = await this.createSocialTokenInstructions(args);
    await this.sendInstructions(instructions, signers);

    return { tokenRef, reverseTokenRefBonding, reverseTokenRefStaking };
  }
}
