import * as anchor from '@wum.bo/anchor';
import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, Account, PublicKey, SystemProgram, Transaction, TransactionInstruction, Signer } from '@solana/web3.js';
import { createMintInstructions } from "@project-serum/common";
import BN from "bn.js"
import { Program } from '@wum.bo/anchor';
import { SplTokenStakingIDL } from './generated/spl-token-staking';
import { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';

export * from "./generated/spl-token-staking";

interface CreateTokenStakingArgs {
  authority?: PublicKey,
  baseMint: PublicKey,
  periodUnit: any,
  period: Number,
  payer?: PublicKey,
  rewardPercentPerPeriodPerLockupPeriod: Number,
}

interface StakeArgs {
  tokenStaking: PublicKey,
  amount: BN,
  lockupPeriods: BN,
  owner?: PublicKey,
  payer?: PublicKey,
  voucherNumber?: number,
}

interface InstructionResult<A> {
  instructions: TransactionInstruction[],
  signers: Signer[],
  output: A
}

export class SplTokenStaking {
  program: Program<SplTokenStakingIDL>;

  constructor(program: Program<SplTokenStakingIDL>) {
    this.program = program;
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
    return this.provider.wallet
  }

  get account() {
    return this.program.account
  }

  sendInstructions(instructions: TransactionInstruction[], signers: Signer[]): Promise<string> {
    const tx = new Transaction();
    tx.add(...instructions);
    return this.provider.send(tx, signers);
  }

  async createTokenStakingInstructions({
    authority = this.wallet.publicKey,
    payer = this.wallet.publicKey,
    baseMint,
    periodUnit,
    period,
    rewardPercentPerPeriodPerLockupPeriod
  }: CreateTokenStakingArgs): Promise<InstructionResult<{ tokenStaking: PublicKey }>> {
    const programId = this.programId;
    const provider = this.provider;
    const targetMintKeypair = anchor.web3.Keypair.generate();
    const [targetMintAuthorityRes, targetMintAuthorityBumpSeed] = await PublicKey.findProgramAddress(
      [
        Buffer.from("target-authority", "utf-8"),
        targetMintKeypair.publicKey.toBuffer()
      ], programId
    )
    const targetMintAuthority = targetMintAuthorityRes;
    const [tokenStaking, bumpSeed] = await PublicKey.findProgramAddress(
      [
        Buffer.from("token-staking", "utf-8"),
        baseMint.toBuffer(),
        targetMintKeypair.publicKey.toBuffer()
      ], programId
    )
    const tokenInstructions = await createMintInstructions(
      provider,
      targetMintAuthority,
      targetMintKeypair.publicKey,
      9
    );

    return {
      output: {
        tokenStaking,
      },
      instructions: [
        ...tokenInstructions,
        await this.instruction.initializeTokenStakingV0(
          {
            periodUnit,
            period,
            rewardPercentPerPeriodPerLockupPeriod,
            bumpSeed,
            targetMintAuthorityBumpSeed
          },
          {
            accounts: {
              payer: payer,
              baseMint: baseMint,
              targetMint: targetMintKeypair.publicKey,
              authority,
              tokenStaking,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
              clock: SYSVAR_CLOCK_PUBKEY
            }
          })
      ],
      signers: [targetMintKeypair]
    }
  }

  async createTokenStaking(args: CreateTokenStakingArgs): Promise<PublicKey> {
    const { output: { tokenStaking }, instructions, signers } = await this.createTokenStakingInstructions(args);
    await this.sendInstructions(instructions, signers);
    return tokenStaking;
  }

  async stakeInstructions({
    tokenStaking,
    amount,
    voucherNumber,
    lockupPeriods,
    owner = this.wallet.publicKey,
    payer = this.wallet.publicKey
  }: StakeArgs): Promise<InstructionResult<{ stakingVoucher: PublicKey }>> {
    const tokenStakingAccount = await this.program.account.tokenStakingV0.fetch(tokenStaking);
    let voucherNumberToUse = voucherNumber || 0;
    const getVoucher: () => Promise<[PublicKey, Number]> = () => {
      const pad = Buffer.alloc(2);
      new BN(0, 16, 'le').toBuffer().copy(pad)
      return PublicKey.findProgramAddress(
        [
          Buffer.from("stake-voucher", "utf-8"),
          owner.toBuffer(),
          tokenStaking.toBuffer(),
          pad
        ], this.programId
      )
    }
    const getVoucherAccount = async () => {
      return this.provider.connection.getAccountInfo((await getVoucher())[0]);
    }
    if (!voucherNumber) {
      // Find an empty voucher account
      while(await getVoucherAccount()) {
        voucherNumberToUse++;
      }
    } else {
      voucherNumberToUse = voucherNumber;
    }
  
    const [stakingVoucher, bumpSeed] = await getVoucher();
    const [baseHolding, holdingBumpSeed] = await PublicKey.findProgramAddress(
      [
        Buffer.from("holding", "utf-8"),
        stakingVoucher.toBuffer(),
      ], this.programId
    )
    const [baseHoldingAuthority, holdingAuthorityBumpSeed] = await PublicKey.findProgramAddress(
      [
        Buffer.from("holding-authority", "utf-8"),
        baseHolding.toBuffer()
      ], this.programId
    )
    const purchaseAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenStakingAccount.baseMint,
      owner
    )
  
    const instructions = [await this.instruction.stakeV0(
      {
        voucherNumber: voucherNumberToUse,
        baseAmount: amount,
        lockupPeriods,
        bumpSeed,
        holdingAuthorityBumpSeed,
        holdingBumpSeed
      },
      {
        accounts: {
          payer,
          baseMint: tokenStakingAccount.baseMint,
          tokenStaking: tokenStaking,
          owner,
          stakingVoucher,
          baseHoldingAuthority,
          baseHolding,
          purchaseAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          clock: SYSVAR_CLOCK_PUBKEY
        }
      }
    )]

    return {
      instructions,
      signers: [],
      output: {
        stakingVoucher
      }
    }
  }

  async stake(args: StakeArgs): Promise<PublicKey> {
    const { output: { stakingVoucher }, instructions, signers } = await this.stakeInstructions(args);
    await this.sendInstructions(instructions, signers);
    return stakingVoucher;
  }
}