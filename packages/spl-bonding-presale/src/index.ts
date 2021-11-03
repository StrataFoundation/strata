import { BN, Program, Provider } from "@project-serum/anchor";
import { getMintInfo, getTokenAccount } from "@project-serum/common";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Keypair, PublicKey, Signer, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, TransactionInstruction } from "@solana/web3.js";
import { amountAsNum, fromCurve, SplTokenBonding, toU128 } from "@strata-foundation/spl-token-bonding";
import { BigInstructionResult, InstructionResult, sendInstructions, sendMultipleInstructions } from "@strata-foundation/spl-utils";
import { SplBondingPresaleIDL } from "./generated/spl-bonding-presale";

interface IInitializePresaleArgs {
  payer?: PublicKey;
  tokenBonding: PublicKey;
  presaleTokenBonding?: PublicKey; // Will create the token bonding if not provided
  presaleBaseStorage?: PublicKey; // Can be inferred most of the time by either (a) fetching presaleTokenBonding or (b) because we create it ourselves here
  postTokenBonding?: PublicKey; // Will create the token bonding if not provided
  postLaunchTokenBondingAuthority?: PublicKey // If not provided, will use the current authority on token bonding
  presaleCurve?: PublicKey; // Used when creating presale token bonding. Default - fixed price curve
  postCurve?: PublicKey; // Used when creating post token bonding. Default - time curve
}

interface ILaunchArgs {
  refund?: PublicKey; // Default to this wallet
  presale: PublicKey;
}

export class SplBondingPresale {
  program: Program<SplBondingPresaleIDL>;
  provider: Provider;
  tokenBondingProgram: SplTokenBonding;
  
