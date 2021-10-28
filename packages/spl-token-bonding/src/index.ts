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
  getTokenAccount,
} from "@project-serum/common";
import BN, { max, min } from "bn.js";
import { Program, IdlTypes, TypesCoder, Provider, IdlAccounts } from "@wum.bo/anchor";
import {
  SplTokenBondingIDL,
  TokenBondingV0,
  SplTokenBondingIDLJson,
  CurveV0,
  ProgramStateV0,
} from "./generated/spl-token-bonding";
import {
  AccountInfo,
  AccountLayout,
  NATIVE_MINT,
  MintInfo,
  TOKEN_PROGRAM_ID,
  Token,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { amountAsNum, asDecimal, Curve, fromCurve, supplyAsNum } from "./curves";
import { createMetadata, Data, InstructionResult, sendInstructions } from "@wum.bo/spl-utils";

export * from "./generated/spl-token-bonding";
export * from "./curves";

interface InitializeCurveArgs {
  curve: CurveV0;
  payer?: PublicKey;
}

export function toU128(num: number): BN {
  const [beforeDec, afteDec] = num.toString().split(".")
  if (isNaN(Number(beforeDec)) || !isFinite(Number(beforeDec))) {
    return new BN(0)
  }

  return new BN(`${beforeDec || ""}${(afteDec || "").slice(0, 12).padEnd(12, "0")}`)
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
  freezeBuyDate?: Date;
  buyFrozen?: boolean;
  index?: number; // Multiple bonding curves can exist for a given target mint. 0 is reserved for the one where the curve owns mint authority
}

interface UpdateTokenBondingArgs {
  tokenBonding: PublicKey;
  buyBaseRoyaltyPercentage?: number;
  buyTargetRoyaltyPercentage?: number;
  sellBaseRoyaltyPercentage?: number;
  sellTargetRoyaltyPercentage?: number;
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
  state: ProgramStateV0 | undefined;

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
    const exists = await this.getState();
    if (exists) {
      return {
        output: null,
        instructions: [],
        signers: []
      }
    }

    const [state, bumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("state", "utf-8")],
      this.programId
    );
    const [solStorage, solStorageBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("sol-storage", "utf-8")],
      this.programId
    );
    const [wrappedSolAuthority, mintAuthorityBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("wrapped-sol-authority", "utf-8")],
      this.programId
    );

    const instructions: TransactionInstruction[] = [];
    const signers = [];
    const mintKeypair = anchor.web3.Keypair.generate();
    signers.push(mintKeypair);

    instructions.push(...[
      SystemProgram.createAccount({
        fromPubkey: this.wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: 82,
        lamports: await this.provider.connection.getMinimumBalanceForRentExemption(82),
        programId: TOKEN_PROGRAM_ID,
      }),
      Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        mintKeypair.publicKey,
        9,
        this.wallet.publicKey,
        wrappedSolAuthority
      ),
    ])

    await createMetadata(
      new Data({
        name: 'Token Bonding Wrapped SOL',
        symbol: "twSOL",
        uri: "",
        sellerFeeBasisPoints: 0,
        // @ts-ignore
        creators: null,
      }),
      this.wallet.publicKey.toBase58(),
      mintKeypair.publicKey.toBase58(),
      this.wallet.publicKey.toBase58(),
      instructions,
      this.wallet.publicKey.toBase58()
    );

    instructions.push(Token.createSetAuthorityInstruction(
      TOKEN_PROGRAM_ID,
      mintKeypair.publicKey,
      wrappedSolAuthority,
      "MintTokens",
      this.wallet.publicKey,
      []
    ))

    instructions.push(await this.instruction.initializeSolStorageV0({
      solStorageBumpSeed,
      bumpSeed,
      mintAuthorityBumpSeed
    }, {
      accounts: {
        state,
        payer: this.wallet.publicKey,
        solStorage,
        mintAuthority: wrappedSolAuthority,
        wrappedSolMint: mintKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      }
    }))

    return {
      instructions,
      signers,
      output: null
    }
  }

  async initializeSolStorage(): Promise<void> {
    const {
      instructions,
      signers,
    } = await this.initializeSolStorageInstructions();
    if (instructions.length > 0) {
      await this.sendInstructions(instructions, signers);
    }
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

  async tokenBondingKey(targetMint: PublicKey, index: number): Promise<[PublicKey, number]> {
    const pad = Buffer.alloc(2);
    new BN(index, 16, 'le').toBuffer().copy(pad)
    return PublicKey.findProgramAddress(
      [Buffer.from("token-bonding", "utf-8"), targetMint!.toBuffer(), pad],
      this.programId
    );
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
    goLiveDate = new Date(new Date().valueOf() - 10000), // 10 seos ago
    freezeBuyDate,
    targetMintDecimals,
    buyFrozen = false,
    index
  }: CreateTokenBondingArgs): Promise<InstructionResult<{ 
    tokenBonding: PublicKey, 
    targetMint: PublicKey ,
    buyBaseRoyalties: PublicKey,
    buyTargetRoyalties: PublicKey,
    sellBaseRoyalties: PublicKey,
    sellTargetRoyalties: PublicKey,
    baseStorage: PublicKey
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
    const state = (await this.getState())!;
    if (baseMint.equals(NATIVE_MINT)) {
      baseMint = state.wrappedSolMint;
    }

    const instructions: TransactionInstruction[] = [];
    const signers = [];
    let shouldCreateMint = false;
    if (!targetMint) {
      const targetMintKeypair = anchor.web3.Keypair.generate();
      signers.push(targetMintKeypair);
      targetMint = targetMintKeypair.publicKey;
      shouldCreateMint = true;
    }

    // Find the proper bonding index to use that isn't taken.
    let indexToUse = index || 0;
    const getTokenBonding: () => Promise<[PublicKey, Number]> = () => {
      return this.tokenBondingKey(targetMint!, indexToUse);
    };
    const getTokenBondingAccount = async () => {
      return this.provider.connection.getAccountInfo((await getTokenBonding())[0]);
    };
    if (!index) {
      // Find an empty voucher account
      while (await getTokenBondingAccount()) {
        indexToUse++;
      }
    } else {
      indexToUse = index;
    }

    const [targetMintAuthority, targetMintAuthorityBumpSeed] = await PublicKey.findProgramAddress(
      [
        Buffer.from("target-authority", "utf-8"),
        targetMint!.toBuffer()
      ],
      this.programId
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

    const [tokenBonding, bumpSeed] = await this.tokenBondingKey(targetMint!, indexToUse)

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

    if (!buyTargetRoyalties) {
      buyTargetRoyalties = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        targetMint,
        buyTargetRoyaltiesOwner,
        true
      );

      // If sell target royalties are undefined, we'll do this in the next step
      if (sellTargetRoyalties && !(await this.accountExists(buyTargetRoyalties))) {
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

      // If sell base royalties are undefined, we'll do this in the next step
      if (sellBaseRoyalties && !(await this.accountExists(buyBaseRoyalties))) {
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
          index,
          goLiveUnixTime: new BN(Math.floor(goLiveDate.valueOf() / 1000)),
          freezeBuyUnixTime: freezeBuyDate ? new BN(Math.floor(freezeBuyDate.valueOf() / 1000)) : null,
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
            baseMint,
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
        baseStorage
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
    const stateAddress = (await PublicKey.findProgramAddress(
      [Buffer.from("state", "utf-8")],
      this.programId
    ))[0];

    const mintAuthority = (await PublicKey.findProgramAddress(
      [Buffer.from("wrapped-sol-authority", "utf-8")],
      this.programId
    ))[0];
    
    
    const balanceNeeded = await Token.getMinBalanceRentForExemptAccount(this.provider.connection);
    const state = (await this.getState())!;

    // Create a new account
    const newAccount = anchor.web3.Keypair.generate();

    return {
      firstInstructions: [
        SystemProgram.createAccount({
          fromPubkey: payer,
          newAccountPubkey: newAccount.publicKey,
          lamports: balanceNeeded,
          space: AccountLayout.span,
          programId: TOKEN_PROGRAM_ID,
        }),
        Token.createInitAccountInstruction(
          TOKEN_PROGRAM_ID,
          state.wrappedSolMint,
          newAccount.publicKey,
          owner
        ),
        await this.instruction.buyWrappedSolV0({
          amount: new BN(amount)
        }, {
          accounts: {
            state: stateAddress,
            wrappedSolMint: state.wrappedSolMint,
            mintAuthority: mintAuthority,
            solStorage: state.solStorage,
            source: owner,
            destination: newAccount.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId
          }
        })
      ],
      lastInstructions: [
        await this.instruction.sellWrappedSolV0({
          all: true,
          amount: new BN(amount)
        }, {
          accounts: {
            state: stateAddress,
            wrappedSolMint: state.wrappedSolMint,
            solStorage: state.solStorage,
            source: newAccount.publicKey,
            owner,
            destination: newAccount.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId
          }
        }),
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
    const state = (await this.getState())!;
    const tokenBondingAcct = await this.account.tokenBondingV0.fetch(tokenBonding);
    // @ts-ignore
    const targetMint = await getMintInfo(this.provider, tokenBondingAcct.targetMint);
    const baseMint = await getMintInfo(this.provider, tokenBondingAcct.baseMint);
    const baseStorage = await getTokenAccount(this.provider, tokenBondingAcct.baseStorage);
    // @ts-ignore
    const curve = await this.getCurve(tokenBondingAcct.curve, baseStorage, baseMint, targetMint);

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
      if (tokenBondingAcct.baseMint.equals(state.wrappedSolMint)) {
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
      // @ts-ignore
      buyTargetAmount: {
        targetAmount: new BN(Math.floor(neededAmount * Math.pow(10, targetMint.decimals))),
        maximumPrice: new BN(maxPrice),
      },
      buyWithBase: null,
      rootEstimates: curve.buyTargetAmountRootEstimates(desiredTargetAmountNum, tokenBondingAcct.buyTargetRoyaltyPercentage).map(toU128)
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

  async getState(): Promise<ProgramStateV0 | null> {
    if (this.state) {
      return this.state;
    }

    const stateAddress = (await PublicKey.findProgramAddress(
      [Buffer.from("state", "utf-8")],
      this.programId
    ))[0];
    return this.account.programStateV0.fetchNullable(stateAddress)
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
    const state = (await this.getState())!;
    const tokenBondingAcct = await this.account.tokenBondingV0.fetch(tokenBonding);
    if (tokenBondingAcct.sellFrozen) {
      throw new Error("Sell is frozen on this bonding curve");
    }

    // @ts-ignore
    const targetMint = await getMintInfo(this.provider, tokenBondingAcct.targetMint);
    const baseMint = await getMintInfo(this.provider, tokenBondingAcct.baseMint);
    const baseStorage = await getTokenAccount(this.provider, tokenBondingAcct.baseStorage);
    // @ts-ignore
    const curve = await this.getCurve(tokenBondingAcct.curve, baseStorage, baseMint, targetMint);

    let baseStorageAuthority;
    baseStorageAuthority = await PublicKey.createProgramAddress(
      [
        Buffer.from("storage-authority", "utf-8"),
        tokenBonding.toBuffer(),
        new BN(tokenBondingAcct.baseStorageAuthorityBumpSeed as number).toBuffer(),
      ],
      this.programId
    );

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
      if (tokenBondingAcct.baseMint.equals(state.wrappedSolMint)) {
        const {
          signer,
          firstInstructions,
          lastInstructions: lastInstrs,
        } = await this.createTemporaryWSolAccount({
          payer,
          owner: sourceAuthority,
          amount: 0
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
      reclaimedAmount * (1 - slippage) * Math.pow(10, baseMint.decimals)
    );
    const args: IdlTypes<SplTokenBondingIDL>["SellV0Args"] = {
      targetAmount,
      minimumPrice: new BN(minPrice),
      rootEstimates: curve.buyTargetAmountRootEstimates(targetAmountNum, tokenBondingAcct.sellTargetRoyaltyPercentage).map(toU128)
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

  async getCurve(key: PublicKey, baseStorage: AccountInfo, baseMint: MintInfo, targetMint: MintInfo): Promise<Curve> {
    const curve = await this.account.curveV0.fetch(key);
    // @ts-ignore
    return fromCurve(curve, baseStorage, baseMint, targetMint);
  }
}
