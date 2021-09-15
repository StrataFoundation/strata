import * as anchor from '@project-serum/anchor';
import { Connection, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, Account, PublicKey, SystemProgram, Transaction, TransactionInstruction, Signer } from '@solana/web3.js';
import { createMint, createMintInstructions, createTokenAccount, token } from "@project-serum/common"
import { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID, AccountInfo as TokenAccountInfo, u64 } from '@solana/spl-token';
import { BN, Provider, Program } from '@wum.bo/anchor';
import { expect, use } from "chai";
import { PeriodUnit, SplTokenStaking, StakingVoucherV0 } from "@wum.bo/spl-token-staking";
import { TokenUtils } from './utils/token';
import ChaiAsPromised from "chai-as-promised";
import { waitForUnixTime } from './utils/clock';
import { Idl } from '@wum.bo/anchor/dist/idl';
import { TokenStakingV0 } from '../packages/spl-token-staking/src';

use(ChaiAsPromised);

describe('spl-token-staking', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.SplTokenStaking;
  const tokenUtils = new TokenUtils(program.provider);

  let tokenStaking: PublicKey;
  let tokenStakingAcct: TokenStakingV0;
  let tokenStakingProgram = new SplTokenStaking(program);
  let baseMint: PublicKey;

  beforeEach(async () => {
    baseMint = await createMint(program.provider, tokenStakingProgram.wallet.publicKey, 2);
    tokenStaking = await tokenStakingProgram.createTokenStaking({
      authority: program.provider.wallet.publicKey,
      baseMint,
      periodUnit: PeriodUnit.SECOND,
      period: 5,
      targetMintDecimals: 2,
      rewardPercentPerPeriodPerLockupPeriod: 4294967295 // 100%
    })
    tokenStakingAcct = await tokenStakingProgram.account.tokenStakingV0.fetch(tokenStaking) as any;
  })

  async function waitForPeriod(period: number) {
    await waitForUnixTime(program.provider.connection, BigInt(tokenStakingAcct.createdTimestamp.toNumber() + tokenStakingAcct.period * period)) // Sleep past remainder of first period, into second
  }

  it('Initializes a stake instance and a stake', async () => {
    const tokenStakingAccount = await tokenStakingProgram.account.tokenStakingV0.fetch(tokenStaking)
    expect(tokenStakingAccount.period).to.equal(5)
    expect(tokenStakingAccount.rewardPercentPerPeriodPerLockupPeriod).to.equal(4294967295)
  });

  describe("staking", () => {
    let baseMintAcct: PublicKey;
    let stakingVoucher: PublicKey;
    let stakingVoucherAccount: StakingVoucherV0;

    beforeEach(async () => {
      baseMintAcct = await tokenUtils.createAtaAndMint(program.provider, baseMint, 100);
      stakingVoucher = await tokenStakingProgram.stake({
        lockupPeriods: new BN(1),
        amount: new BN(2),
        tokenStaking
      });
      stakingVoucherAccount = await tokenStakingProgram.account.stakingVoucherV0.fetch(stakingVoucher);
    })

    it('Creates a staking instance with staked tokens', async () => {
      expect(stakingVoucherAccount.baseAmount.toNumber()).to.equal(2)
      expect(stakingVoucherAccount.lockupPeriods.toNumber()).to.equal(1)
      
      await tokenUtils.expectBalance(baseMintAcct, 0.98)
      await tokenUtils.expectBalance(stakingVoucherAccount.baseHolding, 0.02)
    })

    it('Allows collecting after the reward interval', async () => {
      await waitForPeriod(1);
      const destination = await tokenStakingProgram.collect({ tokenStaking, stakingVoucher });
      await tokenUtils.expectBalance(destination, 0.02)

      await waitForPeriod(2);
      await tokenStakingProgram.collect({ tokenStaking, stakingVoucher });
      await tokenUtils.expectBalance(destination, 0.04)
    })

    it('Does not allow unstaking before lockup', async () => {
      expect(tokenStakingProgram.unstake({ tokenStaking, stakingVoucher })).to.eventually.throw(/0x131/)
    })

    it('Does not allow unstaking before collect', async () => {
      await waitForPeriod(1);
      expect(tokenStakingProgram.unstake({ tokenStaking, stakingVoucher })).to.eventually.throw(/0x132/)
    })


    it("Should allow unstaking after lockup", async () => {
      await waitForPeriod(1);
      await tokenStakingProgram.collect({ tokenStaking, stakingVoucher });
      await tokenStakingProgram.unstake({ tokenStaking, stakingVoucher });
      await tokenUtils.expectBalance(baseMintAcct, 1);
    })

    it("Is possible to unstake then restake in the same slot", async () => {
      await waitForPeriod(1);
      await tokenStakingProgram.collect({ tokenStaking, stakingVoucher });
      await tokenStakingProgram.unstake({ tokenStaking, stakingVoucher });
      await tokenStakingProgram.stake({
        lockupPeriods: new BN(1),
        amount: new BN(5),
        tokenStaking,
        voucherNumber: 0
      });
    })

    it ('Keeps track of total supply', async () => {
      expect(await tokenStakingProgram.getTotalTargetSupplyFromKey(tokenStaking)).to.equal(0);
      await waitForPeriod(1);
      expect(await tokenStakingProgram.getTotalTargetSupplyFromKey(tokenStaking)).to.equal(2);
      await waitForPeriod(2);
      await tokenStakingProgram.collect({ tokenStaking, stakingVoucher });
      expect(await tokenStakingProgram.getTotalTargetSupplyFromKey(tokenStaking)).to.equal(4);
      await tokenStakingProgram.unstake({ tokenStaking, stakingVoucher });
      expect(await tokenStakingProgram.getTotalTargetSupplyFromKey(tokenStaking)).to.equal(4);
    })
  })
});
