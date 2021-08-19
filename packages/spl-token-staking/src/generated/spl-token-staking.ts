import { PublicKey, AccountInfo } from "@solana/web3.js";
import { ProgramAccount , Address, Program, AccountNamespace, AccountClient } from "@project-serum/anchor";
import BN from "bn.js";

export interface InitializeTokenStakingV0Args {
  periodUnit: PeriodUnit;
  period: number;
  rewardPercentPerPeriodPerLockupPeriod: number;
  bumpSeed: number;
  targetMintAuthorityBumpSeed: number;
}
  

export interface StakeV0Args {
  
  voucherNumber: number;
  baseAmount: BN;
  lockupPeriods: BN;
  bumpSeed: number;
  holdingBumpSeed: number;
  holdingAuthorityBumpSeed: number;
}
  

export interface Bumps {
  
  voucherNumber: number;
  bumpSeed: number;
  targetMintAuthorityBumpSeed: number;
}
  

export type PeriodUnit = Record<string, Record<string, any>>
export const PeriodUnit = {
  SECOND: { second: {} },
  MINUTE: { minute: {} },
  HOUR: { hour: {} },
  DAY: { day: {} },
  YEAR: { year: {} }
}
    
export interface TokenStakingV0 {
  periodUnit: PeriodUnit;
  bumps: Bumps;
  authority: PublicKey;
  baseMint: PublicKey;
  targetMint: PublicKey;
  period: number;
  rewardPercentPerPeriodPerLockupPeriod: number;
  totalBaseAmountStaked: BN;
  targetAmountPerPeriod: BN;
  targetAmountUnredeemed: BN;
  lastCalculatedTimestamp: BN;
  createdTimestamp: BN;
  voucherNumber: number;
  bumpSeed: number;
  targetMintAuthorityBumpSeed: number;
}
  

export interface StakingVoucherV0 {
  
  tokenStaking: PublicKey;
  stakingVoucher: PublicKey;
  owner: PublicKey;
  baseAmount: BN;
  createdTimestamp: BN;
  lastWithdrawnTimestamp: BN;
  lockupPeriods: BN;
  voucherNumber: number;
  bumpSeed: number;
}
  

export class TokenStakingV0AccountClient extends AccountClient {
  override async fetch(address: Address): Promise<TokenStakingV0> {
    return (await this.fetch(address)) as TokenStakingV0;
  }

  parse(accountInfo: AccountInfo<Buffer>): TokenStakingV0 {
    return this.coder.accounts.decode("TokenStakingV0", accountInfo.data);
  }

  override async all(filter?: Buffer): Promise<ProgramAccount<TokenStakingV0>[]> {
    return (await this.all(filter)).map(programAccount => ({
      ...programAccount,
      account: programAccount.account as TokenStakingV0
    }))
  }
}
  

export class StakingVoucherV0AccountClient extends AccountClient {
  override async fetch(address: Address): Promise<StakingVoucherV0> {
    return (await this.fetch(address)) as StakingVoucherV0;
  }

  parse(accountInfo: AccountInfo<Buffer>): StakingVoucherV0 {
    return this.coder.accounts.decode("StakingVoucherV0", accountInfo.data);
  }

  override async all(filter?: Buffer): Promise<ProgramAccount<StakingVoucherV0>[]> {
    return (await this.all(filter)).map(programAccount => ({
      ...programAccount,
      account: programAccount.account as StakingVoucherV0
    }))
  }
}
  

export interface SplTokenStakingAccountNamespace  extends AccountNamespace {
  tokenStakingV0: TokenStakingV0AccountClient;
  stakingVoucherV0: StakingVoucherV0AccountClient
}

export interface SplTokenStakingProgram extends Program {
  account: SplTokenStakingAccountNamespace
}
  