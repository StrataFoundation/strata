import * as anchor from "@wum.bo/anchor";
import {
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  Signer,
} from "@solana/web3.js";
import { getMintInfo, createMintInstructions } from "@project-serum/common";
import BN from "bn.js";
import { Program, Provider } from "@wum.bo/anchor";
import { PeriodUnit, SplTokenStakingIDL, TokenStakingV0 } from "./generated/spl-token-staking";
import { MintInfo, TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { InstructionResult, sendInstructions } from "@wum.bo/spl-utils";

export * from "./generated/spl-token-staking";

interface CreateTokenStakingArgs {
  authority?: PublicKey;
  baseMint: PublicKey;
  periodUnit: any;
  period: number;
  payer?: PublicKey;
  rewardPercentPerPeriodPerLockupPeriod: number;
  targetMintDecimals: number;
}

interface StakeArgs {
  tokenStaking: PublicKey;
  amount: BN;
  lockupPeriods: BN;
  owner?: PublicKey;
  payer?: PublicKey;
  voucherNumber?: number;
}

interface UnstakeArgs {
  tokenStaking: PublicKey;
  stakingVoucher: PublicKey;
}

interface CollectArgs {
  payer?: PublicKey; // Not necessary unless there's an ATA that needs to be created for the destination
  tokenStaking: PublicKey;
  stakingVoucher: PublicKey;
}

export class SplTokenStaking {
  program: Program<SplTokenStakingIDL>;
  provider: Provider;

  constructor(provider: Provider, program: Program<SplTokenStakingIDL>) {
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

  get defaults(): {
    periodUnit: PeriodUnit;
    period: number;
    targetMintDecimals: number;
    rewardPercentPerPeriodPerLockupPeriod: number;
  } {
    return {
      periodUnit: PeriodUnit.SECOND,
      period: 5,
      targetMintDecimals: 9,
      rewardPercentPerPeriodPerLockupPeriod: 4294967295, // 100%
    };
  }

  static PERIOD_MULTIPLIERS: Record<string, number> = {
    second: 1,
    minute: 60,
    hour: 60 * 60,
    day: 60 * 60 * 24,
    year: 60 * 60 * 24 * 365,
  };

  getPeriod(staking: TokenStakingV0, unixTs: number): number {
    const multiplier =
      staking.period * SplTokenStaking.PERIOD_MULTIPLIERS[Object.keys(staking.periodUnit)[0]];
    return Math.floor((unixTs - staking.createdTimestamp.toNumber()) / multiplier);
  }

  getTotalTargetSupply(targetMint: MintInfo, staking: TokenStakingV0): number {
    return (
      targetMint.supply.toNumber() +
      staking.targetAmountUnredeemed.toNumber() +
      staking.targetAmountPerPeriod.toNumber() *
        (this.getPeriod(staking, Date.now() / 1000) -
          this.getPeriod(staking, staking.lastCalculatedTimestamp.toNumber()))
    );
  }

  async getTotalTargetSupplyFromKey(tokenStaking: PublicKey): Promise<number> {
    const staking = await this.account.tokenStakingV0.fetch(tokenStaking);
    const mintInfo = await getMintInfo(this.provider, staking.targetMint);
    // @ts-ignore
    return this.getTotalTargetSupply(mintInfo, staking);
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

  async createTokenStakingInstructions({
    authority,
    payer = this.wallet.publicKey,
    baseMint,
    periodUnit,
    period,
    rewardPercentPerPeriodPerLockupPeriod,
    targetMintDecimals,
  }: CreateTokenStakingArgs): Promise<
    InstructionResult<{ tokenStaking: PublicKey; tokenStakingBumpSeed: number; targetMint: PublicKey }>
  > {
    const programId = this.programId;
    const provider = this.provider;
    const targetMintKeypair = anchor.web3.Keypair.generate();
    const [targetMintAuthorityRes, targetMintAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("target-authority", "utf-8"), targetMintKeypair.publicKey.toBuffer()],
        programId
      );
    const targetMintAuthority = targetMintAuthorityRes;
    const [tokenStaking, bumpSeed] = await PublicKey.findProgramAddress(
      [
        Buffer.from("token-staking", "utf-8"),
        baseMint.toBuffer(),
        targetMintKeypair.publicKey.toBuffer(),
      ],
      programId
    );
    const tokenInstructions = await createMintInstructions(
      provider,
      targetMintAuthority,
      targetMintKeypair.publicKey,
      targetMintDecimals
    );

    return {
      output: {
        targetMint: targetMintKeypair.publicKey,
        tokenStaking,
        tokenStakingBumpSeed: bumpSeed,
      },
      instructions: [
        ...tokenInstructions,
        await this.instruction.initializeTokenStakingV0(
          {
            periodUnit,
            period,
            rewardPercentPerPeriodPerLockupPeriod,
            bumpSeed,
            targetMintAuthorityBumpSeed,
            authority,
          },
          {
            accounts: {
              payer: payer,
              baseMint: baseMint,
              targetMint: targetMintKeypair.publicKey,
              tokenStaking,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
              clock: SYSVAR_CLOCK_PUBKEY,
            },
          }
        ),
      ],
      signers: [targetMintKeypair],
    };
  }

  async createTokenStaking(args: CreateTokenStakingArgs): Promise<PublicKey> {
    const {
      output: { tokenStaking },
      instructions,
      signers,
    } = await this.createTokenStakingInstructions(args);
    await this.sendInstructions(instructions, signers);
    return tokenStaking;
  }

  async stakeInstructions({
    tokenStaking,
    amount,
    voucherNumber,
    lockupPeriods,
    owner = this.wallet.publicKey,
    payer = this.wallet.publicKey,
  }: StakeArgs): Promise<InstructionResult<{ stakingVoucher: PublicKey }>> {
    const tokenStakingAccount = await this.program.account.tokenStakingV0.fetch(tokenStaking);
    let voucherNumberToUse = voucherNumber || 0;
    const getVoucher: () => Promise<[PublicKey, Number]> = () => {
      const pad = Buffer.alloc(2);
      new BN(voucherNumberToUse, 16, 'le').toBuffer().copy(pad)
      return PublicKey.findProgramAddress(
        [Buffer.from("stake-voucher", "utf-8"), owner.toBuffer(), tokenStaking.toBuffer(), pad],
        this.programId
      );
    };
    const getVoucherAccount = async () => {
      return this.provider.connection.getAccountInfo((await getVoucher())[0]);
    };
    if (!voucherNumber) {
      // Find an empty voucher account
      while (await getVoucherAccount()) {
        voucherNumberToUse++;
      }
    } else {
      voucherNumberToUse = voucherNumber;
    }

    const [stakingVoucher, bumpSeed] = await getVoucher();
    const [baseHolding, holdingBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("holding", "utf-8"), stakingVoucher.toBuffer()],
      this.programId
    );
    const [baseHoldingAuthority, holdingAuthorityBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("holding-authority", "utf-8"), baseHolding.toBuffer()],
      this.programId
    );
    const ataBumpSeed = (
      await PublicKey.findProgramAddress(
        [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenStakingAccount.targetMint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    )[1];
    const purchaseAccount = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenStakingAccount.baseMint,
      owner
    );

    const instructions = [
      await this.instruction.stakeV0(
        {
          voucherNumber: voucherNumberToUse,
          baseAmount: amount,
          lockupPeriods,
          bumpSeed,
          holdingAuthorityBumpSeed,
          holdingBumpSeed,
          ataBumpSeed,
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
            clock: SYSVAR_CLOCK_PUBKEY,
          },
        }
      ),
    ];

    return {
      instructions,
      signers: [],
      output: {
        stakingVoucher,
      },
    };
  }

  async stake(args: StakeArgs): Promise<PublicKey> {
    const {
      output: { stakingVoucher },
      instructions,
      signers,
    } = await this.stakeInstructions(args);
    await this.sendInstructions(instructions, signers);
    return stakingVoucher;
  }

  async collectInstructions({
    tokenStaking,
    stakingVoucher,
    payer = this.wallet.publicKey,
  }: CollectArgs): Promise<InstructionResult<{ destination: PublicKey }>> {
    const staking = await this.account.tokenStakingV0.fetch(tokenStaking);
    const voucher = await this.account.stakingVoucherV0.fetch(stakingVoucher);
    const destination = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      staking.targetMint,
      voucher.owner
    );
    const destinationAcct = await this.provider.connection.getAccountInfo(destination);

    const instructions = [];
    if (!destinationAcct) {
      instructions.push(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          staking.targetMint,
          destination,
          voucher.owner,
          payer
        )
      );
    }

    const mintAuthority = await PublicKey.createProgramAddress(
      [
        Buffer.from("target-authority", "utf-8"),
        staking.targetMint.toBuffer(),
        new BN(staking.targetMintAuthorityBumpSeed).toBuffer(),
      ],
      this.programId
    );

    instructions.push(
      await this.instruction.collectRewardsV0({
        accounts: {
          tokenStaking,
          stakingVoucher,
          destination,
          targetMint: staking.targetMint,
          mintAuthority,
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: SYSVAR_CLOCK_PUBKEY,
        },
      })
    );

    return {
      instructions,
      signers: [],
      output: {
        destination,
      },
    };
  }

  async collect(args: CollectArgs): Promise<PublicKey> {
    const {
      output: { destination },
      instructions,
      signers,
    } = await this.collectInstructions(args);
    await this.sendInstructions(instructions, signers);

    return destination;
  }

  async unstakeInstructions({
    tokenStaking,
    stakingVoucher,
  }: UnstakeArgs): Promise<InstructionResult<null>> {
    const staking = await this.account.tokenStakingV0.fetch(tokenStaking);
    const voucher = await this.account.stakingVoucherV0.fetch(stakingVoucher);
    const destination = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      staking.baseMint,
      voucher.owner
    );

    const baseHolding = await PublicKey.createProgramAddress(
      [
        Buffer.from("holding", "utf-8"),
        stakingVoucher.toBuffer(),
        new BN(voucher.holdingBumpSeed).toBuffer(),
      ],
      this.programId
    );
    const baseHoldingAuthority = await PublicKey.createProgramAddress(
      [
        Buffer.from("holding-authority", "utf-8"),
        baseHolding.toBuffer(),
        new BN(voucher.holdingAuthorityBumpSeed).toBuffer(),
      ],
      this.programId
    );

    return {
      signers: [],
      output: null,
      instructions: [
        await this.instruction.unstakeV0({
          accounts: {
            tokenStaking,
            stakingVoucher,
            owner: voucher.owner,
            destination,
            baseHolding,
            baseHoldingAuthority,
            clock: SYSVAR_CLOCK_PUBKEY,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          },
        }),
      ],
    };
  }

  async unstake(args: UnstakeArgs): Promise<void> {
    const { instructions, signers } = await this.unstakeInstructions(args);
    await this.sendInstructions(instructions, signers);
  }
}
