import * as anchor from "@wum.bo/anchor";
import { Program, BN } from "@wum.bo/anchor";
import { createMetadata } from "@wum.bo/metaplex-oyster-common/dist/lib/actions/metadata";
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
import { PeriodUnit, SplTokenStaking } from "@wum.bo/spl-token-staking";
import { SplTokenAccountSplit } from "@wum.bo/spl-token-account-split";
import { getHashedName, getNameAccountKey, NameRegistryState } from "@solana/spl-name-service";
import { percent } from "@wum.bo/spl-utils";

export * from "./generated/spl-wumbo";

interface CreateWumboArgs {
  payer?: PublicKey;
  curve?: PublicKey;
  wumMint?: PublicKey;
  baseMint?: PublicKey;// Automatically create bonding curve. Provide either this or wumMint
}

interface CreateSocialTokenArgs {
  payer?: PublicKey;
  wumbo: PublicKey;
  name?: PublicKey; // Either this or owner needs to be provided
  handle: string; // For the token metadata name
  owner?: PublicKey;
}

interface InstructionResult<A> {
  instructions: TransactionInstruction[];
  signers: Signer[];
  output: A;
}

export class SplWumbo {
  program: Program<SplWumboIDL>;
  splTokenBondingProgram: SplTokenBonding;
  splTokenAccountSplitProgram: SplTokenAccountSplit;
  splTokenStakingProgram: SplTokenStaking;
  splNameServiceNameClass: PublicKey;
  splNameServiceNameParent: PublicKey;

