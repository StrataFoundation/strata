import * as anchor from '@project-serum/anchor';
import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, Account, PublicKey, SystemProgram, Transaction, TransactionInstruction, Signer } from '@solana/web3.js';
import { createMint, createMintInstructions, createTokenAccount, token } from "@project-serum/common"
import { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID, AccountInfo as TokenAccountInfo, u64 } from '@solana/spl-token';
import { BN, Provider, Program } from '@wum.bo/anchor';
import { expect, use } from "chai";
import { PeriodUnit, SplTokenStaking, StakingVoucherV0, TokenStakingV0 } from "@wum.bo/spl-token-staking";
import { TokenUtils } from './utils/token';
import ChaiAsPromised from "chai-as-promised";
import { waitForUnixTime } from './utils/clock';
import { SplTokenAccountSplit } from '../packages/spl-token-account-split/src';

use(ChaiAsPromised);

describe('spl-token-account-split', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();
  const program = anchor.workspace.SplTokenAccountSplit;
  const tokenUtils = new TokenUtils(provider);

  let tokenStaking: PublicKey;
  let tokenStakingProgram = new SplTokenStaking(provider, anchor.workspace.SplTokenStaking);
  let tokenSplitProgram = new SplTokenAccountSplit(provider, program, tokenStakingProgram);
  let baseMint: PublicKey;
  let tokenStakingAcct: TokenStakingV0;
  let stakingVoucher: PublicKey;
  let split: PublicKey;
  let splitMint: PublicKey;

  beforeEach(async () => {
    baseMint = await createMint(provider, tokenStakingProgram.wallet.publicKey, 2);
    tokenStaking = await tokenStakingProgram.createTokenStaking({
      authority: provider.wallet.publicKey,
      baseMint,
      periodUnit: PeriodUnit.SECOND,
      period: 5,
      targetMintDecimals: 2,
      rewardPercentPerPeriodPerLockupPeriod: 4294967295 // 100%
    })
    await tokenUtils.createAtaAndMint(provider, baseMint, 100);
    stakingVoucher = await tokenStakingProgram.stake({
      lockupPeriods: new BN(1),
      amount: new BN(2),
      tokenStaking
    });
    await tokenStakingProgram.account.stakingVoucherV0.fetch(stakingVoucher);
    splitMint = await createMint(provider);
    const { tokenAccountSplit, tokenAccount } = (await tokenSplitProgram.createTokenAccountSplit({
      mint: splitMint,
      tokenStaking
    }))
    split = tokenAccountSplit;
    await tokenUtils.mintTo(splitMint, 1000, tokenAccount)
    tokenStakingAcct = await tokenStakingProgram.account.tokenStakingV0.fetch(tokenStaking) as any;
  })

  async function waitForPeriod(period: number) {
    await waitForUnixTime(provider.connection, BigInt(tokenStakingAcct.createdTimestamp.toNumber() + tokenStakingAcct.period * period)) // Sleep past remainder of first period, into second
  }

  it('Allows taking a share of the pot based on total supply', async () => {
    await waitForPeriod(1)
    const destination = await tokenStakingProgram.collect({ tokenStaking, stakingVoucher });
    await tokenUtils.expectBalance(destination, 0.02)
    await tokenSplitProgram.collectTokens({
      tokenAccountSplit: split,
      stakingRewardsAmount: new BN(1)
    })
    await tokenUtils.expectBalance(destination, 0.01)
    // We redeemed 0.01. We've claimed 0.02.
    await tokenUtils.expectAtaBalance(provider.wallet.publicKey, splitMint, 500)
  })
});
