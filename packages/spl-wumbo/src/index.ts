import * as anchor from "@wum.bo/anchor";
import { Program, BN } from "@wum.bo/anchor";
import { createMetadata } from "@wum.bo/metaplex-oyster-common";
import { createMintInstructions } from "@project-serum/common";
import { NATIVE_MINT, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
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
import { percent } from "@wum.bo/spl-utils";

export * from "./generated/spl-wumbo";

interface CreateWumboArgs {
  payer?: PublicKey;
  authority?: PublicKey;
}

interface CreateSocialTokenArgs {
  payer?: PublicKey;
  authority?: PublicKey;
  wumbo: PublicKey;
  socialHandle: string;
}

interface InstructionResult<A> {
  instructions: TransactionInstruction[];
  signers: Signer[];
  output: A;
}

export class SplWumbo {
  program: Program<SplWumboIDL>;
  splTokenBondingProgram: SplTokenBonding;
  splTokenStakingProgram: SplTokenStaking;
  splNameServiceNameClass: PublicKey;
  splNameServiceNameParent: PublicKey;

  constructor(opts: {
    program: Program<SplWumboIDL>;
    splTokenBondingProgram: SplTokenBonding;
    splTokenStakingProgram: SplTokenStaking;
    splNameServiceNameClass: PublicKey;
    splNameServiceNameParent: PublicKey;
  }) {
    this.program = opts.program;
    this.splTokenBondingProgram = opts.splTokenBondingProgram;
    this.splTokenStakingProgram = opts.splTokenStakingProgram;
    this.splNameServiceNameClass = opts.splNameServiceNameClass;
    this.splNameServiceNameParent = opts.splNameServiceNameParent;
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
        baseRoyaltyPercentage: percent(0),
        targetRoyaltyPercentage: percent(20),
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
          tokenMetadataDefaults: {
            symbol: "UN",
            name: "UNCLAIMED",
            arweaveUri: "testtest", // TODO: get proper arweaveUri
            sellerFeeBasisPoints: 0,
            creators: null,
          },
          tokenBondingDefaults: {
            curve,
            ...this.splTokenBondingProgram.defaults,
          },
          tokenStakingDefaults: this.splTokenStakingProgram.defaults,
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
    authority = this.wallet.publicKey, // TODO: Set proper authority
    wumbo,
    socialHandle,
  }: CreateSocialTokenArgs): Promise<
    InstructionResult<{
      tokenRef: PublicKey;
      reverseTokenRefBonding: PublicKey;
      reverseTokenRefStaking: PublicKey;
    }>
  > {
    const programId = this.programId;
    const provider = this.provider;
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];
    const hashedSocialHandle = await getHashedName(socialHandle);
    let nameOwner, nameExists: boolean, tokenRefSeed;

    // fetch name entry and check owner
    // if owner of name entry === pubKey
    // claimed or unclaimed;
    const nameKey = await getNameAccountKey(
      hashedSocialHandle,
      this.splNameServiceNameClass,
      this.splNameServiceNameParent
    );

    // TODO: make this actually work
    tokenRefSeed = nameKey.toBuffer();

    /* try {
  *   const nameRegistryState = await NameRegistryState.retrieve(provider.connection, nameKey);

  *   if (nameRegistryState.owner.toBase58() !== payer.toBase58()) {
  *     throw new Error("Only the owner of this name can create a claimed coin");
  *   }

  *   nameOwner = nameRegistryState.owner;
  *   tokenRefSeed = nameRegistryState.owner.toBuffer();
  *   nameExists = true;
  * } catch (e) {
  *   console.log("Creating an unclaimed coin, could not find name registry state", e);
  *   tokenRefSeed = nameKey.toBuffer();
  *   nameExists = false;
  * } */

    const wumboAcct = await this.program.account.wumbo.fetch(wumbo);

    // create mint with me as auth
    console.log("Creating social token mint...");
    const targetMintKeypair = anchor.web3.Keypair.generate();
    signers.push(targetMintKeypair);
    const targetMint = targetMintKeypair.publicKey;

    instructions.push(...(await createMintInstructions(provider, authority, targetMint, 9)));

    // create metadata with me as auth
    console.log("Creating social token metadata...");
    const tokenMetadata = await createMetadata(
      {
        symbol: wumboAcct.tokenMetadataDefaults.symbol as string,
        name: wumboAcct.tokenMetadataDefaults.name as string,
        uri: wumboAcct.tokenMetadataDefaults.arweaveUri as string,
        sellerFeeBasisPoints: 0,
        creators: null,
      },
      authority.toString(),
      targetMint.toString(),
      authority.toString(),
      instructions,
      payer.toString()
    );

    console.log("Creating all authorities...");
    const [tokenMetadataUpdateAuthority, tokenMetadataUpdateAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("metadata-update", "utf-8"), wumbo.toBuffer()],
        programId
      );

    const [targetMintAuthority, _] = await PublicKey.findProgramAddress(
      [Buffer.from("target-authority", "utf-8"), wumbo.toBuffer()],
      this.splTokenBondingProgram.programId
    );

    const [tokenBondingAuthority, tokenBondingAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("token-bonding", "utf-8"), wumbo.toBuffer()],
        programId
      );

    const [tokenStakingAuthority, tokenStakingAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("token-staking", "utf-8"), wumbo.toBuffer()],
        programId
      );

    console.log("Swapping authority on target mint...");
    instructions.push(
      Token.createSetAuthorityInstruction(
        TOKEN_PROGRAM_ID,
        targetMint,
        targetMintAuthority,
        "AccountOwner",
        authority,
        []
      )
    );

    console.log("Swapping authority on token metadata...");
    instructions.push(
      Token.createSetAuthorityInstruction(
        TOKEN_PROGRAM_ID,
        new PublicKey(tokenMetadata),
        tokenMetadataUpdateAuthority,
        "AccountOwner",
        authority,
        []
      )
    );

    console.log("Creating social token bonding...");
    const {
      output: { tokenBonding, tokenBondingBumpSeed },
      instructions: tokenBondingInstructions,
      signers: tokenBondingSigners,
    } = await this.splTokenBondingProgram.createTokenBondingInstructions({
      curve: wumboAcct.tokenBondingDefaults.curve,
      authority: tokenBondingAuthority,
      baseMint: wumboAcct.mint,
      targetMint: targetMint,
      baseRoyaltyPercentage: wumboAcct.tokenBondingDefaults.baseRoyaltyPercentage,
      targetRoyaltyPercentage: wumboAcct.tokenBondingDefaults.targetRoyaltyPercentage,
      targetMintDecimals: wumboAcct.tokenBondingDefaults.targetMintDecimals,
      mintCap: undefined,
      buyFrozen: !!wumboAcct.tokenBondingDefaults.buyFrozen,
    });
    signers.push(...tokenBondingSigners);
    instructions.push(...tokenBondingInstructions);

    console.log("Creating social token staking...");
    const {
      output: { tokenStaking, tokenStakingBumpSeed },
      instructions: tokenStakingInstructions,
      signers: tokenStakingSigners,
    } = await this.splTokenStakingProgram.createTokenStakingInstructions({
      authority: tokenStakingAuthority,
      baseMint: targetMint,
      periodUnit: wumboAcct.tokenStakingDefaults.periodUnit,
      period: wumboAcct.tokenStakingDefaults.period,
      targetMintDecimals: wumboAcct.tokenStakingDefaults.targetMintDecimals,
      rewardPercentPerPeriodPerLockupPeriod:
        wumboAcct.tokenStakingDefaults.rewardPercentPerPeriodPerLockupPeriod,
    });
    signers.push(...tokenStakingSigners);
    instructions.push(...tokenStakingInstructions);

    console.log("Creating token ref PDAs...");
    const [tokenRef, tokenRefBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("token-ref", "utf-8"), wumbo.toBuffer(), nameKey.toBuffer()],
      programId
    );

    const [reverseTokenRefBonding, reverseTokenRefBondingBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("reverse-token-ref", "utf-8"), wumbo.toBuffer(), tokenBonding.toBuffer()],
        programId
      );

    const [reverseTokenRefStaking, reverseTokenRefStakingBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("reverse-token-ref", "utf-8"), wumbo.toBuffer(), tokenStaking.toBuffer()],
        programId
      );

    instructions.push(
      await this.instruction.initializeSocialTokenV0(
        {
          tokenRefSeed: nameKey,
          wumboBumpSeed: wumboAcct.bumpSeed,
          tokenBondingBumpSeed,
          tokenBondingAuthorityBumpSeed,
          tokenStakingBumpSeed,
          tokenStakingAuthorityBumpSeed,
          tokenRefBumpSeed,
          reverseTokenRefBondingBumpSeed,
          reverseTokenRefStakingBumpSeed,
          tokenMetadataUpdateAuthorityBumpSeed,
        },
        {
          accounts: {
            wumbo,
            tokenMetadata,
            tokenMetadataUpdateAuthority,
            tokenBonding,
            tokenBondingAuthority,
            tokenStaking,
            tokenStakingAuthority,
            tokenRef,
            reverseTokenRefBonding,
            reverseTokenRefStaking,
            name: nameKey,
            nameOwner: anchor.web3.PublicKey.default,
            payer,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    );

    return {
      output: { tokenRef, reverseTokenRefBonding, reverseTokenRefStaking },
      instructions,
      signers,
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
