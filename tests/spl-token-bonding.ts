import * as anchor from '@project-serum/anchor';
import { SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, Account, PublicKey, SystemProgram, Transaction, TransactionInstruction, Signer } from '@solana/web3.js';
import { createMint, createMintInstructions, createTokenAccount, token } from "@project-serum/common"
import { TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID, AccountInfo as TokenAccountInfo, u64 } from '@solana/spl-token';
import { BN, Provider, Program } from '@wum.bo/anchor';
import { expect, use } from "chai";
import { PeriodUnit, SplTokenStaking, StakingVoucherV0 } from "@wum.bo/spl-token-staking";
import { TokenUtils } from './utils/token';
import ChaiAsPromised from "chai-as-promised";

import { Idl } from '@wum.bo/anchor/dist/idl';

use(ChaiAsPromised);

async function sleep(ts: number) {
  return new Promise((resolve) => {
   setTimeout(resolve, ts);
  })
}

describe('spl-token-staking', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  
  const program = anchor.workspace.SplTokenBonding;
  const tokenUtils = new TokenUtils(program.provider);

  beforeEach(async () => {
  })

  it("does stuff", async () => {
    console.log("hi")
  })
});
