import * as anchor from "@project-serum/anchor";
import { IdlTypes, Program, AnchorProvider } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import {
  Commitment,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  AnchorSdk,
  getMintInfo,
  getTokenAccount,
  InstructionResult,
  TypedAccountParser,
} from "@strata-foundation/spl-utils";
import BN from "bn.js";
import {
  FungibleEntanglerIDL,
  FungibleParentEntanglerV0,
  FungibleChildEntanglerV0,
} from "./generated/fungible-entangler";
import { toBN, toNumber } from "./utils";

export * from "./generated/fungible-entangler";

type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T; // from lodash

const truthy = <T>(value: T): value is Truthy<T> => !!value;
const encode = anchor.utils.bytes.utf8.encode;

/**
 * Unified fungible entangler interface wrapping the raw FungibleEntanglerV0
 */
export interface IFungibleParentEntangler extends FungibleParentEntanglerV0 {
  publicKey: PublicKey;
}

/**
 * Unified fungible child entangler interface wrapping the raw FungibleChildEntanglerV0*
 */
export interface IFungibleChildEntangler extends FungibleChildEntanglerV0 {
  publicKey: PublicKey;
}

interface ICreateFungibleParentEntanglerArgs {
  payer?: PublicKey;
  /** The source for the amount (**Default:** ata of provider wallet) */
  source?: PublicKey;
  /**  The mint we will be creating an entangler for */
  mint: PublicKey;
  /** dynamicSeed used for created PDA of entangler */
  dynamicSeed: Buffer;
  /** The amount of the mint we will be entangling */
  amount: BN | number;
  /**
   * General authority to change things like freeze swap.
   * **Default:** Wallet public key
   */
  authority?: PublicKey;
  /** The date this entangler will go live. Before this date, {@link FungibleEntangler.swap} is disabled. **Default:** 1 second ago */
  goLiveDate?: Date | number;
  /** The date this entangler will shut down. After this date, {@link FungibleEntangler.swap} is disabled. **Default:** null */
  freezeSwapDate?: Date | number;
}

export interface ICreateFungibleParentEntanglerOutput {
  entangler: PublicKey;
  storage: PublicKey;
  mint: PublicKey;
}

interface ICreateFungibleChildEntanglerArgs {
  payer?: PublicKey;
  /** The parent entangler this child will be associated to */
  parentEntangler: PublicKey;
  /** The mint we will be creating an entangler for */
  mint: PublicKey;
  /**
   * General authority to change things like freeze swap.
   * **Default:** Wallet public key
   */
  authority?: PublicKey;
  /** The date this entangler will go live. Before this date, {@link FungibleEntangler.swap} is disabled. **Default:** 1 second ago */
  goLiveDate?: Date | number;
  /** The date this entangler will shut down. After this date, {@link FungibleEntangler.swap} is disabled. **Default:** null */
  freezeSwapDate?: Date | number;
}

export interface ICreateFungibleChildEntanglerOutput {
  entangler: PublicKey;
  storage: PublicKey;
  mint: PublicKey;
}

export interface ICreateFungibleEntanglerArgs {
  payer?: PublicKey;
  /** The source for the set supply (**Default:** ata of provider wallet) */
  source?: PublicKey;
  /** dynamicSeed used for created PDA of parentEntangler */
  dynamicSeed: Buffer;
  /** The amount of the mint we will be entangling */
  amount: number;
  /** The mint we will be creating a parentEntangler for */
  parentMint: PublicKey;
  /** The mint we will be creating a parentEntangler for */
  childMint: PublicKey;
  /**
   * General authority to change things like freeze swap.
   * **Default:** Wallet public key
   */
  authority?: PublicKey;
  /** The date this entangler will go live. Before this date, {@link FungibleEntangler.swap} is disabled. **Default:** 1 second ago */
  parentGoLiveDate?: Date | number;
  /** The date this entangler will shut down. After this date, {@link FungibleEntangler.swap} is disabled. **Default:** null */
  parentFreezeSwapDate?: Date | number;
  /** The date this entangler will go live. Before this date, {@link FungibleEntangler.swap} is disabled. **Default:** 1 second ago */
  childGoLiveDate?: Date | number;
  /** The date this entangler will shut down. After this date, {@link FungibleEntangler.swap} is disabled. **Default:** null */
  childFreezeSwapDate?: Date | number;
}

