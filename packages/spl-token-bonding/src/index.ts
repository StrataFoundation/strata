import * as anchor from "@wum.bo/anchor";
import {
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Account,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  Signer,
  SystemInstruction,
  Keypair,
} from "@solana/web3.js";
import {
  getMintInfo,
  createMintInstructions,
  createTokenAccountInstrs,
  connection,
} from "@project-serum/common";
import BN, { max } from "bn.js";
import { Program, IdlTypes, TypesCoder, Provider } from "@wum.bo/anchor";
import {
  SplTokenBondingIDL,
  TokenBondingV0,
  SplTokenBondingIDLJson,
  CurveV0,
} from "./generated/spl-token-bonding";
import {
  AccountLayout,
  NATIVE_MINT,
  MintInfo,
  TOKEN_PROGRAM_ID,
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { amountAsNum, asDecimal, Curve, LogCurveV0, fromCurve, supplyAsNum } from "./curves";
import { InstructionResult, sendInstructions } from "@wum.bo/spl-utils";

export * from "./generated/spl-token-bonding";
export * from "./curves";

interface InitializeCurveArgs {
  curve: CurveV0;
  payer?: PublicKey;
}

interface CreateTokenBondingArgs {
  payer?: PublicKey;
  curve: PublicKey;
  baseMint: PublicKey;
  targetMint?: PublicKey; // If not provided, will create one with `targetMintDecimals`
  targetMintDecimals?: number; // If target mint not provded, create with these decimals
  buyBaseRoyalties?: PublicKey; // If not provided, create an Associated Token Account with baseRoyaltiesOwner
  buyBaseRoyaltiesOwner?: PublicKey; // If base royalties not provided, will create it with this owner. Otherwise, will use wallet.publicKey
  buyTargetRoyalties?: PublicKey; // If not provided, create an Associated Token Account with targetRoyaltiesOwner
  buyTargetRoyaltiesOwner?: PublicKey; // If target royalties not provided, will create it with this owner. Otherwise, will use wallet.publicKey
  sellBaseRoyalties?: PublicKey; // If not provided, create an Associated Token Account with baseRoyaltiesOwner
  sellBaseRoyaltiesOwner?: PublicKey; // If base royalties not provided, will create it with this owner. Otherwise, will use wallet.publicKey
  sellTargetRoyalties?: PublicKey; // If not provided, create an Associated Token Account with targetRoyaltiesOwner
  sellTargetRoyaltiesOwner?: PublicKey; // If target royalties not provided, will create it with this owner. Otherwise, will use wallet.publicKey
  authority?: PublicKey;
  baseStorage?: PublicKey; // Base storage account. If provided, will create a bonding curve with Sell disabled, and all proceeds will go to this account.
  buyBaseRoyaltyPercentage: number;
  buyTargetRoyaltyPercentage: number;
  sellBaseRoyaltyPercentage: number;
  sellTargetRoyaltyPercentage: number;
  mintCap?: BN;
  purchaseCap?: BN;
  goLiveDate?: Date;
  buyFrozen?: boolean;
}

interface UpdateTokenBondingArgs {
  tokenBonding: PublicKey;
  buyBaseRoyaltyPercentage?: number;
  buyTargetRoyaltyPercentage?: number;
  sellBaseRoyaltyPercentage: number;
  sellTargetRoyaltyPercentage: number;
  buyBaseRoyalties?: PublicKey;
  buyTargetRoyalties?: PublicKey;
  sellBaseRoyalties?: PublicKey;
  sellTargetRoyalties?: PublicKey;
  authority?: PublicKey | null;
  buyFrozen?: boolean;
}

interface BuyV0Args {
  tokenBonding: PublicKey;
  payer?: PublicKey;
  source?: PublicKey; // Will use ATA of sourceAuthority if not provided
  destination?: PublicKey; // Will use ATA of sourceAuthority if not provided
  sourceAuthority?: PublicKey; // Wallet public key if not provided
  desiredTargetAmount: BN;
  slippage: number; // Decimal number. max price will be (1 + slippage) * price_for_desired_target_amount
}

interface SellV0Args {
  tokenBonding: PublicKey;
  payer?: PublicKey;
  source?: PublicKey; // Will use ATA of sourceAuthority if not provided
  destination?: PublicKey; // Will use ATA of sourceAuthority if not provided
  sourceAuthority?: PublicKey; // Wallet public key if not provided
  targetAmount: BN;
  slippage: number; // Decimal number. max price will be (1 + slippage) * price_for_desired_target_amount
}

export class SplTokenBonding {
  program: Program<SplTokenBondingIDL>;
  provider: Provider;

  constructor(provider: Provider, program: Program<SplTokenBondingIDL>) {
    this.program = program;
    this.provider = provider;
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

  async initializeSolStorageInstructions(): Promise<InstructionResult<null>> {
    const [solStorage, solStorageBump] = await PublicKey.findProgramAddress(
      [Buffer.from("sol-storage", "utf-8")],
      this.programId
    );
    const [solStorageAuthority] = await PublicKey.findProgramAddress(
      [Buffer.from("sol-storage-authority", "utf-8")],
      this.programId
    );
    const instruction = await this.instruction.initializeSolStorageV0(solStorageBump, {
      accounts: {
        payer: this.wallet.publicKey,
        solStorage,
        solStorageAuthority,
        nativeMint: NATIVE_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      }
    })

    return {
      instructions: [instruction],
      signers: [],
      output: null
    }
  }

  async initializeSolStorage(): Promise<void> {
    const {
      instructions,
      signers,
    } = await this.initializeSolStorageInstructions();
    await this.sendInstructions(instructions, signers);
  }

  async initializeCurveInstructions({
    payer = this.wallet.publicKey,
    curve,
  }: InitializeCurveArgs): Promise<InstructionResult<{ curve: PublicKey }>> {
    const curveKeypair = anchor.web3.Keypair.generate();
    return {
      output: {
        curve: curveKeypair.publicKey,
      },
      signers: [curveKeypair],
      instructions: [
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: curveKeypair.publicKey,
          space: 500,
          lamports: await this.provider.connection.getMinimumBalanceForRentExemption(500),
          programId: this.programId,
        }),
        await this.instruction.createCurveV0(curve, {
          accounts: {
            payer,
            curve: curveKeypair.publicKey,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }),
      ],
    };
  }

  async initializeCurve(args: InitializeCurveArgs): Promise<PublicKey> {
    const {
      output: { curve },
      instructions,
      signers,
    } = await this.initializeCurveInstructions(args);
    if (instructions.length == 0) {
      return curve;
    }

    await this.sendInstructions(instructions, signers);
    return curve;
  }

  async createTokenBondingInstructions({
    authority = this.wallet.publicKey,
    payer = this.wallet.publicKey,
    curve,
    baseMint,
    targetMint,
    baseStorage,
    buyBaseRoyalties,
    buyBaseRoyaltiesOwner = this.wallet.publicKey,
    buyTargetRoyalties,
    buyTargetRoyaltiesOwner = this.wallet.publicKey,
    sellBaseRoyalties,
    sellBaseRoyaltiesOwner = this.wallet.publicKey,
    sellTargetRoyalties,
    sellTargetRoyaltiesOwner = this.wallet.publicKey,
    buyBaseRoyaltyPercentage,
    buyTargetRoyaltyPercentage,
    mintCap,
    purchaseCap,
    goLiveDate = new Date(),
    targetMintDecimals,
    buyFrozen = false,
  }: CreateTokenBondingArgs): Promise<InstructionResult<{ 
    tokenBonding: PublicKey, 
    targetMint: PublicKey ,
    buyBaseRoyalties: PublicKey,
    buyTargetRoyalties: PublicKey,
    sellBaseRoyalties: PublicKey,
    sellTargetRoyalties: PublicKey
  }>> {
    if (!targetMint) {
      if (sellTargetRoyalties || buyTargetRoyalties) {
        throw new Error("Cannot define target royalties if mint is not defined");
      }

      if (!targetMintDecimals) {
        throw new Error("Cannot define mint without decimals ");
      }
    }
    const programId = this.programId;
    const provider = this.provider;

    const instructions: TransactionInstruction[] = [];
    const signers = [];
    let shouldCreateMint = false;
    if (!targetMint) {
      const targetMintKeypair = anchor.web3.Keypair.generate();
      signers.push(targetMintKeypair);
      targetMint = targetMintKeypair.publicKey;
      shouldCreateMint = true;
    }

    const [targetMintAuthority, targetMintAuthorityBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("target-authority", "utf-8"), targetMint.toBuffer()],
      programId
    );

    if (shouldCreateMint) {
      instructions.push(
        ...(await createMintInstructions(
          provider,
          targetMintAuthority,
          targetMint,
          targetMintDecimals
        ))
      );
    }

    const [tokenBonding, bumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("token-bonding", "utf-8"), targetMint.toBuffer()],
      programId
    );

    let baseStorageAuthority: PublicKey | null = null;
    let baseStorageAuthorityBumpSeed: number | null = null;
    // This is a buy/sell bonding curve. Create the program owned base storage account
    if (!baseStorage) {
      const [baseStorageAuthorityRes, baseStorageAuthorityBumpSeedRes] =
        await PublicKey.findProgramAddress(
          [Buffer.from("storage-authority", "utf-8"), tokenBonding.toBuffer()],
          programId
        );
      baseStorageAuthority = baseStorageAuthorityRes;
      baseStorageAuthorityBumpSeed = baseStorageAuthorityBumpSeedRes;

      const baseStorageKeypair = anchor.web3.Keypair.generate();
      signers.push(baseStorageKeypair);
      baseStorage = baseStorageKeypair.publicKey;

      instructions.push(
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
          baseMint,
          baseStorage,
          baseStorageAuthority
        )
      );
    }

    if (baseMint.equals(NATIVE_MINT)) {
      baseStorage = (await PublicKey.findProgramAddress(
        [Buffer.from("sol-storage", "utf-8")],
        this.programId
      ))[0];
      const baseStorageAuthorityRes = (await PublicKey.findProgramAddress(
        [Buffer.from("sol-storage-authority", "utf-8")],
        this.programId
      ));
      baseStorageAuthority = baseStorageAuthorityRes[0];
      baseStorageAuthorityBumpSeed = baseStorageAuthorityRes[1];
    }

    if (!buyTargetRoyalties) {
      buyTargetRoyalties = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        targetMint,
        buyTargetRoyaltiesOwner,
        true
      );

      if (!(await this.accountExists(buyTargetRoyalties))) {
        console.log("Creating buy target royalties...");
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            targetMint,
            buyTargetRoyalties,
            buyTargetRoyaltiesOwner,
            payer
          )
        );
      }
    }

    if (!sellTargetRoyalties) {
      sellTargetRoyalties = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        targetMint,
        sellTargetRoyaltiesOwner,
        true
      );

      if (!(await this.accountExists(sellTargetRoyalties))) {
        console.log("Creating sell target royalties...");
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            targetMint,
            sellTargetRoyalties,
            sellTargetRoyaltiesOwner,
            payer
          )
        );
      }
    }

    if (!buyBaseRoyalties) {
      buyBaseRoyalties = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        baseMint,
        buyBaseRoyaltiesOwner,
        true
      );

      if (!(await this.accountExists(buyBaseRoyalties))) {
        console.log("Creating base royalties...");
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            baseMint,
            buyBaseRoyalties,
            buyBaseRoyaltiesOwner,
            payer
          )
        );
      }
    }

    if (!sellBaseRoyalties) {
      sellBaseRoyalties = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        baseMint,
        sellBaseRoyaltiesOwner,
        true
      );

      if (!(await this.accountExists(sellBaseRoyalties))) {
        console.log("Creating base royalties...");
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            baseMint,
            sellBaseRoyalties,
            sellBaseRoyaltiesOwner,
            payer
          )
        );
      }
    }

    instructions.push(
      await this.instruction.initializeTokenBondingV0(
        {
          goLiveUnixTime: new BN(Math.floor(goLiveDate.valueOf() / 1000)),
          buyBaseRoyaltyPercentage,
          buyTargetRoyaltyPercentage,
          mintCap: mintCap || null,
          purchaseCap: purchaseCap || null,
          tokenBondingAuthority: authority,
          bumpSeed,
          baseStorageAuthority,
          baseStorageAuthorityBumpSeed,
          targetMintAuthorityBumpSeed,
          buyFrozen,
        },
        {
          accounts: {
            payer: payer,
            curve,
            tokenBonding,
            baseMint: baseMint,
            targetMint: targetMint,
            baseStorage,
            buyBaseRoyalties,
            buyTargetRoyalties,
            sellBaseRoyalties,
            sellTargetRoyalties,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    );

    return {
      output: {
        tokenBonding,
        targetMint,
        buyBaseRoyalties,
        buyTargetRoyalties,
        sellBaseRoyalties,
        sellTargetRoyalties,
      },
      instructions,
      signers,
    };
  }

  async accountExists(account: anchor.web3.PublicKey): Promise<boolean> {
    return Boolean(await this.provider.connection.getAccountInfo(account));
  }

  async createTokenBonding(args: CreateTokenBondingArgs): Promise<PublicKey> {
    const {
      output: { tokenBonding },
      instructions,
      signers,
    } = await this.createTokenBondingInstructions(args);
    await this.sendInstructions(instructions, signers);
    return tokenBonding;
  }

  async updateTokenBondingInstructions({
    tokenBonding,
    buyBaseRoyaltyPercentage,
    buyTargetRoyaltyPercentage,
    sellBaseRoyaltyPercentage,
    sellTargetRoyaltyPercentage,
    authority,
    buyFrozen,
  }: UpdateTokenBondingArgs): Promise<InstructionResult<null>> {
    const tokenBondingAcct = await this.account.tokenBondingV0.fetch(tokenBonding);
    if (!tokenBondingAcct.authority) {
      throw new Error("Cannot update a token bonding account that has no authority");
    }

    const args: IdlTypes<SplTokenBondingIDL>["UpdateTokenBondingV0Args"] = {
      buyBaseRoyaltyPercentage: buyBaseRoyaltyPercentage || tokenBondingAcct.buyBaseRoyaltyPercentage,
      buyTargetRoyaltyPercentage: buyTargetRoyaltyPercentage || tokenBondingAcct.buyTargetRoyaltyPercentage,
      sellBaseRoyaltyPercentage: sellBaseRoyaltyPercentage || tokenBondingAcct.sellBaseRoyaltyPercentage,
      sellTargetRoyaltyPercentage: sellTargetRoyaltyPercentage || tokenBondingAcct.sellTargetRoyaltyPercentage,
      tokenBondingAuthority: authority === null ? null : authority! || tokenBondingAcct.authority as PublicKey,
      buyFrozen: typeof buyFrozen === "undefined" ? tokenBondingAcct.buyFrozen as boolean : buyFrozen
    };

    return {
      output: null,
      signers: [],
      instructions: [
        await this.instruction.updateTokenBondingV0(args, {
          accounts: {
            tokenBonding,
            authority: (tokenBondingAcct.authority as PublicKey)!,
            baseMint: tokenBondingAcct.baseMint,
            targetMint: tokenBondingAcct.targetMint,
            buyTargetRoyalties: tokenBondingAcct.buyTargetRoyalties,
            buyBaseRoyalties: tokenBondingAcct.buyBaseRoyalties,
            sellTargetRoyalties: tokenBondingAcct.sellTargetRoyalties,
            sellBaseRoyalties: tokenBondingAcct.sellBaseRoyalties
          },
        }),
      ],
    };
  }

  async updateTokenBonding(args: UpdateTokenBondingArgs): Promise<void> {
    const { instructions, signers } = await this.updateTokenBondingInstructions(args);
    await this.sendInstructions(instructions, signers);
  }

  async createTemporaryWSolAccount({
    payer,
    owner,
    amount,
  }: {
    owner: PublicKey;
    payer: PublicKey;
    amount: number;
  }): Promise<{
    signer: Keypair;
    firstInstructions: TransactionInstruction[];
    lastInstructions: TransactionInstruction[];
  }> {
    const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(this.provider.connection);

    // Create a new account
    const newAccount = anchor.web3.Keypair.generate();

    return {
      firstInstructions: [
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: newAccount.publicKey,
          lamports: balanceNeeded + amount,
          space: AccountLayout.span,
          programId: TOKEN_PROGRAM_ID,
        }),
        Token.createInitAccountInstruction(
          TOKEN_PROGRAM_ID,
          NATIVE_MINT,
          newAccount.publicKey,
          owner
        ),
      ],
      lastInstructions: [
        Token.createCloseAccountInstruction(
          TOKEN_PROGRAM_ID,
          newAccount.publicKey,
          owner,
          owner,
          []
        ),
      ],
      signer: newAccount,
    };
  }

  async buyV0Instructions({
    tokenBonding,
    source,
    sourceAuthority = this.wallet.publicKey,
    destination,
    desiredTargetAmount,
    slippage,
    payer = this.wallet.publicKey
  }: BuyV0Args): Promise<InstructionResult<null>> {
    const tokenBondingAcct = await this.account.tokenBondingV0.fetch(tokenBonding);
    // @ts-ignore
    const targetMint = await getMintInfo(this.provider, tokenBondingAcct.targetMint);
    const baseMint = await getMintInfo(this.provider, tokenBondingAcct.baseMint);
    // @ts-ignore
    const curve = await this.getCurve(tokenBondingAcct.curve, baseMint, targetMint);

    const targetMintAuthority = await PublicKey.createProgramAddress(
      [
        Buffer.from("target-authority", "utf-8"),
        tokenBondingAcct.targetMint.toBuffer(),
        new BN(tokenBondingAcct.targetMintAuthorityBumpSeed).toBuffer(),
      ],
      this.programId
    );

    const instructions = [];
    const signers = [];
    if (!destination) {
      destination = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenBondingAcct.targetMint,
        sourceAuthority
      );

      if (!(await this.accountExists(destination))) {
        console.log("Creating target account");
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            tokenBondingAcct.targetMint,
            destination,
            sourceAuthority,
            payer
          )
        );
      }
    }

    const desiredTargetAmountNum = amountAsNum(desiredTargetAmount, targetMint);
    const neededAmount =
      desiredTargetAmountNum * (1 / (1 - asDecimal(tokenBondingAcct.buyTargetRoyaltyPercentage)));
    const curveAmount = curve.buyTargetAmount(
      desiredTargetAmountNum,
      tokenBondingAcct.buyBaseRoyaltyPercentage,
      tokenBondingAcct.buyTargetRoyaltyPercentage
    );
    const maxPrice = Math.ceil(curveAmount * (1 + slippage) * Math.pow(10, baseMint.decimals));

    let lastInstructions = [];
    if (!source) {
      if (tokenBondingAcct.baseMint.toBase58() === NATIVE_MINT.toBase58()) {
        const {
          signer,
          firstInstructions,
          lastInstructions: lastInstrs,
        } = await this.createTemporaryWSolAccount({
          payer: payer,
          owner: sourceAuthority,
          amount: maxPrice,
        });
        source = signer.publicKey;
        signers.push(signer);
        instructions.push(...firstInstructions);
        lastInstructions.push(...lastInstrs);
      } else {
        source = await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenBondingAcct.baseMint,
          sourceAuthority
        );

        if (!(await this.accountExists(source))) {
          throw new Error("Source account does not exist");
        }
      }
    }

    const args: IdlTypes<SplTokenBondingIDL>["BuyV0Args"] = {
      targetAmount: new BN(Math.floor(neededAmount * Math.pow(10, targetMint.decimals))),
      maximumPrice: new BN(maxPrice),
    };
    const accounts = {
      accounts: {
        tokenBonding,
        // @ts-ignore
        curve: tokenBondingAcct.curve,
        baseMint: tokenBondingAcct.baseMint,
        targetMint: tokenBondingAcct.targetMint,
        targetMintAuthority,
        baseStorage: tokenBondingAcct.baseStorage,
        buyBaseRoyalties: tokenBondingAcct.buyBaseRoyalties,
        buyTargetRoyalties: tokenBondingAcct.buyTargetRoyalties,
        source,
        sourceAuthority,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: SYSVAR_CLOCK_PUBKEY,
      },
    };
    instructions.push(await this.instruction.buyV0(args, accounts));
    instructions.push(...lastInstructions);

    return {
      output: null,
      signers,
      instructions,
    };
  }

  async buyV0(args: BuyV0Args): Promise<void> {
    const { instructions, signers } = await this.buyV0Instructions(args);
    await this.sendInstructions(instructions, signers);
  }

  async sellV0Instructions({
    tokenBonding,
    source,
    sourceAuthority = this.wallet.publicKey,
    destination,
    targetAmount,
    slippage,
    payer = this.wallet.publicKey
  }: SellV0Args): Promise<InstructionResult<null>> {
    const tokenBondingAcct = await this.account.tokenBondingV0.fetch(tokenBonding);
    if (tokenBondingAcct.sellFrozen) {
      throw new Error("Sell is frozen on this bonding curve");
    }

    // @ts-ignore
    const targetMint = await getMintInfo(this.provider, tokenBondingAcct.targetMint);
    const baseMint = await getMintInfo(this.provider, tokenBondingAcct.baseMint);
    // @ts-ignore
    const curve = await this.getCurve(tokenBondingAcct.curve, baseMint, targetMint);

    let baseStorageAuthority;
    if (tokenBondingAcct.baseMint.equals(NATIVE_MINT)) {
      baseStorageAuthority = (await PublicKey.findProgramAddress(
        [Buffer.from("sol-storage-authority", "utf-8")],
        this.programId
      ))[0];
    } else {
      baseStorageAuthority = await PublicKey.createProgramAddress(
        [
          Buffer.from("storage-authority", "utf-8"),
          tokenBonding.toBuffer(),
          new BN(tokenBondingAcct.baseStorageAuthorityBumpSeed as number).toBuffer(),
        ],
        this.programId
      );
    }

    const instructions = [];
    const signers = [];
    if (!source) {
      source = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenBondingAcct.targetMint,
        sourceAuthority
      );

      if (!(await this.accountExists(source))) {
        throw new Error("Source account does not exist");
      }
    }

    const lastInstructions = [];
    if (!destination) {
      if (tokenBondingAcct.baseMint.toBase58() === NATIVE_MINT.toBase58()) {
        const {
          signer,
          firstInstructions,
          lastInstructions: lastInstrs,
        } = await this.createTemporaryWSolAccount({
          payer,
          owner: sourceAuthority,
          amount: 0,
        });
        destination = signer.publicKey;
        signers.push(signer);
        instructions.push(...firstInstructions);
        lastInstructions.push(...lastInstrs);
      } else {
        destination = await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenBondingAcct.baseMint,
          sourceAuthority
        );

        if (!(await this.accountExists(destination))) {
          console.log("Creating base account");
          instructions.push(
            Token.createAssociatedTokenAccountInstruction(
              ASSOCIATED_TOKEN_PROGRAM_ID,
              TOKEN_PROGRAM_ID,
              tokenBondingAcct.baseMint,
              destination,
              sourceAuthority,
              payer
            )
          );
        }
      }
    }

    const targetAmountNum = amountAsNum(targetAmount, targetMint);
    const reclaimedAmount = curve.sellTargetAmount(
      targetAmountNum,
      tokenBondingAcct.sellBaseRoyaltyPercentage,
      tokenBondingAcct.sellTargetRoyaltyPercentage
    );
    const minPrice = Math.ceil(
      reclaimedAmount * (1 - slippage) * Math.pow(10, targetMint.decimals)
    );
    const args: IdlTypes<SplTokenBondingIDL>["SellV0Args"] = {
      targetAmount,
      minimumPrice: new BN(minPrice),
      
    };
    const accounts = {
      accounts: {
        tokenBonding,
        // @ts-ignore
        curve: tokenBondingAcct.curve,
        baseMint: tokenBondingAcct.baseMint,
        targetMint: tokenBondingAcct.targetMint,
        baseStorage: tokenBondingAcct.baseStorage,
        sellBaseRoyalties: tokenBondingAcct.sellBaseRoyalties,
        sellTargetRoyalties: tokenBondingAcct.sellTargetRoyalties,
        baseStorageAuthority,
        source,
        sourceAuthority,
        destination,
        tokenProgram: TOKEN_PROGRAM_ID,
        clock: SYSVAR_CLOCK_PUBKEY,
      },
    };
    instructions.push(await this.instruction.sellV0(args, accounts));
    instructions.push(...lastInstructions);

    return {
      output: null,
      signers,
      instructions,
    };
  }

  async sellV0(args: SellV0Args): Promise<void> {
    const { instructions, signers } = await this.sellV0Instructions(args);
    await this.sendInstructions(instructions, signers);
  }

  async getCurve(key: PublicKey, baseMint: MintInfo, targetMint: MintInfo): Promise<Curve> {
    const curve = await this.account.curveV0.fetch(key);
    // @ts-ignore
    return fromCurve(curve, baseMint, targetMint);
  }
}
