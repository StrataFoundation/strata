import * as anchor from "@wum.bo/anchor";
import BN from "bn.js";
import { Program, Provider } from "@wum.bo/anchor";
import { createMetadata, Data, decodeMetadata, METADATA_PROGRAM_ID, extendBorsh, InstructionResult, BigInstructionResult, sendInstructions, sendMultipleInstructions } from "@wum.bo/spl-utils";
import { connection, createMintInstructions } from "@project-serum/common";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { SplWumboIDL } from "./generated/spl-wumbo";
import { SplTokenBonding } from "@wum.bo/spl-token-bonding";
import { PeriodUnit, SplTokenStaking } from "@wum.bo/spl-token-staking";
import { SplTokenAccountSplit } from "@wum.bo/spl-token-account-split";
import { percent } from "@wum.bo/spl-utils";
import { sendAndConfirmRawTransaction } from "@solana/web3.js";

export * from "./generated/spl-wumbo";

extendBorsh();

interface InitializeStakingArgs {
  payer?: PublicKey;
  tokenRef: PublicKey;
}

interface CreateWumboArgs {
  payer?: PublicKey;
  curve?: PublicKey;
  wumMint?: PublicKey;
  authority?: PublicKey;
}

interface CreateSocialTokenArgs {
  payer?: PublicKey;
  wumbo: PublicKey;
  name?: PublicKey; // Either these or owner needs to be provided
  nameClass?: PublicKey; // Either these or owner needs to be provided
  nameParent?: PublicKey; // Either these or owner needs to be provided
  tokenName: string; // For the token metadata name
  owner?: PublicKey;
}

interface ClaimSocialTokenArgs {
  payer?: PublicKey;
  owner: PublicKey;
  tokenRef: PublicKey;
  symbol?: string;
}

interface UpdateMetadataArgs {
  tokenRef: PublicKey;
  name?: string;
  symbol?: string;
  uri?: string;
  baseRoyaltyPercentage?: number;
  targetRoyaltyPercentage?: number;
}

interface OptOutArgs {
  tokenRef: PublicKey;
  payer?: PublicKey;
  nameClass?: PublicKey;
}

export class SplWumbo {
  program: Program<SplWumboIDL>;
  splTokenBondingProgram: SplTokenBonding;
  splTokenAccountSplitProgram: SplTokenAccountSplit;
  splTokenStakingProgram: SplTokenStaking;
  provider: Provider;

  constructor(opts: {
    provider: Provider;
    program: Program<SplWumboIDL>;
    splTokenBondingProgram: SplTokenBonding;
    splTokenAccountSplitProgram: SplTokenAccountSplit;
    splTokenStakingProgram: SplTokenStaking;
  }) {
    this.provider = opts.provider;
    this.program = opts.program;
    this.splTokenBondingProgram = opts.splTokenBondingProgram;
    this.splTokenAccountSplitProgram = opts.splTokenAccountSplitProgram;
    this.splTokenStakingProgram = opts.splTokenStakingProgram;
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
    return this.program.idl.errors.reduce((acc, err) => {
      acc.set(err.code, `${err.name}: ${err.msg}`);
      return acc;
    }, new Map<number, string>())
  }

  sendInstructions(instructions: TransactionInstruction[], signers: Signer[], payer?: PublicKey): Promise<string> {
    return sendInstructions(this.errors, this.provider, instructions, signers, payer)
  }

  async createWumboInstructions({
    payer = this.wallet.publicKey,
    curve,
    wumMint,
    authority
  }: CreateWumboArgs): Promise<InstructionResult<{ wumbo: PublicKey }>> {
    const programId = this.programId;
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];

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
          authority: authority ? authority : null,
          bumpSeed: wumboBump,
          tokenMetadataDefaults: {
            symbol: "UNCLAIMED",
            uri: "https://wumbo-token-metadata.s3.us-east-2.amazonaws.com/unclaimed.json",
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

  async createWumbo(args: CreateWumboArgs): Promise<PublicKey> {
    const {
      output: { wumbo },
      instructions,
      signers,
    } = await this.createWumboInstructions(args);
    await this.sendInstructions(instructions, signers);

    return wumbo;
  }

  async claimSocialTokenInstructions({
    payer = this.wallet.publicKey,
    owner = this.wallet.publicKey,
    tokenRef,
    symbol
  }: ClaimSocialTokenArgs): Promise<InstructionResult<null>> {
    const tokenRefAcct = await this.account.tokenRefV0.fetch(tokenRef);
    const tokenBondingAcct = await this.splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRefAcct.tokenBonding);
    const name = tokenRefAcct.name! as PublicKey;
    const instructions = [];

    const newTargetRoyalties = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenBondingAcct.targetMint,
      owner,
      true
    );