export interface ICreateFungibleEntanglerOutput {
  parentEntangler: PublicKey;
  parentStorage: PublicKey;
  parentMint: PublicKey;
  childEntangler: PublicKey;
  childStorage: PublicKey;
  childMint: PublicKey;
}

interface ISwapArgs {
  parentEntangler: PublicKey;
  childEntangler: PublicKey;
  payer?: PublicKey;
  /** The source for the swap (**Default:** ata of provider wallet) */
  source?: PublicKey;
  /** The wallet funding the swap. (**Default:** Provider wallet) */
  sourceAuthority?: PublicKey;
  /** The source destination to purchase to. (**Default:** ata of `sourceAuthority`) */
  destination?: PublicKey;
}

interface ICloseArgs {
  refund?: PublicKey;
}

interface ICloseArgsParent extends ICloseArgs {
  parentEntangler: PublicKey;
}

interface ICloseArgsChild extends ICloseArgs {
  childEntangler: PublicKey;
}

type CloseArgs = ICloseArgsParent | ICloseArgsChild;

interface ITransferArgs {
  payer?: PublicKey;
  /** The amount of tokens */
  amount: number | BN;

  /** The destination wallet. **Default:** this wallet */
  destinationWallet?: PublicKey;
  /** The destination ata acct. **Default:** this wallet ata */
  destination?: PublicKey;
}

interface ITransferArgsParent extends ITransferArgs {
  parentEntangler: PublicKey;
}

interface ITransferArgsChild extends ITransferArgs {
  childEntangler: PublicKey;
}

type TransferArgs = ITransferArgsChild | ITransferArgsParent;

interface ISwapArgsAll extends ISwapArgs {
  all: boolean;
}

interface ISwapArgsAmount extends ISwapArgs {
  amount: BN | number;
}

type SwapArgs = ISwapArgsAmount | ISwapArgsAll;

export type ISwapParentForChildArgs = SwapArgs & {};
export type ISwapChildForParentArgs = SwapArgs & {};

interface ITopOffArgs {
  payer?: PublicKey;
  /** The source for the swap (**Default:** ata of provider wallet) */
  source?: PublicKey;
  /** The wallet funding the swap. (**Default:** Provider wallet) */
  sourceAuthority?: PublicKey;
  amount: BN | number;
}

interface ITopOffArgsParent extends ITopOffArgs {
  parentEntangler: PublicKey;
}

interface ITopOffArgsChild extends ITopOffArgs {
  childEntangler: PublicKey;
}

type TopOffArgs = ITopOffArgsParent | ITopOffArgsChild;

export class FungibleEntangler extends AnchorSdk<FungibleEntanglerIDL> {
  static ID = new PublicKey("fent99TYZcj9PGbeooaZXEMQzMd7rz8vYFiudd8HevB");

  static async init(
    provider: AnchorProvider,
    fungibleEntanglerProgramId: PublicKey = FungibleEntangler.ID
  ): Promise<FungibleEntangler> {
    const FungibleEntanglerIDLJson = await anchor.Program.fetchIdl(
      fungibleEntanglerProgramId,
      provider
    );

    const fungibleEntangler = new anchor.Program<FungibleEntanglerIDL>(
      FungibleEntanglerIDLJson as FungibleEntanglerIDL,
      fungibleEntanglerProgramId,
      provider
    ) as anchor.Program<FungibleEntanglerIDL>;

    return new this(provider, fungibleEntangler);
  }

  constructor(
    provider: AnchorProvider,
    program: Program<FungibleEntanglerIDL>
  ) {
    super({ provider, program });
  }

