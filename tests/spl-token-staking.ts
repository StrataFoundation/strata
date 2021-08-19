import * as anchor from '@wum.bo/anchor';
import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, Account, PublicKey, SystemProgram, Transaction, TransactionInstruction, Signer } from '@solana/web3.js';
import { createMint, createMintInstructions, createTokenAccount, token } from "@project-serum/common"
import { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID, AccountInfo as TokenAccountInfo, u64 } from '@solana/spl-token';
import { BN, Provider, Program } from '@wum.bo/anchor';
import { expect } from "chai";
import { TokenStakingV0, PeriodUnit, SplTokenStaking } from "@wum.bo/spl-token-staking";
import { SplTokenStakingProgram } from '../packages/spl-token-staking/src';

describe('spl-token-staking', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  const program = anchor.workspace.SplTokenStaking;

  let tokenStaking: PublicKey;
  let tokenStakingProgram = new SplTokenStaking(program);
  let baseMintAcct: PublicKey;

  beforeEach(async () => {
    const baseMint = await createMint(program.provider, tokenStakingProgram.wallet.publicKey, 2);
    tokenStaking = await tokenStakingProgram.createTokenStaking({
      authority: program.provider.wallet.publicKey,
      baseMint,
      periodUnit: PeriodUnit.SECOND,
      period: 5,
      rewardPercentPerPeriodPerLockupPeriod: 2
    })

    baseMintAcct = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      baseMint,
      tokenStakingProgram.wallet.publicKey
    )
    const mintTx = new Transaction();
    mintTx.add(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        baseMint,
        baseMintAcct,
        tokenStakingProgram.wallet.publicKey,
        tokenStakingProgram.wallet.publicKey
      ),
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        baseMint,
        baseMintAcct,
        tokenStakingProgram.wallet.publicKey,
        [],
        100
      )
    )
    await tokenStakingProgram.provider.send(mintTx);
  })

  it('Initializes a stake instance and a stake', async () => {
    const tokenStakingAccount = await tokenStakingProgram.account.tokenStakingV0.fetch(tokenStaking)
    expect(tokenStakingAccount.period).to.equal(5)
    expect(tokenStakingAccount.rewardPercentPerPeriodPerLockupPeriod).to.equal(2)
  });

  it('Allows staking', async () => {
    const voucher = await tokenStakingProgram.stake({
      lockupPeriods: new BN(1),
      amount: new BN(2),
      tokenStaking
    });
    const stakeVoucher = await tokenStakingProgram.account.stakingVoucherV0.fetch(voucher);
    expect(stakeVoucher.baseAmount.toNumber()).to.equal(2)
    expect(stakeVoucher.lockupPeriods.toNumber()).to.equal(1)
    
    const balance = await tokenStakingProgram.provider.connection.getTokenAccountBalance(baseMintAcct);
    expect(balance.value.uiAmount).to.equal(0.98);
  })
});
