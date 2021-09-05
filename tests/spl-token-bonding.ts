import * as anchor from '@project-serum/anchor';
import { PublicKey } from '@solana/web3.js';
import { createMint } from "@project-serum/common"
import { NATIVE_MINT, AccountInfo as TokenAccountInfo, u64 } from '@solana/spl-token';
import { BN } from '@wum.bo/anchor';
import { expect, use } from "chai";
import { TokenUtils } from './utils/token';
import ChaiAsPromised from "chai-as-promised";

import { SplTokenBonding, TokenBondingV0 } from '../packages/spl-token-bonding/src';

use(ChaiAsPromised);

async function sleep(ts: number) {
  return new Promise((resolve) => {
   setTimeout(resolve, ts);
  })
}

function percent(percent: number): number {
  return Math.floor((percent / 100) * 4294967295) // uint32 max value
}

describe('spl-token-bonding', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  
  const program = anchor.workspace.SplTokenBonding;
  const tokenUtils = new TokenUtils(program.provider);
  const tokenBondingProgram = new SplTokenBonding(program);
  const me = tokenBondingProgram.wallet.publicKey;

  describe('with normal base mint', () => {
    let baseMint: PublicKey;
    let curve: PublicKey;
    let tokenBonding: PublicKey;
    let tokenBondingAcct: TokenBondingV0;
    const INITIAL_BALANCE = 1000;
    const DECIMALS = 2;
    beforeEach(async () => {
      baseMint = await createMint(program.provider, me, DECIMALS);
      await tokenUtils.createAtaAndMint(program.provider, baseMint, INITIAL_BALANCE);
      curve = await tokenBondingProgram.initializeCurve({
        curve: {
          // @ts-ignore
          logCurveV0: {
            c: new BN(1000000000000), // 1
            g: new BN(100000000000), // 0.1
            taylorIterations: 15
          }
        }
      });
      
      tokenBonding = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        authority: me,
        baseRoyaltyPercentage: percent(5),
        targetRoyaltyPercentage: percent(10),
        mintCap: new BN(1000) // 10.0
      })
      tokenBondingAcct = (await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding)) as TokenBondingV0;
    })
  
    it("succesfully creates the curve", async () => {
      const curveAcct = await tokenBondingProgram.account.curveV0.fetch(curve);
      // @ts-ignore
      expect(curveAcct.curve.logCurveV0.g.toNumber()).to.equal(100000000000);
      // @ts-ignore
      expect(curveAcct.curve.logCurveV0.c.toNumber()).to.equal(1000000000000);
      // @ts-ignore
      expect(curveAcct.curve.logCurveV0.taylorIterations).to.equal(15);
    });
  
    it ("allows updating token bonding", async () => {
      let tokenBondingNow = await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding);
      expect(tokenBondingNow.targetRoyaltyPercentage).to.equal(percent(10));
      expect(tokenBondingNow.baseRoyaltyPercentage).to.equal(percent(5));
      expect(tokenBondingNow.buyFrozen).to.equal(false);
      // @ts-ignore
      expect(tokenBondingNow.curve.toBase58()).to.equal(curve.toBase58());
      // @ts-ignore
      expect(tokenBondingNow.authority.toBase58()).to.equal(me.toBase58());
  
      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        targetRoyaltyPercentage: percent(15)
      });
      tokenBondingNow = await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding);
      expect(tokenBondingNow.targetRoyaltyPercentage).to.equal(percent(15));
  
      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        baseRoyaltyPercentage: percent(10)
      });
      tokenBondingNow = await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding);
      expect(tokenBondingNow.baseRoyaltyPercentage).to.equal(percent(10));
  
      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        buyFrozen: true
      });
      tokenBondingNow = await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding);
      expect(tokenBondingNow.buyFrozen).to.equal(true);
  
      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        authority: null
      });
      tokenBondingNow = await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding);
      expect(tokenBondingNow.authority).to.equal(null);
    }) 
  
    it ("allows buying the bonding curve", async () => {
      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(50),
        slippage: 0.05
      })
  
      // Me is also the founder rewards account, so we expect the full amount plus royalties
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0.55);
    })
  
    it ("does not allow buying past the cap", async () => {
      expect(tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(1001),
        slippage: 0.05
      })).to.eventually.throw(/0x131/)
    })
  
    it ("allows selling", async () => {
      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(50),
        slippage: 0.05
      })
  
      await tokenBondingProgram.sellV0({
        tokenBonding,
        targetAmount: new BN(55),
        slippage: 0.05
      })
  
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0);
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.baseMint, INITIAL_BALANCE / Math.pow(10, DECIMALS));
    });
  });

  describe('marketplace', () => {
    async function create(c: any): Promise<{ tokenBonding: PublicKey, baseMint: PublicKey }> {
      const baseMint = await createMint(program.provider, me, 2);
      await tokenUtils.createAtaAndMint(program.provider, baseMint, 100_00);
      const curve = await tokenBondingProgram.initializeCurve({
        curve: c
      });
      
      const tokenBonding = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: 2,
        authority: me,
        baseRoyaltyPercentage: percent(0),
        targetRoyaltyPercentage: percent(0),
        mintCap: new BN(10000)
      })

      return {
        tokenBonding,
        baseMint
      }
    }

    it('allows a doubling mechanic', async () => {
      const { tokenBonding, baseMint} = await create({
        // @ts-ignore
        exponentialCurveV0: {
          a: new BN(10_000000000000),
          b: new BN(2_000000000000)
        }
      })
      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.05
      })
      await tokenUtils.expectAtaBalance(me, baseMint, 90);

      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(200),
        slippage: 0.05
      })
      await tokenUtils.expectAtaBalance(me, baseMint, 30);
    });

    it('allows a fixed price', async () => {
      const { tokenBonding, baseMint} = await create({
        // @ts-ignore
        fixedPriceCurveV0: {
          price: new BN(5_000000000000)
        }
      })
      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.05
      })
      await tokenUtils.expectAtaBalance(me, baseMint, 95);
    })

    it('allows a constant product price', async () => {
      const { tokenBonding, baseMint} = await create({
        // @ts-ignore
        constantProductCurveV0: {
          b: new BN(7_500000000000),
          m: new BN(5_000000000000)
        }
      })
      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.05
      })
      await tokenUtils.expectAtaBalance(me, baseMint, 90);
    })
  })

  describe('with sol base mint', async () => {
    const baseMint: PublicKey = NATIVE_MINT
    let curve: PublicKey;
    let tokenBonding: PublicKey;
    let tokenBondingAcct: TokenBondingV0;
    const DECIMALS = 2;
    beforeEach(async () => {
      curve = await tokenBondingProgram.initializeCurve({
        curve: {
          // @ts-ignore
          logCurveV0: {
            c: new BN(1000000000000), // 1
            g: new BN(100000000000), // 0.1
            taylorIterations: 15
          }
        }
      });
      
      tokenBonding = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        authority: me,
        baseRoyaltyPercentage: percent(5),
        targetRoyaltyPercentage: percent(10),
        mintCap: new BN(1000) // 10.0
      })
      tokenBondingAcct = (await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding)) as TokenBondingV0;
    })

    it ("allows buy/sell", async () => {
      const initLamports = (await tokenBondingProgram.provider.connection.getAccountInfo(me)).lamports
      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(50),
        slippage: 0.05
      })
  
      await tokenBondingProgram.sellV0({
        tokenBonding,
        targetAmount: new BN(55),
        slippage: 0.05
      })
  
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0);
      const lamports = (await tokenBondingProgram.provider.connection.getAccountInfo(me)).lamports
      expect(lamports).to.within(100000000, initLamports);
    });
  })
});
