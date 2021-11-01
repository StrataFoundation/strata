import * as anchor from "@wum.bo/anchor";
import { expect, use } from "chai";
import { TokenUtils } from "./utils/token";
import ChaiAsPromised from "chai-as-promised";

import { asDecimal, ExponentialCurveConfig, SplTokenBonding } from "../packages/spl-token-bonding/src";
import { SplBondingPresale } from "../packages/spl-bonding-presale/src";
import { BN } from "@wum.bo/anchor";
import { PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { waitForUnixTime } from './utils/clock';
import { percent } from "../packages/spl-utils/dist/lib";

use(ChaiAsPromised);

describe("spl-bonding-presale", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.local());
  const provider = anchor.getProvider();

  const program = anchor.workspace.SplBondingPresale;
  const bonding = anchor.workspace.SplTokenBonding;
  const tokenUtils = new TokenUtils(provider);
  const tokenBondingProgram = new SplTokenBonding(provider, bonding);
  const bondingPresaleProgram = new SplBondingPresale(provider, program, tokenBondingProgram);
  const me = tokenBondingProgram.wallet.publicKey;
  let tokenBonding: PublicKey;
  let presale: PublicKey;

  before(async () => {
    await tokenBondingProgram.initializeSolStorage();
    // Simple constant price 1:1 curve
    const curve = await tokenBondingProgram.initializeCurve({
      config: new ExponentialCurveConfig({
        c: 0,
        b: 1,
        pow: 0,
        frac: 1
      })
    });
    tokenBonding = await tokenBondingProgram.createTokenBonding({
      curve,
      authority: me,
      buyBaseRoyaltyPercentage: 0,
      sellBaseRoyaltyPercentage: 0,
      buyTargetRoyaltyPercentage: 10,
      sellTargetRoyaltyPercentage: 0,
      baseMint: NATIVE_MINT,
      targetMintDecimals: 2,
      // End presale in 10 seconds
      goLiveDate: new Date(new Date().getTime() + 10 * 1000)
    })
    presale = await bondingPresaleProgram.initializePresale({
      presaleCurve: curve,
      postCurve: curve,
      tokenBonding,
    })
  });

  it("sets up a presale bonding curve", async () => {
    const presaleAcct = await bondingPresaleProgram.account.tokenBondingPresaleV0.fetch(presale);
    const presaleBondingAcct = await tokenBondingProgram.account.tokenBondingV0.fetch(presaleAcct.presaleTokenBonding);
    await tokenBondingProgram.buy({
      tokenBonding: presaleAcct.presaleTokenBonding,
      desiredTargetAmount: new BN(2000000000),
      slippage: 0.05
    });
    await tokenUtils.expectAtaBalance(me, presaleBondingAcct.targetMint, 2);
  })

  it("has a locked bonding curve", async () => {
    try {
      await tokenBondingProgram.buy({
        tokenBonding,
        desiredTargetAmount: new BN(200),
        slippage: 0.05
      });
      throw "Shouldn't get here"
    } catch (e) {
      console.log(e);
      expect(e.toString()).to.equal("NotLiveYet: This bonding curve is not live yet")
    }
  })

  it("has a locked post bonding curve", async () => {
    const presaleAcct = await bondingPresaleProgram.account.tokenBondingPresaleV0.fetch(presale);
    try {
      await tokenBondingProgram.buy({
        tokenBonding: presaleAcct.postTokenBonding,
        desiredTargetAmount: new BN(200),
        slippage: 0.05
      });
      throw "Shouldn't get here"
    } catch (e) {
      console.log(e);
      expect(e.toString()).to.equal("NotLiveYet: This bonding curve is not live yet")
    }
  })

  describe('launch', () => {
    let presaleAcct;
    before(async () => {
      presaleAcct = await bondingPresaleProgram.account.tokenBondingPresaleV0.fetch(presale);
      await waitForUnixTime(provider.connection, BigInt(presaleAcct.goLiveUnixTime.toNumber())) // Sleep until golive
      await bondingPresaleProgram.launch({
        presale
      });
    })
  
    it("unlocks token bonding", async () => {
      const tokenBondingAcct = await tokenBondingProgram.account.tokenBondingV0.fetch(presaleAcct.tokenBonding);
      expect(tokenBondingAcct.buyFrozen).to.be.false;    
    });

    it("locks the presale", async () => {
      expect(await provider.connection.getAccountInfo(presaleAcct.presaleTokenBonding)).to.be.null;
    });


    it("transfers the presale to the post sale", async () => {
      const postBondingAcct = await tokenBondingProgram.account.tokenBondingV0.fetch(presaleAcct.postTokenBonding);
      // Make sure to account for royalties, which will be floor'd
      await tokenUtils.expectBalance(postBondingAcct.baseStorage, 1.81);
    });

    it("allows transforming presale tokens into target tokens", async () => {
      await tokenBondingProgram.sell({
        tokenBonding: presaleAcct.postTokenBonding,
        targetAmount: new BN(2000000000),
        slippage: 0.05
      });
    })
  })
});