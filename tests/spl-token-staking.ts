import * as anchor from '@project-serum/anchor';
import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, Account, PublicKey, SystemProgram, Transaction, TransactionInstruction, Signer } from '@solana/web3.js';
import { createMint, createMintInstructions, createTokenAccount, token } from "@project-serum/common"
import { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID, AccountInfo as TokenAccountInfo, u64 } from '@solana/spl-token';
import { BN, Provider, Program } from '@wum.bo/anchor';
import { expect } from "chai";
import { PeriodUnit, SplTokenStaking, SplTokenStakingIDL } from "@wum.bo/spl-token-staking";
import { TokenUtils } from './utils/token';

import { Idl } from '@wum.bo/anchor/dist/idl';
import { AllAccountsMap, IdlAccounts } from '@wum.bo/anchor/dist/program/namespace/types';

type TokenStakingV0 = IdlAccounts<SplTokenStakingIDL>["tokenStakingV0"]
type StakingVoucherV0 = IdlAccounts<SplTokenStakingIDL>["stakingVoucherV0"];

describe('spl-token-staking', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.SplTokenStaking;
  const tokenUtils = new TokenUtils(program.provider);

  let tokenStaking: PublicKey;
  let tokenStakingProgram = new SplTokenStaking(program);
  let baseMint: PublicKey;

  beforeEach(async () => {
    baseMint = await createMint(program.provider, tokenStakingProgram.wallet.publicKey, 2);
    tokenStaking = await tokenStakingProgram.createTokenStaking({
      authority: program.provider.wallet.publicKey,
      baseMint,
      periodUnit: PeriodUnit.SECOND,
      period: 5,
      rewardPercentPerPeriodPerLockupPeriod: 2
    })
  })

  it('Initializes a stake instance and a stake', async () => {
    const tokenStakingAccount = await tokenStakingProgram.account.tokenStakingV0.fetch(tokenStaking)
    expect(tokenStakingAccount.period).to.equal(5)
    expect(tokenStakingAccount.rewardPercentPerPeriodPerLockupPeriod).to.equal(2)
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
      
      const balance = await tokenStakingProgram.provider.connection.getTokenAccountBalance(baseMintAcct);
      expect(balance.value.uiAmount).to.equal(0.98);

      const storedBalance = await tokenStakingProgram.provider.connection.getTokenAccountBalance(stakingVoucherAccount.baseHolding);
      expect(storedBalance.value.uiAmount).to.equal(0.02);
    })
  })
});