    if (!(await this.splTokenBondingProgram.accountExists(newTargetRoyalties))) {
      console.log("Creating target royalties...");
      instructions.push(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenBondingAcct.targetMint,
          newTargetRoyalties,
          owner,
          payer
        )
      );
    }

    const [reverseTokenRef] = await PublicKey.findProgramAddress(
      [Buffer.from("reverse-token-ref", "utf-8"), tokenRefAcct.wumbo.toBuffer(), tokenBondingAcct.targetMint.toBuffer()],
      this.programId
    );

    const targetRoyaltiesOwner = await PublicKey.createProgramAddress(
      [Buffer.from("target-royalties-owner", "utf-8"), reverseTokenRef.toBuffer(), new BN(tokenRefAcct.targetRoyaltiesOwnerBumpSeed).toBuffer()],
      this.programId
    );

    const tokenBondingAuthority =
      await PublicKey.createProgramAddress(
        [Buffer.from("token-bonding-authority", "utf-8"), reverseTokenRef.toBuffer(), new BN(tokenRefAcct.tokenBondingAuthorityBumpSeed).toBuffer()],
        this.programId
      );

    const [newTokenRef, tokenRefBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("token-ref", "utf-8"), tokenRefAcct.wumbo.toBuffer(), owner.toBuffer()],
      this.programId
    );


    instructions.push(await this.instruction.claimSocialTokenV0(tokenRefBumpSeed, {
      accounts: {
        wumbo: tokenRefAcct.wumbo,
        tokenRef: tokenRef,
        newTokenRef,
        reverseTokenRef,
        tokenBonding: tokenRefAcct.tokenBonding,
        tokenBondingAuthority,
        targetRoyaltiesOwner,
        name,
        owner,
        newTargetRoyalties,
        targetRoyalties: tokenBondingAcct.targetRoyalties,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenBondingProgram: this.splTokenBondingProgram.programId,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      }
    }))

    if (symbol) {
      const tokenMetadataUpdateAuthority =
        await PublicKey.createProgramAddress(
          [Buffer.from("token-metadata-authority", "utf-8"), reverseTokenRef.toBuffer(), new BN(tokenRefAcct.tokenMetadataUpdateAuthorityBumpSeed).toBuffer()],
          this.programId
        );

      const tokenMetadataRaw = await this.provider.connection.getAccountInfo(tokenRefAcct.tokenMetadata);
      const tokenMetadata = decodeMetadata(tokenMetadataRaw!.data);
      instructions.push(await this.instruction.updateTokenMetadata({
        name: tokenMetadata.data.name,
        symbol: symbol || tokenMetadata.data.symbol,
        uri: tokenMetadata.data.uri
      }, {
        accounts: {
          reverseTokenRef,
          owner: owner,
          tokenMetadata: tokenRefAcct.tokenMetadata,
          updateAuthority: tokenMetadataUpdateAuthority,
          tokenMetadataProgram: METADATA_PROGRAM_ID
        }
      }))
    }

    return {
      signers: [],
      instructions,
      output: null
    }
  }

  async claimSocialToken(args: ClaimSocialTokenArgs): Promise<void> {
    const {
      instructions,
      signers,
    } = await this.claimSocialTokenInstructions(args);
    await this.sendInstructions(instructions, signers);
  }

  async initializeStakingInstructions({
    tokenRef,
    payer = this.wallet.publicKey
  }: InitializeStakingArgs): Promise<BigInstructionResult<null>> {
    const tokenRefAcct = await this.account.tokenRefV0.fetch(tokenRef);
    const wumboAcct = await this.account.wumboV0.fetch(tokenRefAcct.wumbo);
    const tokenBondingAcct = await this.splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRefAcct.tokenBonding);
    const tokenMetadataRaw = await this.provider.connection.getAccountInfo(tokenRefAcct.tokenMetadata);
    const tokenMetadata = decodeMetadata(tokenMetadataRaw!.data);

    const [reverseTokenRef] =
      await PublicKey.findProgramAddress(
        [Buffer.from("reverse-token-ref", "utf-8"), tokenRefAcct.wumbo.toBuffer(), tokenRefAcct.mint.toBuffer()],
        this.programId
      );
    
    const instructions = [];
    const signers = [];

      // Create staking
    const [tokenStakingAuthority, tokenStakingAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("token-staking-authority", "utf-8"), reverseTokenRef.toBuffer()],
        this.programId
      );

    const [baseRoyaltiesOwner, _] = await PublicKey.findProgramAddress(
      [Buffer.from("base-royalties-owner", "utf-8"), reverseTokenRef.toBuffer()],
      this.programId
    );

    const stakingTargetMintKeypair = anchor.web3.Keypair.generate();
    signers.push(stakingTargetMintKeypair)
    const [stakingTargetMintAuthorityRes, stakingTargetMintAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("target-authority", "utf-8"), stakingTargetMintKeypair.publicKey.toBuffer()],
        this.splTokenStakingProgram.programId
      );
    const stakingTargetMintAuthority = stakingTargetMintAuthorityRes;
    const tokenInstructions = await createMintInstructions(
      this.provider,
      this.wallet.publicKey,
      stakingTargetMintKeypair.publicKey,
      wumboAcct.tokenStakingDefaults.targetMintDecimals
    );
    instructions.push(...tokenInstructions)

    console.log("Creating social token metadata...");
    const [tokenMetadataUpdateAuthority, tokenMetadataUpdateAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("token-metadata-authority", "utf-8"), reverseTokenRef.toBuffer()],
        this.programId
      );
    const tokenMetadataKey = await createMetadata(
      new Data(tokenMetadata.data),
      tokenMetadataUpdateAuthority.toBase58(),
      stakingTargetMintKeypair.publicKey.toBase58(),
      payer.toBase58(),
      instructions,
      payer.toBase58()
    );

    instructions.push(Token.createSetAuthorityInstruction(
      TOKEN_PROGRAM_ID,
      stakingTargetMintKeypair.publicKey,
      stakingTargetMintAuthority,
      "MintTokens",
      payer,
      []
    ))


    const {
      output: { tokenStaking, targetMint: stakingTargetMint },
      instructions: tokenStakingInstructions,
      signers: tokenStakingSigners,
    } = await this.splTokenStakingProgram.createTokenStakingInstructions({
      payer,
      targetMint: stakingTargetMintKeypair.publicKey,
      authority: tokenStakingAuthority,
      baseMint: tokenBondingAcct.targetMint,
      periodUnit: wumboAcct.tokenStakingDefaults.periodUnit,
      period: wumboAcct.tokenStakingDefaults.period,
      targetMintDecimals: wumboAcct.tokenStakingDefaults.targetMintDecimals,
      rewardPercentPerPeriodPerLockupPeriod:
        wumboAcct.tokenStakingDefaults.rewardPercentPerPeriodPerLockupPeriod,
    });
    signers.push(...tokenStakingSigners);
    instructions.push(...tokenStakingInstructions);

    const instructions2 = []
    const signers2 = []

    // Create split
    const { instructions: splitInstructions, signers: splitSigners, output: { tokenAccount: splitTarget, tokenAccountSplit } } =  await this.splTokenAccountSplitProgram.createTokenAccountSplitInstructions({
      payer,
      tokenStaking,
      mint: tokenBondingAcct.baseMint
    });
    signers2.push(...splitSigners);
    instructions2.push(...splitInstructions);

    instructions2.push(
      await this.instruction.initializeStakingV0({
        tokenStakingAuthorityBumpSeed
      }, {
        accounts: {
          refund: payer,
          wumbo: tokenRefAcct.wumbo,
          tokenRef,
          reverseTokenRef,
          tokenStaking,
          stakingTargetMint,
          tokenAccountSplit,
          tokenAccount: splitTarget,
          tokenBonding: tokenRefAcct.tokenBonding,
          tokenBondingAuthority: tokenBondingAcct.authority! as PublicKey,
          baseRoyalties: tokenBondingAcct.baseRoyalties,
          baseRoyaltiesOwner: baseRoyaltiesOwner,
          targetMint: tokenBondingAcct.targetMint,
          tokenBondingProgram: this.splTokenBondingProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID
        }
      })
    )

    return {
      signers: [signers, signers2],
      instructions: [instructions, instructions2],
      output: null
    }
  }


  async initializeStaking(args: InitializeStakingArgs): Promise<void> {
    const {
      instructions,
      signers,
    } = await this.initializeStakingInstructions(args);
    await sendMultipleInstructions(
      this.errors,
      this.provider,
      instructions,
      signers,
      args.payer
    )
  }

  async updateMetadataInstructions({
    tokenRef,
    name,
    symbol,
    uri,
    baseRoyaltyPercentage,
    targetRoyaltyPercentage
  }: UpdateMetadataArgs): Promise<InstructionResult<null>> {
    const tokenRefAcct = await this.account.tokenRefV0.fetch(tokenRef);
    const tokenMetadataRaw = await this.provider.connection.getAccountInfo(tokenRefAcct.tokenMetadata);
    const tokenMetadata = decodeMetadata(tokenMetadataRaw!.data);

    const [reverseTokenRef] =
      await PublicKey.findProgramAddress(
        [Buffer.from("reverse-token-ref", "utf-8"), tokenRefAcct.wumbo.toBuffer(), tokenRefAcct.mint.toBuffer()],
        this.programId
      );

    const tokenMetadataUpdateAuthority =
      await PublicKey.createProgramAddress(
        [Buffer.from("token-metadata-authority", "utf-8"), reverseTokenRef.toBuffer(), new BN(tokenRefAcct.tokenMetadataUpdateAuthorityBumpSeed).toBuffer()],
        this.programId
      );

    const instructions = [];

    instructions.push(
      await this.instruction.updateTokenMetadata({
        name: name || tokenMetadata.data.name,
        symbol: symbol || tokenMetadata.data.symbol,
        uri: uri || tokenMetadata.data.uri
      }, {
        accounts: {
          reverseTokenRef,
          owner: tokenRefAcct.owner! as PublicKey,
          tokenMetadata: tokenRefAcct.tokenMetadata,
          updateAuthority: tokenMetadataUpdateAuthority,
          tokenMetadataProgram: METADATA_PROGRAM_ID
        }
      })
    )

    if (baseRoyaltyPercentage || targetRoyaltyPercentage) {
      const tokenBondingAcct = await this.splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRefAcct.tokenBonding);
      const tokenBondingAuthority =
        await PublicKey.createProgramAddress(
          [Buffer.from("token-bonding-authority", "utf-8"), reverseTokenRef.toBuffer(), new BN(tokenRefAcct.tokenBondingAuthorityBumpSeed).toBuffer()],
          this.programId
        );

      instructions.push(
        await this.instruction.updateRoyaltiesV0({
          baseRoyaltyPercentage: baseRoyaltyPercentage || tokenBondingAcct.baseRoyaltyPercentage, 
          targetRoyaltyPercentage: targetRoyaltyPercentage || tokenBondingAcct.targetRoyaltyPercentage, 
        }, {
          accounts: {
            reverseTokenRef,
            owner: tokenRefAcct.owner! as PublicKey,
            tokenBonding: tokenRefAcct.tokenBonding,
            tokenBondingAuthority,
            tokenBondingProgram: this.splTokenBondingProgram.programId,
          }
        })
      )
    }
    return {
      signers: [],
      instructions,
      output: null
    }
  }


  async updateMetadata(args: UpdateMetadataArgs): Promise<void> {
    const {
      instructions,
      signers,
    } = await this.updateMetadataInstructions(args);
    await this.sendInstructions(instructions, signers);
  }

  async createSocialTokenInstructions({
    payer = this.wallet.publicKey,
    wumbo,
    name,
    owner,
    tokenName: handle,
    nameClass,
    nameParent
  }: CreateSocialTokenArgs): Promise<
    BigInstructionResult<{
      tokenRef: PublicKey;
      reverseTokenRef: PublicKey;
      tokenBonding: PublicKey;
    }>
  > {
    const programId = this.programId;
    const provider = this.provider;
    const instructions1: TransactionInstruction[] = [];
    const signers1: Signer[] = [];

    const wumboAcct = await this.program.account.wumboV0.fetch(wumbo);

    // Token refs
    const [tokenRef, tokenRefBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("token-ref", "utf-8"), wumbo.toBuffer(), (name || owner)!.toBuffer()],
      programId
    );

    // create mint with payer as auth
    console.log("Creating social token mint...");
    const targetMintKeypair = anchor.web3.Keypair.generate();
    signers1.push(targetMintKeypair);
    const targetMint = targetMintKeypair.publicKey;

    instructions1.push(...(await createMintInstructions(provider, payer, targetMint, 9)));

    const [reverseTokenRef, reverseTokenRefBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("reverse-token-ref", "utf-8"), wumbo.toBuffer(), targetMint.toBuffer()],
        programId
      );
    // create metadata with payer as temporary authority
    console.log("Creating social token metadata...");
    const [tokenMetadataUpdateAuthority, tokenMetadataUpdateAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("token-metadata-authority", "utf-8"), reverseTokenRef.toBuffer()],
        programId
      );
    const tokenMetadata = await createMetadata(
      new Data({
        name: handle,
        symbol: owner ? handle.slice(0,10) : wumboAcct.tokenMetadataDefaults.symbol as string,
        uri: wumboAcct.tokenMetadataDefaults.uri as string,
        sellerFeeBasisPoints: 0,
        // @ts-ignore
        creators: null,
      }),
      tokenMetadataUpdateAuthority.toBase58(),
      targetMint.toBase58(),
      payer.toBase58(),
      instructions1,
      payer.toBase58()
    );

    // Set mint authority to token bondings authority
    const [targetMintAuthority, targetMintAuthorityBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("target-authority", "utf-8"), targetMint.toBuffer()],
      this.splTokenBondingProgram.programId
    );
    instructions1.push(Token.createSetAuthorityInstruction(
      TOKEN_PROGRAM_ID,
      targetMint,
      targetMintAuthority,
      "MintTokens",
      payer,
      []
    ))

    const [tokenBondingAuthority, tokenBondingAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("token-bonding-authority", "utf-8"), reverseTokenRef.toBuffer()],
        programId
      );

    // Create token bonding
    const instructions2: TransactionInstruction[] = [];
    const signers2: Signer[] = [];
    const [targetRoyaltiesPdaOwner, targetRoyaltiesOwnerBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("target-royalties-owner", "utf-8"), reverseTokenRef.toBuffer()],
      programId
    );
    const [baseRoyaltiesPdaOwner, baseRoyaltiesOwnerBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("base-royalties-owner", "utf-8"), reverseTokenRef.toBuffer()],
      programId
    );
    const { instructions: bondingInstructions, signers: bondingSigners, output: { tokenBonding, baseRoyalties, targetRoyalties } } = await this.splTokenBondingProgram.createTokenBondingInstructions({
      payer,
      curve: wumboAcct.tokenBondingDefaults.curve,
      baseMint: wumboAcct.mint,
      targetMint,
      authority: tokenBondingAuthority,
      baseRoyaltyPercentage: wumboAcct.tokenBondingDefaults.baseRoyaltyPercentage,
      targetRoyaltyPercentage: wumboAcct.tokenBondingDefaults.targetRoyaltyPercentage,
      baseRoyaltiesOwner: baseRoyaltiesPdaOwner,
      targetRoyaltiesOwner: owner || targetRoyaltiesPdaOwner
    });
    instructions2.push(...bondingInstructions);
    signers2.push(...bondingSigners);

    const initializeArgs = {
      wumbo,
      tokenMetadata: new PublicKey(tokenMetadata),
      tokenBonding,
      baseRoyalties,
      targetRoyalties,
      targetMint,
      payer,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      clock: SYSVAR_CLOCK_PUBKEY
    }
    const args = {
      nameClass: nameClass || null,
      nameParent: nameParent || null,
      wumboBumpSeed: wumboAcct.bumpSeed,
      targetRoyaltiesOwnerBumpSeed,
      baseRoyaltiesOwnerBumpSeed,
      tokenBondingAuthorityBumpSeed,
      tokenRefBumpSeed,
      reverseTokenRefBumpSeed,
      tokenMetadataUpdateAuthorityBumpSeed,
    }

    if (owner) {
      instructions2.push(
        await this.instruction.initializeOwnedSocialTokenV0(
          args,
          {
            accounts: {
              initializeArgs,
              owner,
              payer,
              tokenRef,
              reverseTokenRef,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
          }
        )
      );
    } else {
      instructions2.push(
        await this.instruction.initializeUnclaimedSocialTokenV0(
          args,
          {
            accounts: {
              initializeArgs,
              name: name!,
              payer,
              tokenRef,
              reverseTokenRef,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
          }
        )
      ); 
    }

    return {
      output: { tokenRef, reverseTokenRef, tokenBonding },
      instructions: [instructions1, instructions2],
      signers: [signers1, signers2],
    };
  }

  async createSocialToken(args: CreateSocialTokenArgs): Promise<{
    tokenRef: PublicKey;
    reverseTokenRef: PublicKey;
    tokenBonding: PublicKey;
  }> {
    const {
      output: { tokenRef, reverseTokenRef, tokenBonding },
      instructions: instructionGroups,
      signers: signerGroups,
    } = await this.createSocialTokenInstructions(args);

    await sendMultipleInstructions(
      this.errors,
      this.provider,
      instructionGroups,
      signerGroups,
      args.payer
    )
    
    return { tokenRef, reverseTokenRef, tokenBonding };
  }

  async optOutInstructions({
    tokenRef,
    nameClass
  }: OptOutArgs): Promise<InstructionResult<null>> {
    const tokenRefAcct = await this.account.tokenRefV0.fetch(tokenRef);
    const [reverseTokenRef] =
      await PublicKey.findProgramAddress(
        [Buffer.from("reverse-token-ref", "utf-8"), tokenRefAcct.wumbo.toBuffer(), tokenRefAcct.mint.toBuffer()],
        this.programId
      );
    const tokenBondingAcct = await this.splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRefAcct.tokenBonding);
    const tokenBondingAuthority =
      await PublicKey.createProgramAddress(
        [Buffer.from("token-bonding-authority", "utf-8"), reverseTokenRef.toBuffer(), new BN(tokenRefAcct.tokenBondingAuthorityBumpSeed).toBuffer()],
        this.programId
      );
    const targetRoyaltiesOwner = await PublicKey.createProgramAddress(
      [Buffer.from("target-royalties-owner", "utf-8"), reverseTokenRef.toBuffer(), new BN(tokenRefAcct.targetRoyaltiesOwnerBumpSeed).toBuffer()],
      this.programId
    );

    const baseStorageAuthority = await PublicKey.createProgramAddress(
      [
        Buffer.from("storage-authority", "utf-8"),
        tokenRefAcct.tokenBonding.toBuffer(),
        new BN(tokenBondingAcct.baseStorageAuthorityBumpSeed as number).toBuffer(),
      ],
      this.splTokenBondingProgram.programId
    );
    const tokenStakingAuthority = tokenRefAcct.tokenStaking ? 
      await PublicKey.createProgramAddress(
        [
          Buffer.from("token-staking-authority", "utf-8"), 
          reverseTokenRef.toBuffer(),
          new BN(tokenRefAcct.stakingAuthorityBumpSeed! as number).toBuffer(),
        ],
        this.programId
      ) : PublicKey.default;

    const instructions = [];

    instructions.push(
      await this.instruction.optOutV0({
        accounts: {
          reverseTokenRef,
          tokenBonding: tokenRefAcct.tokenBonding,
          tokenBondingAuthority,
          owner: tokenRefAcct.isClaimed ? tokenRefAcct.owner! as PublicKey : nameClass!,
          baseRoyalties: tokenBondingAcct.baseRoyalties,
          targetRoyalties: tokenBondingAcct.targetRoyalties,
          targetRoyaltiesOwner: tokenRefAcct.isClaimed ? tokenRefAcct.owner as PublicKey : targetRoyaltiesOwner,
          curve: tokenBondingAcct.curve,
          baseMint: tokenBondingAcct.baseMint,
          targetMint: tokenBondingAcct.targetMint,
          baseStorage: tokenBondingAcct.baseStorage,
          tokenStaking: tokenRefAcct.tokenStaking ? tokenRefAcct.tokenStaking as PublicKey : PublicKey.default,
          tokenStakingAuthority,
          baseStorageAuthority,
          tokenBondingProgram: this.splTokenBondingProgram.programId,
          tokenStakingProgram: this.splTokenStakingProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: SYSVAR_CLOCK_PUBKEY
        }
      })
    )

    return {
      signers: [],
      instructions,
      output: null
    }
  }


  async optOut(args: OptOutArgs): Promise<void> {
    const {
      instructions,
      signers,
    } = await this.optOutInstructions(args);
    await this.sendInstructions(instructions, signers, args.payer);
  }
}