  constructor(opts: {
    program: Program<SplWumboIDL>;
    splTokenBondingProgram: SplTokenBonding;
    splTokenAccountSplitProgram: SplTokenAccountSplit;
    splTokenStakingProgram: SplTokenStaking;
    splNameServiceNameClass: PublicKey;
    splNameServiceNameParent: PublicKey;
  }) {
    this.program = opts.program;
    this.splTokenBondingProgram = opts.splTokenBondingProgram;
    this.splTokenAccountSplitProgram = opts.splTokenAccountSplitProgram;
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
    curve,
    wumMint,
    baseMint
  }: CreateWumboArgs): Promise<InstructionResult<{ wumbo: PublicKey }>> {
    const programId = this.programId;
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];

    // Create WUM Mint
    if (!wumMint) {
      const {
        output: { curve: wumCurve },
        instructions: curveInstructions,
        signers: curveSigners,
      } = await this.splTokenBondingProgram.initializeCurveInstructions({
        curve: {
          // @ts-ignore
          logCurveV0: {
            c: new BN(1000000000000), // 1
            g: new BN(100000000000), // 0.1
            taylorIterations: 15,
          },
        },
        taylorIterations: 15,
      });
      instructions.push(...curveInstructions);
      signers.push(...curveSigners);
      const { instructions: bondingInstructions, signers: bondingSigners, output: { targetMint } } = await this.splTokenBondingProgram.createTokenBondingInstructions({
        curve: wumCurve,
        baseMint: baseMint!,
        targetMintDecimals: 9,
        authority: this.wallet.publicKey,
        baseRoyaltyPercentage: percent(20),
        targetRoyaltyPercentage: percent(0),
        mintCap: new BN(1_000_000_000), // 1 billion
      });
      instructions.push(...bondingInstructions);
      signers.push(...bondingSigners);
      wumMint = targetMint;
    }

    // Create WUM base curve
    if (!curve) {
      const {
        output: { curve: curveOut },
        instructions: curveInstructions,
        signers: curveSigners,
      } = await this.splTokenBondingProgram.initializeCurveInstructions({
        curve: {
          // @ts-ignore
          logCurveV0: {
            c: new BN(1000000000000), // 1
            g: new BN(10000000000), // 0.01
            taylorIterations: 15,
          },
        },
        taylorIterations: 15,
      });
      signers.push(...curveSigners);
      instructions.push(...curveInstructions);
      curve = curveOut;
    }
  

    const [wumbo, wumboBump] = await PublicKey.findProgramAddress(
      [Buffer.from("wumbo", "utf-8"), wumMint!.toBuffer()],
      programId
    );
    
    instructions.push(
      await this.instruction.initializeWumbo(
        {
          bumpSeed: wumboBump,
          tokenMetadataDefaults: {
            symbol: "UNCL",
            arweaveUri: "testtest", // TODO: get proper arweaveUri
            sellerFeeBasisPoints: 0,
            creators: null,
          },
          tokenBondingDefaults: {
            curve,
            baseRoyaltyPercentage: percent(5),
            targetRoyaltyPercentage: percent(5),
            targetMintDecimals: 9,
            buyFrozen: false
          },
          tokenStakingDefaults: {
            periodUnit: PeriodUnit.DAY,
            period: 1,
            targetMintDecimals: 9,
            rewardPercentPerPeriodPerLockupPeriod: percent(1)
          },
        },
        {
          accounts: {
            wumbo,
            mint: wumMint!,
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
    name,
    owner,
    handle
  }: CreateSocialTokenArgs): Promise<
    InstructionResult<{
      tokenRef: PublicKey;
      reverseTokenRef: PublicKey;
    }>
  > {
    const programId = this.programId;
    const provider = this.provider;
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];

    const wumboAcct = await this.program.account.wumbo.fetch(wumbo);

    // Token refs
    const [tokenRef, tokenRefBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("token-ref", "utf-8"), wumbo.toBuffer(), (name || owner)!.toBuffer()],
      programId
    );

    // create mint with payer as auth
    console.log("Creating social token mint...");
    const targetMintKeypair = anchor.web3.Keypair.generate();
    signers.push(targetMintKeypair);
    const targetMint = targetMintKeypair.publicKey;

    instructions.push(...(await createMintInstructions(provider, payer, targetMint, 9)));

    // create metadata with payer as temporary authority
    console.log("Creating social token metadata...");
    const [tokenMetadataUpdateAuthority, tokenMetadataUpdateAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("token-metadata-authority", "utf-8"), tokenRef.toBuffer()],
        programId
      );
    const tokenMetadata = await createMetadata(
      {
        symbol: wumboAcct.tokenMetadataDefaults.symbol as string,
        name: handle,
        uri: wumboAcct.tokenMetadataDefaults.arweaveUri as string,
        sellerFeeBasisPoints: 0,
        creators: null,
      },
      tokenMetadataUpdateAuthority.toString(),
      targetMint.toString(),
      payer.toString(),
      instructions,
      payer.toString()
    );

    // Set mint authority to token bondings authority
    const [targetMintAuthority, targetMintAuthorityBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("target-authority", "utf-8"), targetMint.toBuffer()],
      programId
    );
    instructions.push(Token.createSetAuthorityInstruction(
      TOKEN_PROGRAM_ID,
      targetMint,
      targetMintAuthority,
      "MintTokens",
      payer,
      []
    ))

    const [tokenBondingAuthority, tokenBondingAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("token-bonding-authority", "utf-8"), tokenRef.toBuffer()],
        programId
      );

    const [reverseTokenRef, reverseTokenRefBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("reverse-token-ref", "utf-8"), tokenRef.toBuffer()],
        programId
      );

    // Create staking
    const [tokenStakingAuthority, tokenStakingAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("token-staking-authority", "utf-8"), tokenRef.toBuffer()],
        programId
      );

    const {
      output: { tokenStaking, targetMint: stakingTargetMint },
      instructions: tokenStakingInstructions,
      signers: tokenStakingSigners,
    } = await this.splTokenStakingProgram.createTokenStakingInstructions({
      payer,
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

    // Create split
    const { instructions: splitInstructions, signers: splitSigners, output: { tokenAccount: splitTarget, tokenAccountSplit } } =  await this.splTokenAccountSplitProgram.createTokenAccountSplitInstructions({
      payer,
      tokenStaking,
      mint: stakingTargetMint
    });
    signers.push(...splitSigners);
    instructions.push(...splitInstructions);

    // Create token bonding
    const [targetRoyaltiesPdaOwner] = await PublicKey.findProgramAddress(
      [Buffer.from("target-royalties-owner", "utf-8"), tokenRef.toBuffer()],
      programId
    );
    const { instructions: bondingInstructions, signers: bondingSigners, output: { tokenBonding } } = await this.splTokenBondingProgram.createTokenBondingInstructions({
      payer,
      curve: wumboAcct.tokenBondingDefaults.curve,
      baseMint: wumboAcct.mint,
      targetMint,
      authority: tokenBondingAuthority,
      baseRoyaltyPercentage: wumboAcct.tokenBondingDefaults.baseRoyaltyPercentage,
      targetRoyaltyPercentage: wumboAcct.tokenBondingDefaults.targetRoyaltyPercentage,
      baseRoyalties: splitTarget,
      targetRoyaltiesOwner: owner || targetRoyaltiesPdaOwner
    });
    instructions.push(...bondingInstructions);
    signers.push(...bondingSigners);

    instructions.push(
      await this.instruction.initializeSocialTokenV0(
        {
          wumboBumpSeed: wumboAcct.bumpSeed,
          targetMint,
          stakingTargetMint,
          tokenBondingAuthorityBumpSeed,
          tokenStakingAuthorityBumpSeed,
          tokenRefBumpSeed,
          reverseTokenRefBumpSeed,
          tokenMetadataUpdateAuthorityBumpSeed,
        },
        {
          accounts: {
            wumbo,
            tokenMetadata,
            tokenBonding,
            tokenStaking,
            tokenRef,
            targetMint,
            tokenAccountSplit,
            stakingTargetMint,
            reverseTokenRef,
            name: name ? name : anchor.web3.PublicKey.default,
            owner: owner ? owner : anchor.web3.PublicKey.default,
            payer,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    );

    return {
      output: { tokenRef, reverseTokenRef },
      instructions,
      signers,
    };
  }

  async createSocialToken(args: CreateSocialTokenArgs): Promise<{
    tokenRef: PublicKey;
    reverseTokenRef: PublicKey;
  }> {
    const {
      output: { tokenRef, reverseTokenRef },
      instructions,
      signers,
    } = await this.createSocialTokenInstructions(args);
    await this.sendInstructions(instructions, signers);

    return { tokenRef, reverseTokenRef };
  }
}
