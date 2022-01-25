import * as anchor from "@project-serum/anchor";
import { Program, Provider } from "@project-serum/anchor";
import { ASSOCIATED_TOKEN_PROGRAM_ID, MintInfo, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  PublicKey, SystemProgram, SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY
} from "@solana/web3.js";
import { createMintInstructions, getMintInfo, AnchorSdk, InstructionResult } from "@strata-foundation/spl-utils";
import BN from "bn.js";
import { PeriodUnit, SplTokenStakingIDL, TokenStakingV0 } from "./generated/spl-token-staking";

export * from "./generated/spl-token-staking";

interface ICreateTokenStakingArgs {
  authority?: PublicKey;
  baseMint: PublicKey;
  periodUnit: any;
  period: number;
  payer?: PublicKey;
  rewardPercentPerPeriodPerLockupPeriod: number;
  targetMint?: PublicKey;
  targetMintDecimals: number;
}

interface IStakeArgs {
  tokenStaking: PublicKey;
  amount: BN;
  lockupPeriods: BN;
  owner?: PublicKey;
  payer?: PublicKey;
  voucherNumber?: number;
}

interface IUnstakeArgs {
  tokenStaking: PublicKey;
  stakingVoucher: PublicKey;
}

interface ICollectArgs {
  payer?: PublicKey; // Not necessary unless there's an ATA that needs to be created for the destination
  tokenStaking: PublicKey;
  stakingVoucher: PublicKey;
}

export class SplTokenStaking extends AnchorSdk<SplTokenStakingIDL> {
  constructor(provider: Provider, program: Program<SplTokenStakingIDL>) {
    super({ provider, program })
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
    try {
      return (
        targetMint.supply.toNumber() +
        staking.targetAmountUnredeemed.toNumber() +
        staking.targetAmountPerPeriod.toNumber() *
          (this.getPeriod(staking, Date.now() / 1000) -
            this.getPeriod(staking, staking.lastCalculatedTimestamp.toNumber()))
      );
    } catch(e: any) {
      console.log("Get total target supply failed, logging params")
      console.log(targetMint.supply.toString(10))
      console.log(staking.targetAmountUnredeemed.toString(10))
      console.log(staking.targetAmountPerPeriod.toString(10))
      throw e;
    }
  }

  async getTotalTargetSupplyFromKey(tokenStaking: PublicKey): Promise<number> {
    const staking = await this.account.tokenStakingV0.fetch(tokenStaking);
    const mintInfo = await getMintInfo(this.provider, staking.targetMint);
    // @ts-ignore
    return this.getTotalTargetSupply(mintInfo, staking);
  }

  async createTokenStakingInstructions({
    authority,
    payer = this.wallet.publicKey,
    baseMint,
    periodUnit,
    period,
    rewardPercentPerPeriodPerLockupPeriod,
    targetMintDecimals,
    targetMint
  }: ICreateTokenStakingArgs): Promise<
    InstructionResult<{ tokenStaking: PublicKey; tokenStakingBumpSeed: number; targetMint: PublicKey }>
  > {
    const programId = this.programId;
    const provider = this.provider;
    
    const instructions = [];
    const signers = []
    let shouldCreateMint = false;
    if (!targetMint) {
      const targetMintKeypair = anchor.web3.Keypair.generate();
      targetMint = targetMintKeypair.publicKey;
      signers.push(targetMintKeypair);
      shouldCreateMint = true;
    }

    const [targetMintAuthorityRes, targetMintAuthorityBumpSeed] =
    await PublicKey.findProgramAddress(
      [Buffer.from("target-authority", "utf-8"), targetMint.toBuffer()],
      programId
    );
    const targetMintAuthority = targetMintAuthorityRes;

    if (shouldCreateMint) {
      const tokenInstructions = await createMintInstructions(
        provider,
        targetMintAuthority,
        targetMint,
        targetMintDecimals
      );
      instructions.push(...tokenInstructions);
    }
    
    const [tokenStaking, bumpSeed] = await PublicKey.findProgramAddress(
      [
        Buffer.from("token-staking", "utf-8"),
        baseMint.toBuffer(),
        targetMint.toBuffer(),
      ],
      programId
    );

    instructions.push(await this.instruction.initializeTokenStakingV0(
      // @ts-ignore
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
          targetMint: targetMint,
          tokenStaking,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          clock: SYSVAR_CLOCK_PUBKEY,
        },
      }
    ))

    return {
      output: {
        targetMint: targetMint,
        tokenStaking,
        tokenStakingBumpSeed: bumpSeed,
      },
      instructions,
      signers,
    };
  }

  async createTokenStaking(args: ICreateTokenStakingArgs): Promise<PublicKey> {
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
  }: IStakeArgs): Promise<InstructionResult<{ stakingVoucher: PublicKey }>> {
    const tokenStakingAccount = await this.program.account.tokenStakingV0.fetch(tokenStaking);

    let voucherNumberToUse = voucherNumber || 0;
    const getVoucher: () => Promise<[PublicKey, number]> = () => {
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

    const instructions = [];

    const [stakingInfo, stakingInfoBumpSeed] = await PublicKey.findProgramAddress(
      [
        Buffer.from("stake-info", "utf-8"),
        owner.toBuffer(),
        tokenStaking.toBuffer()
      ],
      this.programId
    );
    const stakingInfoAccount = await this.program.account.stakingInfoV0.fetchNullable(stakingInfo);
    if (!stakingInfoAccount) {
      instructions.push(
        await this.instruction.initializeStakingInfoV0(
          stakingInfoBumpSeed, {
            accounts: {
              payer,
              tokenStaking,
              stakingInfo,
              owner,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
              clock: SYSVAR_CLOCK_PUBKEY,
            }
          }
        )
      )
    }

    instructions.push(
      await this.instruction.stakeV0(
        {
          voucherNumber: voucherNumberToUse,
          baseAmount: amount,
          lockupPeriods,
          bumpSeed,
          holdingAuthorityBumpSeed,
          holdingBumpSeed,
          ataBumpSeed
        },
        {
          accounts: {
            stakingInfo,
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
    )

    return {
      instructions,
      signers: [],
      output: {
        stakingVoucher,
      },
    };
  }

  async stake(args: IStakeArgs): Promise<PublicKey> {
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
  }: ICollectArgs): Promise<InstructionResult<{ destination: PublicKey }>> {
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

    const [stakingInfo] = await PublicKey.findProgramAddress(
      [
        Buffer.from("stake-info", "utf-8"),
        voucher.owner.toBuffer(),
        tokenStaking.toBuffer()
      ],
      this.programId
    );

    instructions.push(
      await this.instruction.collectRewardsV0({
        accounts: {
          tokenStaking,
          stakingInfo,
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

  async collect(args: ICollectArgs): Promise<PublicKey> {
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
  }: IUnstakeArgs): Promise<InstructionResult<null>> {
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

    const [stakingInfo] = await PublicKey.findProgramAddress(
      [
        Buffer.from("stake-info", "utf-8"),
        voucher.owner.toBuffer(),
        tokenStaking.toBuffer()
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
            stakingInfo,
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

  async unstake(args: IUnstakeArgs): Promise<void> {
    const { instructions, signers } = await this.unstakeInstructions(args);
    await this.sendInstructions(instructions, signers);
  }
}