  constructor(provider: Provider, program: Program<SplBondingPresaleIDL>, tokenBondingProgram: SplTokenBonding) {
    this.program = program;
    this.provider = provider;
    this.tokenBondingProgram = tokenBondingProgram;
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

  async initializePresaleInstructions({
    payer = this.wallet.publicKey,
    tokenBonding,
    presaleTokenBonding,
    postTokenBonding,
    presaleCurve,
    postCurve,
    postLaunchTokenBondingAuthority,
    presaleBaseStorage
  }: IInitializePresaleArgs): Promise<BigInstructionResult<{ presale: PublicKey }>> {
    const instructions1 = [];
    const signers1 = [];
    const instructions2 = [];
    const signers2 = [];
    const instructions3 = [];
    const signers3 = [];
    const instructions4 = [];
    const signers4: Signer[] = [];

    const tokenBondingAcct = await this.tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding);
    const baseMint = await getMintInfo(this.provider, tokenBondingAcct.baseMint);
    const targetMint = await getMintInfo(this.provider, tokenBondingAcct.baseMint);
    const presaleEndDate = new Date(tokenBondingAcct.goLiveUnixTime.toNumber() * 1000)

    const [presale, bumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("presale", "utf-8"), tokenBonding.toBuffer()],
      this.programId
    );
    const [tokenBondingAuthority, tokenBondingAuthorityBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("token-bonding-authority", "utf-8"), presale.toBuffer()],
      this.programId
    );
    const [baseStorageAuthority, baseStorageAuthorityBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("base-storage-authority", "utf-8"), presale.toBuffer()],
      this.programId
    );

    if (!(tokenBondingAcct.authority! as PublicKey).equals(tokenBondingAuthority) || !tokenBondingAcct.buyFrozen) {
      const { instructions: updateInstrs, signers: updateSigners } = await this.tokenBondingProgram.updateTokenBondingInstructions({
        tokenBonding,
        authority: tokenBondingAuthority,
        buyFrozen: true
      });
      instructions1.push(...updateInstrs);
      signers1.push(...updateSigners);
    }

    let presaleTargetMint: PublicKey | null = null;
    let presaleTargetRoyalties: PublicKey | null = null;
    if (!presaleTokenBonding) {
      const baseStorageKeypair = Keypair.generate();
      signers1.push(baseStorageKeypair);
      const baseStorage = baseStorageKeypair.publicKey;

      instructions1.push(
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: baseStorage!,
          space: AccountLayout.span,
          programId: TOKEN_PROGRAM_ID,
          lamports: await this.provider.connection.getMinimumBalanceForRentExemption(
            AccountLayout.span
          ),
        }),
        Token.createInitAccountInstruction(
          TOKEN_PROGRAM_ID,
          tokenBondingAcct.baseMint,
          baseStorage,
          baseStorageAuthority
        )
      );
      const { instructions: presaleInstrs, signers: presaleSigners, output: { tokenBonding: out, targetMint, buyBaseRoyalties, buyTargetRoyalties } } = await this.tokenBondingProgram.createTokenBondingInstructions({
        payer,
        authority: tokenBondingAuthority,
        curve: presaleCurve!,
        baseMint: tokenBondingAcct.baseMint,
        targetMintDecimals: baseMint.decimals,
        buyBaseRoyaltyPercentage: 0,
        buyTargetRoyaltyPercentage: 0,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
        freezeBuyDate: presaleEndDate!,
        baseStorage
      });
      presaleTargetMint = targetMint;
      presaleTokenBonding = out;
      presaleBaseStorage = baseStorage;
      presaleTargetRoyalties = buyTargetRoyalties;

      instructions2.push(...presaleInstrs);
      signers2.push(...presaleSigners);
    } else if (!presaleBaseStorage) {
      const preTokenBondingAcct = await this.tokenBondingProgram.account.tokenBondingV0.fetch(presaleTokenBonding);
      presaleBaseStorage = preTokenBondingAcct.baseStorage;
      presaleTargetMint = preTokenBondingAcct.targetMint;
      presaleTargetRoyalties = preTokenBondingAcct.buyTargetRoyalties;
    }
    
    if (!postTokenBonding) {
      const { instructions: postInstrs, signers: postSigners, output: { tokenBonding: out } } = await this.tokenBondingProgram.createTokenBondingInstructions({
        payer,
        authority: tokenBondingAuthority,
        curve: postCurve!,
        baseMint: tokenBondingAcct.targetMint,
        targetMint: presaleTargetMint!,
        targetMintDecimals: targetMint.decimals,
        buyBaseRoyaltyPercentage: 0,
        buyTargetRoyaltyPercentage: 0,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
        goLiveDate: presaleEndDate!,
        buyFrozen: false,
        buyBaseRoyalties: tokenBondingAcct.buyTargetRoyalties,
        sellBaseRoyalties: tokenBondingAcct.sellTargetRoyalties,
        buyTargetRoyalties: presaleTargetRoyalties!,
        sellTargetRoyalties: presaleTargetRoyalties!,
        index: 1
      });
      postTokenBonding = out;

      instructions3.push(...postInstrs);
      signers3.push(...postSigners);
    }

    instructions4.push(await this.instruction.initializeTokenBondingPresaleV0({
      postLaunchTokenBondingAuthority: postLaunchTokenBondingAuthority || (tokenBondingAcct.authority as PublicKey)!,
      bumpSeed,
      tokenBondingAuthorityBumpSeed,
      baseStorageAuthorityBumpSeed
    }, {
      accounts: {
        payer,
        presale,
        tokenBonding,
        presaleTokenBonding,
        baseStorage: presaleBaseStorage!,
        postTokenBonding,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        clock: SYSVAR_CLOCK_PUBKEY
      }
    }));

    return {
      instructions: [instructions1, instructions2, instructions3, instructions4],
      signers: [signers1, signers2, signers3, signers4],
      output: {
        presale
      }
    }
  }

  async initializePresale(args: IInitializePresaleArgs): Promise<PublicKey> {
    const {
      output: { presale },
      instructions,
      signers,
    } = await this.initializePresaleInstructions(args);
    await sendMultipleInstructions(
      this.errors,
      this.provider,
      instructions,
      signers,
      args.payer
    )
    return presale;
  }

  async launchInstructions({ presale, refund = this.wallet.publicKey }: ILaunchArgs): Promise<InstructionResult<null>> {
    const presaleAcct = await this.account.tokenBondingPresaleV0.fetch(presale);
    const tokenBondingAcct = await this.tokenBondingProgram.account.tokenBondingV0.fetch(presaleAcct.tokenBonding);
    const presaleTokenBondingAcct = await this.tokenBondingProgram.account.tokenBondingV0.fetch(presaleAcct.presaleTokenBonding);
    const postTokenBondingAcct = await this.tokenBondingProgram.account.tokenBondingV0.fetch(presaleAcct.postTokenBonding);
    const presaleTargetMint = await getMintInfo(this.provider, presaleTokenBondingAcct.targetMint);
    const baseMint = await getMintInfo(this.provider, tokenBondingAcct.baseMint);
    const targetMint = await getMintInfo(this.provider, tokenBondingAcct.targetMint);
    const presaleBaseStorage = await getTokenAccount(this.provider, presaleTokenBondingAcct.baseStorage);
    const tokenBondingAuthority = await PublicKey.createProgramAddress(
      [Buffer.from("token-bonding-authority", "utf-8"), presale.toBuffer(), new BN(presaleAcct.tokenBondingAuthorityBumpSeed).toBuffer()],
      this.programId
    );
    const presaleBaseStorageAuthority = await PublicKey.createProgramAddress(
      [Buffer.from("base-storage-authority", "utf-8"), presale.toBuffer(), new BN(presaleAcct.baseStorageAuthorityBumpSeed).toBuffer()],
      this.programId
    );
    const curveAcct = await this.tokenBondingProgram.account.curveV0.fetch(tokenBondingAcct.curve as PublicKey);
    const curve = fromCurve(curveAcct, presaleBaseStorage, baseMint, targetMint);

    return {
      instructions: [
        await this.instruction.launchV0({
          rootEstimates: curve.buyWithBaseRootEstimates(amountAsNum(presaleBaseStorage.amount, baseMint), tokenBondingAcct.buyBaseRoyaltyPercentage).map(toU128)
        }, {
          accounts: {
            refund,
            presale,
            presaleTokenBonding: presaleAcct.presaleTokenBonding,
            presaleTokenBondingAuthority: tokenBondingAuthority,
            presaleBaseStorage: presaleTokenBondingAcct.baseStorage,
            presaleBaseStorageAuthority,
            presaleTargetMint: presaleTokenBondingAcct.targetMint,
            presaleTargetMintAuthority: presaleTargetMint.mintAuthority! as PublicKey,
            postTokenBonding: presaleAcct.postTokenBonding,
            postBaseStorage: postTokenBondingAcct.baseStorage,
            tokenBonding: presaleAcct.tokenBonding,
            tokenBondingAuthority,
            sellBaseRoyalties: tokenBondingAcct.sellBaseRoyalties,
            sellTargetRoyalties: tokenBondingAcct.sellTargetRoyalties,
            buyBaseRoyalties: tokenBondingAcct.buyBaseRoyalties,
            buyTargetRoyalties: tokenBondingAcct.buyTargetRoyalties,
            curve: tokenBondingAcct.curve,
            baseMint: tokenBondingAcct.baseMint,
            targetMint: tokenBondingAcct.targetMint,
            targetMintAuthority: targetMint.mintAuthority! as PublicKey,
            baseStorage: tokenBondingAcct.baseStorage,
            splTokenBondingProgram: this.tokenBondingProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY
          }
        })
      ],
      signers: [],
      output: null
    }
  }

  async launch(args: ILaunchArgs): Promise<void> {
    const {
      instructions,
      signers,
    } = await this.launchInstructions(args);
    await this.sendInstructions(instructions, signers);
  }
}