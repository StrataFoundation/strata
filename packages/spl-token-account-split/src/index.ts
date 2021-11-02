import * as anchor from '@project-serum/anchor';
import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, Account, PublicKey, SystemProgram, Transaction, TransactionInstruction, Signer } from '@solana/web3.js';
import { getMintInfo, createMintInstructions, createTokenAccountInstrs, getTokenAccount } from "@project-serum/common";
import BN from "bn.js"
import { Program, Provider } from '@project-serum/anchor';
import { SplTokenAccountSplitIDL, TokenAccountSplitV0 } from './generated/spl-token-account-split';
import { MintInfo, TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { SplTokenStaking } from '@strata-foundation/spl-token-staking';
import { InstructionResult, sendInstructions } from '@strata-foundation/spl-utils';
export * from "./generated/spl-token-account-split";

interface CreateTokenAccountSplitArgs {
  payer?: PublicKey;
  slotNumber?: number;
  tokenStaking: PublicKey;
  tokenAccount?: PublicKey; // If not provided, will create an account to run the split on using mint
  mint?: PublicKey;
}

interface CollectTokenArgs {
  payer?: PublicKey; // Not necessary unless there's an ATA that needs to be created for the destination
  tokenAccountSplit: PublicKey;
  stakingRewardsAmount: BN;
  // Wallet based
  owner?: PublicKey; // Can use instead of source & destination to send to a wallet

  // Account based
  destination?: PublicKey;
  source?: PublicKey;
  sourceAuthority?: PublicKey;
}

export class SplTokenAccountSplit {
  program: Program<SplTokenAccountSplitIDL>;
  splTokenStakingProgram: SplTokenStaking;
  provider: Provider;

  constructor(provider: Provider, program: Program<SplTokenAccountSplitIDL>, splTokenStakingProgram: SplTokenStaking) {
    this.provider = provider;
    this.program = program;
    this.splTokenStakingProgram = splTokenStakingProgram;
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
    return this.provider.wallet
  }

  get account() {
    return this.program.account
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

  async createTokenAccountSplitInstructions({
    tokenAccount,
    tokenStaking,
    slotNumber,
    mint,
    payer = this.wallet.publicKey,
  }: CreateTokenAccountSplitArgs): Promise<InstructionResult<{ tokenAccountSplit: PublicKey, tokenAccount: PublicKey }>> {
    const programId = this.programId;

    let slotNumberToUse = slotNumber || 0;
    const getSplit: () => Promise<[PublicKey, Number]> = () => {
      const pad = Buffer.alloc(2);
      new BN(slotNumberToUse, 16, 'le').toBuffer().copy(pad)
      return PublicKey.findProgramAddress(
        [
          Buffer.from("token-account-split", "utf-8"),
          tokenStaking.toBuffer(),
          pad
        ], this.programId
      )
    }
    const getSplitAccount = async () => {
      return this.provider.connection.getAccountInfo((await getSplit())[0]);
    }
    if (!slotNumber) {
      // Find an empty Split account
      while(await getSplitAccount()) {
        slotNumberToUse++;
      }
    } else {
      slotNumberToUse = slotNumber;
    }
    const [tokenAccountSplit, bumpSeed] = await getSplit();

    const instructions = [];
    const signers = [];
    let shouldCreateTokenAccount = false;
    if (!tokenAccount) {
      const account = anchor.web3.Keypair.generate();
      tokenAccount = account.publicKey;
      shouldCreateTokenAccount = true;
      signers.push(account);
    }
    const [tokenAccountAuthority, tokenAccountAuthorityBumpSeed] = await PublicKey.findProgramAddress(
      [
        Buffer.from("token-account-authority", "utf-8"),
        tokenAccount.toBuffer(),
      ], programId
    )

    if (shouldCreateTokenAccount && mint) {
      instructions.push(
        ...(await createTokenAccountInstrs(
          this.provider,
          tokenAccount,
          mint,
          tokenAccountAuthority
        ))
      )
    }

    instructions.push(
      await this.instruction.initializeTokenAccountSplitV0(
        {
          slotNumber,
          tokenAccountAuthorityBumpSeed,
          bumpSeed
        },
        {
          accounts: {
            tokenAccountSplit,
            payer,
            tokenAccount,
            tokenStaking,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          }
        })
    )

    return {
      output: {
        tokenAccountSplit,
        tokenAccount
      },
      instructions,
      signers
    }
  }

  async createTokenAccountSplit(args: CreateTokenAccountSplitArgs): Promise<{ tokenAccountSplit: PublicKey, tokenAccount: PublicKey }> {
    const { output, instructions, signers } = await this.createTokenAccountSplitInstructions(args);
    await this.sendInstructions(instructions, signers);
    return output;
  }

  async collectTokensInstructions({
    tokenAccountSplit,
    stakingRewardsAmount,
    payer = this.wallet.publicKey,
    owner = this.wallet.publicKey,
    source,
    destination,
    sourceAuthority = this.wallet.publicKey
  }: CollectTokenArgs): Promise<InstructionResult<null>> {
    const tokenAccountSplitAcct = await this.account.tokenAccountSplitV0.fetch(tokenAccountSplit);
    const tokenStakingAcct = await this.splTokenStakingProgram.account.tokenStakingV0.fetch(tokenAccountSplitAcct.tokenStaking);
    const tokenAccount = await getTokenAccount(this.provider, tokenAccountSplitAcct.tokenAccount);

    const instructions = [];
    if (!destination) {
      destination = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenAccount.mint,
        owner
      );
      instructions.push(Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenAccount.mint,
        destination,
        owner,
        payer
      ))
    }

    if (!source) {
      source = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenStakingAcct.targetMint,
        owner
      );
    }

    const tokenAccountAuthority = await PublicKey.createProgramAddress(
      [
        Buffer.from("token-account-authority", "utf-8"),
        tokenAccountSplitAcct.tokenAccount.toBuffer(),
        new BN(tokenAccountSplitAcct.tokenAccountAuthorityBumpSeed).toBuffer()
      ],
      this.programId
    )

    instructions.push(
      await this.instruction.collectTokensV0({
        stakingRewardsAmount
      }, {
        accounts: {
          tokenAccountSplit,
          tokenAccount: tokenAccountSplitAcct.tokenAccount,
          tokenAccountAuthority,
          tokenStaking: tokenAccountSplitAcct.tokenStaking,
          targetMint: tokenStakingAcct.targetMint,
          stakingRewardsSource: source,
          stakingRewardsAuthority: sourceAuthority,
          destination,
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: SYSVAR_CLOCK_PUBKEY
        }
      })
    )
    
    return {
      instructions,
      signers: [],
      output: null
    }
  }

  async collectTokens(args: CollectTokenArgs): Promise<void> {
    const { instructions, signers } = await this.collectTokensInstructions(args);
    await this.sendInstructions(instructions, signers);
  }
}