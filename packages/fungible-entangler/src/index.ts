import * as anchor from "@project-serum/anchor";
import { IdlTypes, Program, Provider } from "@project-serum/anchor";
import {
  AccountLayout,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import {
  Commitment,
  Keypair,
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  AnchorSdk,
  createMintInstructions,
  getMintInfo,
  getTokenAccount,
  InstructionResult,
  percent,
  SplTokenMetadata,
  TypedAccountParser,
} from "@strata-foundation/spl-utils";
import BN from "bn.js";
import {
  FungibleEntanglerIDL,
  FungibleEntanglerV0,
  FungibleChildEntanglerV0,
} from "./generated/fungible-entangler";

export * from "./generated/fungible-entangler";

type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T; // from lodash

const truthy = <T>(value: T): value is Truthy<T> => !!value;

/**
 * Unified fungible entangler interface wrapping the raw FungibleEntanglerV0
 */
export interface IFungibleEntangler extends FungibleEntanglerV0 {
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
  /** The source for the set supply (**Default:** ata of provider wallet) */
  source?: PublicKey;
  /**  The mint we will be creating an entangler for */
  mint: PublicKey;
  /** dynamicSeed used for created PDA of entangler */
  dynamicSeed: Buffer;
  /** The amount of the mint we will be entangling */
  amount: number;
  /**
   * General authority to change things like freeze swap.
   * **Default:** Wallet public key. Pass null to explicitly not set this authority.
   */
  authority?: PublicKey | null;
  /** The date this entangler will go live. Before this date, {@link FungibleEntangler.swap} is disabled. **Default:** 1 second ago */
  goLiveDate?: Date;
  /** The date this entangler will shut down. After this date, {@link FungibleEntangler.swap} is disabled. **Default:** null */
  freezeSwapDate?: Date;
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
   * **Default:** Wallet public key. Pass null to explicitly not set this authority.
   */
  authority?: PublicKey | null;
  /** The date this entangler will go live. Before this date, {@link FungibleEntangler.swap} is disabled. **Default:** 1 second ago */
  goLiveDate?: Date;
  /** The date this entangler will shut down. After this date, {@link FungibleEntangler.swap} is disabled. **Default:** null */
}

export interface ICreateFungibleChildEntanglerOutput {
  entangler: PublicKey;
  storage: PublicKey;
  mint: PublicKey;
}

interface ISwapArgs {
  payer?: PublicKey;
}

export class FungibleEntangler extends AnchorSdk<any> {
  static ID = new PublicKey("Ae6wbxtjpoKGCuSdHGQXRudmdpSfGpu6KHtjDcWEDjP8");

  static async init(
    provider: Provider,
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

  constructor(provider: Provider, program: Program<FungibleEntanglerIDL>) {
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
   * Get the PDA key of a Entangler given the mint and dynamicSeed
   *
   *
   * @param mint
   * @param dynamicSeed
   * @returns
   */
  static async fungibleEntanglerKey(
    mint: PublicKey,
    dynamicSeed: Buffer,
    programId: PublicKey = FungibleEntangler.ID
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(
      [Buffer.from("entangler", "utf-8"), mint!.toBuffer(), dynamicSeed],
      programId
    );
  }

  entanglerDecoder: TypedAccountParser<IFungibleEntangler> = (
    pubkey,
    account
  ) => {
    const coded = this.program.coder.accounts.decode<IFungibleEntangler>(
      "FungibleEntanglerV0",
      account.data
    );

    return {
      ...coded,
      publicKey: pubkey,
    };
  };

  getEntangler(entanglerKey: PublicKey): Promise<IFungibleEntangler | null> {
    return this.getAccount(entanglerKey, this.entanglerDecoder);
  }

  async createFungibleParentEntanglerInstructions({
    authority = this.provider.wallet.publicKey,
    payer = this.provider.wallet.publicKey,
    source = this.provider.wallet.publicKey,
    mint,
    dynamicSeed,
    amount,
    goLiveDate = new Date(new Date().valueOf() - 10000), // 10 secs ago
    freezeSwapDate,
  }: ICreateFungibleParentEntanglerArgs): Promise<
    InstructionResult<ICreateFungibleParentEntanglerOutput>
  > {
    const provider = this.provider;
    const instructions: TransactionInstruction[] = [];
    const signers: Keypair[] = [];

    const mintAcct = await getMintInfo(this.provider, mint);
    const sourceAcct = await this.provider.connection.getAccountInfo(source);

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

    const [entangler, bumpSeed] = await FungibleEntangler.fungibleEntanglerKey(
      mint,
      dynamicSeed
    );

    const storageKeypair = anchor.web3.Keypair.generate();
    signers.push(storageKeypair);
    const storage = storageKeypair.publicKey;

    console.log(amount);
    console.log(sourceAcctAta.amount.toNumber());

    instructions.push(
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: storage!,
        space: AccountLayout.span,
        programId: TOKEN_PROGRAM_ID,
        lamports: await provider.connection.getMinimumBalanceForRentExemption(
          AccountLayout.span
        ),
      }),
      Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,
        mint,
        storage,
        entangler
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

    instructions.push(
      await this.instruction.initializeFungibleEntanglerV0(
        {
          authority,
          entanglerSeed: dynamicSeed,
          goLiveUnixTime: new BN(Math.floor(goLiveDate.valueOf() / 1000)),
          freezeSwapUnixTime: freezeSwapDate
            ? new BN(Math.floor(freezeSwapDate.valueOf() / 1000))
            : null,
        },
        {
          accounts: {
            payer,
            entangler,
            storage,
            mint,
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

  async createFungibleChildEntanglerInstructions({}: ICreateFungibleChildEntanglerArgs): Promise<
    InstructionResult<{}>
  > {
    const publicKey = this.provider.wallet.publicKey;
    const instructions: TransactionInstruction[] = [];
    // TODO: implement

    return { instructions, signers: [], output: {} };
  }
}