  /**
   * General utility function to check if an account exists
   * @param account
   * @returns
   */
  async accountExists(account: anchor.web3.PublicKey): Promise<boolean> {
    return Boolean(await this.provider.connection.getAccountInfo(account));
  }

  /**
   * Get the PDA key of a Parent Entangler given the mint and dynamicSeed
   *
   *
   * @param mint
   * @param dynamicSeed
   * @returns
   */
  static async fungibleParentEntanglerKey(
    mint: PublicKey,
    dynamicSeed: Buffer,
    programId: PublicKey = FungibleEntangler.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [encode("entangler"), mint.toBuffer(), dynamicSeed],
      programId
    );
  }

  /**
   * Get the PDA key of a Child Entangler given the mint and parentEntangler
   *
   *
   * @param mint
   * @param parentEntangler
   * @returns
   */
  static async fungibleChildEntanglerKey(
    parentEntangler: PublicKey,
    mint: PublicKey,
    programId: PublicKey = FungibleEntangler.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [encode("entangler"), parentEntangler.toBuffer(), mint.toBuffer()],
      programId
    );
  }

  /**
   * Get the PDA key of a Entangler storage given the entangler
   *
   *
   * @param entangler
   * @returns
   */
  static async storageKey(
    entangler: PublicKey,
    programId: PublicKey = FungibleEntangler.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [encode("storage"), entangler.toBuffer()],
      programId
    );
  }

  parentEntanglerDecoder: TypedAccountParser<IFungibleParentEntangler> = (
    pubkey,
    account
  ) => {
    const coded = this.program.coder.accounts.decode<IFungibleParentEntangler>(
      "FungibleParentEntanglerV0",
      account.data
    );

    return {
      ...coded,
      publicKey: pubkey,
    };
  };

  getParentEntangler(
    entanglerKey: PublicKey
  ): Promise<IFungibleParentEntangler | null> {
    return this.getAccount(entanglerKey, this.parentEntanglerDecoder);
  }

  childEntanglerDecoder: TypedAccountParser<
    IFungibleChildEntangler | undefined
  > = (pubkey, account) => {
    try {
      const coded = this.program.coder.accounts.decode<IFungibleChildEntangler>(
        "FungibleChildEntanglerV0",
        account.data
      );
      return {
        ...coded,
        publicKey: pubkey,
      };
    } catch (err) {
      return undefined;
    }
  };

  getChildEntangler(
    entanglerKey: PublicKey
  ): Promise<IFungibleChildEntangler | null | undefined> {
    return this.getAccount(entanglerKey, this.childEntanglerDecoder);
  }

  async getUnixTime(): Promise<number> {
    const acc = await this.provider.connection.getAccountInfo(
      SYSVAR_CLOCK_PUBKEY
    );
    return Number(acc!.data.readBigInt64LE(8 * 4));
  }

  async createFungibleParentEntanglerInstructions({
    authority = this.provider.wallet.publicKey,
    payer = this.provider.wallet.publicKey,
    source = this.provider.wallet.publicKey,
    mint,
    dynamicSeed,
    amount,
    goLiveDate,
    freezeSwapDate,
  }: ICreateFungibleParentEntanglerArgs): Promise<
    InstructionResult<ICreateFungibleParentEntanglerOutput>
  > {
    if (!goLiveDate) {
      goLiveDate = new Date(0).setUTCSeconds((await this.getUnixTime()) - 60);
    }

    const mintAcct = await getMintInfo(this.provider, mint);
    const sourceAcct = await this.provider.connection.getAccountInfo(source);
    amount = toNumber(amount, mintAcct);

    // Source is a wallet, need to get the ATA
    if (!sourceAcct || sourceAcct.owner.equals(SystemProgram.programId)) {
      const ataSource = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        payer,
        true
      );

      if (!(await this.accountExists(ataSource))) {
        throw new Error(
          `Owner of ${payer?.toBase58()} does not hold any ${mint.toBase58()} tokens`
        );
      }

      source = ataSource;
    }

    const sourceAcctAta = await getTokenAccount(this.provider, source);
    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [];

    const [entangler, _entanglerBump] =
      await FungibleEntangler.fungibleParentEntanglerKey(mint, dynamicSeed);

    const [storage, _storageBump] = await FungibleEntangler.storageKey(
      entangler
    );

    instructions.push(
      await this.instruction.initializeFungibleParentEntanglerV0(
        {
          authority,
          dynamicSeed,
          goLiveUnixTime: new BN(Math.floor(goLiveDate.valueOf() / 1000)),
          freezeSwapUnixTime: freezeSwapDate
            ? new BN(Math.floor(freezeSwapDate.valueOf() / 1000))
            : null,
        },
        {
          accounts: {
            payer,
            entangler,
            parentStorage: storage,
            parentMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
            clock: SYSVAR_CLOCK_PUBKEY,
          },
        }
      ),
      Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        source,
        storage,
        sourceAcctAta.owner,
        [],
        new u64(
          (amount * Math.pow(10, mintAcct.decimals)).toLocaleString(
            "fullwide",
            {
              useGrouping: false,
            }
          )
        )
      )
    );

    return {
      instructions,
      signers,
      output: {
        entangler,
        storage,
        mint,
      },
    };
  }

  async createFungibleParentEntangler(
    args: ICreateFungibleParentEntanglerArgs,
    commitment: Commitment = "confirmed"
  ): Promise<ICreateFungibleParentEntanglerOutput> {
    return this.execute(
      this.createFungibleParentEntanglerInstructions(args),
      args.payer,
      commitment
    );
  }

  async createFungibleChildEntanglerInstructions({
    authority = this.provider.wallet.publicKey,
    payer = this.provider.wallet.publicKey,
    parentEntangler,
    mint,
    goLiveDate,
    freezeSwapDate,
  }: ICreateFungibleChildEntanglerArgs): Promise<
    InstructionResult<ICreateFungibleChildEntanglerOutput>
  > {
    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [];

    if (!goLiveDate) {
      goLiveDate = new Date(0).setUTCSeconds((await this.getUnixTime()) - 60);
    }

    const [entangler, _entanglerBump] =
      await FungibleEntangler.fungibleChildEntanglerKey(parentEntangler, mint);

    const [storage, _storageBump] = await FungibleEntangler.storageKey(
      entangler
    );

    instructions.push(
      await this.instruction.initializeFungibleChildEntanglerV0(
        {
          goLiveUnixTime: new BN(Math.floor(goLiveDate.valueOf() / 1000)),
          freezeSwapUnixTime: freezeSwapDate
            ? new BN(Math.floor(freezeSwapDate.valueOf() / 1000))
            : null,
        },
        {
          accounts: {
            payer,
            parentEntangler,
            entangler,
            authority: authority!,
            childStorage: storage,
            childMint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
            clock: SYSVAR_CLOCK_PUBKEY,
          },
        }
      )
    );

    return {
      instructions,
      signers,
      output: {
        entangler,
        storage,
        mint,
      },
    };
  }

  async createFungibleChildEntangler(
    args: ICreateFungibleChildEntanglerArgs,
    commitment: Commitment = "confirmed"
  ): Promise<ICreateFungibleChildEntanglerOutput> {
    return this.execute(
      this.createFungibleChildEntanglerInstructions(args),
      args.payer,
      commitment
    );
  }

  async createFungibleEntanglerInstructions({
    authority = this.provider.wallet.publicKey,
    payer = this.provider.wallet.publicKey,
    source = this.provider.wallet.publicKey,
    dynamicSeed = Keypair.generate().publicKey.toBuffer(),
    amount,
    parentMint,
    childMint,
    parentGoLiveDate,
    parentFreezeSwapDate,
    childGoLiveDate,
    childFreezeSwapDate,
  }: ICreateFungibleEntanglerArgs): Promise<
    InstructionResult<ICreateFungibleEntanglerOutput>
  > {
    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [];

    if (!parentGoLiveDate) {
      parentGoLiveDate = new Date(0).setUTCSeconds(
        (await this.getUnixTime()) - 60
      );
    }

    if (!childGoLiveDate) {
      childGoLiveDate = new Date(0).setUTCSeconds(
        (await this.getUnixTime()) - 60
      );
    }

    const {
      instructions: parentInstructions,
      signers: parentSigners,
      output: parentOutput,
    } = await this.createFungibleParentEntanglerInstructions({
      authority,
      payer,
      source,
      dynamicSeed,
      amount,
      mint: parentMint,
      goLiveDate: parentGoLiveDate,
      freezeSwapDate: parentFreezeSwapDate,
    });

    const {
      instructions: childInstructions,
      signers: childSigners,
      output: childOutput,
    } = await this.createFungibleChildEntanglerInstructions({
      authority,
      payer,
      parentEntangler: parentOutput.entangler,
      mint: childMint,
      goLiveDate: childGoLiveDate,
      freezeSwapDate: childFreezeSwapDate,
    });

    instructions.push(...parentInstructions, ...childInstructions);

    return {
      instructions,
      signers,
      output: {
        parentEntangler: parentOutput.entangler,
        parentStorage: parentOutput.storage,
        parentMint: parentOutput.mint,
        childEntangler: childOutput.entangler,
        childStorage: childOutput.storage,
        childMint: childOutput.mint,
      },
    };
  }

  async createFungibleEntangler(
    args: ICreateFungibleEntanglerArgs,
    commitment: Commitment = "confirmed"
  ): Promise<ICreateFungibleEntanglerOutput> {
    return this.execute(
      this.createFungibleEntanglerInstructions(args),
      args.payer,
      commitment
    );
  }

  async swapParentForChildInstructions({
    payer = this.wallet.publicKey,
    source,
    sourceAuthority = this.wallet.publicKey,
    parentEntangler,
    childEntangler,
    destination,
    ...rest
  }: ISwapParentForChildArgs): Promise<InstructionResult<null>> {
    let { amount, all } = { amount: null, all: null, ...rest };
    const parentAcct = (await this.getParentEntangler(parentEntangler))!;
    const childAcct = (await this.getChildEntangler(childEntangler))!;
    const parentMint = await getMintInfo(this.provider, parentAcct.parentMint);
    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [];

    if (!destination) {
      destination = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        childAcct.childMint,
        sourceAuthority,
        true
      );

      if (!(await this.accountExists(destination))) {
        console.log(`Creating child ${childAcct.childMint.toBase58()} account`);
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            childAcct.childMint,
            destination,
            sourceAuthority,
            payer
          )
        );
      }
    }

    if (!source) {
      source = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        parentAcct.parentMint,
        sourceAuthority,
        true
      );

      if (!(await this.accountExists(source))) {
        console.warn(
          "Source account for swap does not exist, if it is not created in an earlier instruction this can cause an error"
        );
      }
    }

    if (amount) {
      amount = toBN(amount, parentMint);
    }

    const args: IdlTypes<FungibleEntanglerIDL>["SwapV0Args"] = {
      // @ts-ignore
      amount,
      // @ts-ignore
      all,
    };

    instructions.push(
      await this.instruction.swapParentForChildV0(args, {
        accounts: {
          common: {
            parentEntangler,
            parentStorage: parentAcct.parentStorage,
            childEntangler,
            childStorage: childAcct.childStorage,
            source,
            sourceAuthority,
            destination,
            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY,
          },
        },
      })
    );

    return {
      instructions,
      signers,
      output: null,
    };
  }

  async swapParentForChild(
    args: ISwapParentForChildArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(
      this.swapParentForChildInstructions(args),
      args.payer,
      commitment
    );
  }

  async swapChildForParentInstructions({
    payer = this.wallet.publicKey,
    source,
    sourceAuthority = this.wallet.publicKey,
    parentEntangler,
    childEntangler,
    destination,
    ...rest
  }: ISwapChildForParentArgs): Promise<InstructionResult<null>> {
    let { amount, all } = { amount: null, all: null, ...rest };
    const parentAcct = (await this.getParentEntangler(parentEntangler))!;
    const childAcct = (await this.getChildEntangler(childEntangler))!;
    const childMint = await getMintInfo(this.provider, childAcct.childMint);
    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [];

    if (!destination) {
      destination = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        parentAcct.parentMint,
        sourceAuthority,
        true
      );

      if (!(await this.accountExists(destination))) {
        console.log(
          `Creating parent ${parentAcct.parentMint.toBase58()} account`
        );
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            parentAcct.parentMint,
            destination,
            sourceAuthority,
            payer
          )
        );
      }
    }

    if (amount) {
      amount = toBN(amount, childMint);
    }

    if (!source) {
      source = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        childAcct.childMint,
        sourceAuthority,
        true
      );

      if (!(await this.accountExists(source))) {
        console.warn(
          "Source account for swap does not exist, if it is not created in an earlier instruction this can cause an error"
        );
      }
    }

    const args: IdlTypes<FungibleEntanglerIDL>["SwapV0Args"] = {
      // @ts-ignore
      amount,
      // @ts-ignore
      all,
    };

    instructions.push(
      await this.instruction.swapChildForParentV0(args, {
        accounts: {
          common: {
            parentEntangler,
            parentStorage: parentAcct.parentStorage,
            childEntangler,
            childStorage: childAcct.childStorage,
            source,
            sourceAuthority,
            destination,
            tokenProgram: TOKEN_PROGRAM_ID,
            clock: SYSVAR_CLOCK_PUBKEY,
          },
        },
      })
    );

    return {
      instructions,
      signers,
      output: null,
    };
  }

  async swapChildForParent(
    args: ISwapChildForParentArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(
      this.swapChildForParentInstructions(args),
      args.payer,
      commitment
    );
  }

  async topOffInstructions({
    payer = this.wallet.publicKey,
    source,
    sourceAuthority = this.wallet.publicKey,
    amount,
    ...rest
  }: TopOffArgs): Promise<InstructionResult<null>> {
    const { parentEntangler, childEntangler } = {
      parentEntangler: null,
      childEntangler: null,
      ...rest,
    };

    const entanglerAcct = parentEntangler
      ? await this.getParentEntangler(parentEntangler!)!
      : await this.getChildEntangler(childEntangler!)!;

    const mint = parentEntangler
      ? (entanglerAcct as IFungibleParentEntangler).parentMint
      : (entanglerAcct as IFungibleChildEntangler).childMint;

    const mintAcct = await getMintInfo(this.provider, mint);
    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [];

    if (!source) {
      source = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        sourceAuthority,
        true
      );

      if (!(await this.accountExists(source))) {
        console.warn(
          "Source account for swap does not exist, if it is not created in an earlier instruction this can cause an error"
        );
      }
    }

    const sourceAcctAta = await getTokenAccount(this.provider, source);
    amount = toNumber(amount, mintAcct);

    instructions.push(
      Token.createTransferInstruction(
        TOKEN_PROGRAM_ID,
        source,
        parentEntangler
          ? (entanglerAcct as IFungibleParentEntangler).parentStorage
          : (entanglerAcct as IFungibleChildEntangler).childStorage,
        sourceAcctAta.owner,
        [],
        new u64(
          (amount * Math.pow(10, mintAcct.decimals)).toLocaleString(
            "fullwide",
            {
              useGrouping: false,
            }
          )
        )
      )
    );

    return {
      instructions,
      signers,
      output: null,
    };
  }

  async topOff(
    args: TopOffArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(this.topOffInstructions(args), args.payer, commitment);
  }

  async transferInstructions({
    payer = this.wallet.publicKey,
    amount,
    destination,
    destinationWallet = this.wallet.publicKey,
    ...rest
  }: TransferArgs): Promise<InstructionResult<null>> {
    let { parentEntangler, childEntangler } = {
      parentEntangler: null,
      childEntangler: null,
      ...rest,
    };
    const isTransferChild = childEntangler !== null;

    const childEntanglerAcct = childEntangler
      ? await this.getChildEntangler(childEntangler)
      : null;
    parentEntangler = (parentEntangler ||
      (childEntanglerAcct && childEntanglerAcct.parentEntangler))!;
    const parentEntanglerAcct = await this.getParentEntangler(parentEntangler);

    const mint = isTransferChild
      ? childEntanglerAcct!.childMint
      : parentEntanglerAcct!.parentMint;

    const mintAcct = await getMintInfo(this.provider, mint);

    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [];

    const destAcct =
      destination &&
      (await this.provider.connection.getAccountInfo(destination));

    // Destination is a wallet, need to get the ATA
    if (!destAcct || destAcct.owner.equals(SystemProgram.programId)) {
      const ataDestination = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        destinationWallet,
        false // Explicitly don't allow owner off curve. You need to pass destination as an already created thing to do this
      );
      if (!(await this.accountExists(ataDestination))) {
        instructions.push(
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            mint,
            ataDestination,
            destinationWallet,
            payer
          )
        );
      }

      destination = ataDestination;
    }

    if (isTransferChild) {
      instructions.push(
        await this.instruction.transferChildStorageV0(
          {
            amount: toBN(amount, mintAcct),
          },
          {
            accounts: {
              authority: parentEntanglerAcct!.authority!,
              parentEntangler,
              entangler: childEntangler!,
              childStorage: childEntanglerAcct!.childStorage,
              destination: destination!,
              tokenProgram: TOKEN_PROGRAM_ID,
            },
          }
        )
      );
    } else {
      instructions.push(
        await this.instruction.transferParentStorageV0(
          {
            amount: toBN(amount, mintAcct),
          },
          {
            accounts: {
              authority: parentEntanglerAcct!.authority!,
              parentEntangler,
              parentStorage: parentEntanglerAcct!.parentStorage,
              destination: destination!,
              tokenProgram: TOKEN_PROGRAM_ID,
            },
          }
        )
      );
    }

    return {
      instructions,
      signers,
      output: null,
    };
  }

  async transfer(
    args: TransferArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(this.transferInstructions(args), args.payer, commitment);
  }

  async closeInstructions({
    refund = this.wallet.publicKey,
    ...rest
  }: CloseArgs): Promise<InstructionResult<null>> {
    let { parentEntangler, childEntangler } = {
      parentEntangler: null,
      childEntangler: null,
      ...rest,
    };
    const isCloseChild = childEntangler !== null;

    const childEntanglerAcct = childEntangler
      ? await this.getChildEntangler(childEntangler)
      : null;
    parentEntangler = (parentEntangler ||
      (childEntanglerAcct && childEntanglerAcct.parentEntangler))!;
    const parentEntanglerAcct = await this.getParentEntangler(parentEntangler);

    const mint = isCloseChild
      ? childEntanglerAcct!.childMint
      : parentEntanglerAcct!.parentMint;

    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [];

    if (isCloseChild) {
      instructions.push(
        await this.instruction.closeFungibleChildEntanglerV0({
          accounts: {
            refund,
            authority: parentEntanglerAcct!.authority!,
            parentEntangler,
            entangler: childEntangler!,
            childStorage: childEntanglerAcct!.childStorage,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        })
      );
    } else {
      instructions.push(
        await this.instruction.closeFungibleParentEntanglerV0({
          accounts: {
            refund,
            authority: parentEntanglerAcct!.authority!,
            parentEntangler,
            parentStorage: parentEntanglerAcct!.parentStorage,
            tokenProgram: TOKEN_PROGRAM_ID,
          },
        })
      );
    }

    return {
      instructions,
      signers,
      output: null,
    };
  }

  async close(
    args: CloseArgs,
    commitment: Commitment = "confirmed"
  ): Promise<void> {
    await this.execute(this.closeInstructions(args), args.refund, commitment);
  }
}
