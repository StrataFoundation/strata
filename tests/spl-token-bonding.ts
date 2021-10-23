import * as anchor from "@wum.bo/anchor";
import { sendAndConfirmTransaction, Transaction, PublicKey, Keypair } from "@solana/web3.js";
import { createMint } from "@project-serum/common";
import { NATIVE_MINT, AccountInfo as TokenAccountInfo, u64 } from "@solana/spl-token";
import { BN, ProgramError } from "@wum.bo/anchor";
import { expect, use } from "chai";
import { TokenUtils } from "./utils/token";
import ChaiAsPromised from "chai-as-promised";

import { ExponentialCurve, SplTokenBonding, TokenBondingV0 } from "../packages/spl-token-bonding/src";
import { Curves } from "@wum.bo/spl-token-bonding";

use(ChaiAsPromised);

function percent(percent: number): number {
  return Math.floor((percent / 100) * 4294967295); // uint32 max value
}

describe("spl-token-bonding", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.local());
  const provider = anchor.getProvider();

  const program = anchor.workspace.SplTokenBonding;
  const tokenUtils = new TokenUtils(provider);
  const tokenBondingProgram = new SplTokenBonding(provider, program);
  const me = tokenBondingProgram.wallet.publicKey;
  const newWallet = Keypair.generate()

  before(async () => {
    await tokenBondingProgram.initializeSolStorage();
  });

  describe("exp curve test", () => {
    it("it does the correct calculation when supply is 0", () => {
      const curve = new ExponentialCurve(
        new BN(1000000000000), // c = 1
        new BN(100000000000), // b = 0.1
      {
        k: new BN(500000000000), // 0.5
      }, {
        address: PublicKey.default,
        mint: PublicKey.default,
        owner: PublicKey.default,
        amount: new BN(0),
        delegate: null,
        delegatedAmount: new BN(0),
        isInitialized: false,
        isFrozen: false,
        isNative: false,
        rentExemptReserve: null,
        closeAuthority: null
      }, {
        mintAuthority: null,
        supply: new BN(0),
        decimals: 9,
        isInitialized: true,
        freezeAuthority: null
      }, {
        mintAuthority: null,
        supply: new BN(0),
        decimals: 9,
        isInitialized: true,
        freezeAuthority: null
      });

      const baseAmount = curve.buyTargetAmount(10, percent(5), percent(5));
      expect(baseAmount).to.be.closeTo(25.07426349820264, 0.005);
    });

    it("is the same forward and backward when supply and reserves are nonzero", () => {
      const curve = new ExponentialCurve(
        new BN(1000000000000), // c = 1
        new BN(100000000000), // b = 0.1
      {
        k: new BN(500000000000), // 0.5
      }, {
        address: PublicKey.default,
        mint: PublicKey.default,
        owner: PublicKey.default,
        amount: new BN(1000000000),
        delegate: null,
        delegatedAmount: new BN(0),
        isInitialized: false,
        isFrozen: false,
        isNative: false,
        rentExemptReserve: null,
        closeAuthority: null
      }, {
        mintAuthority: null,
        supply: new BN(1000000000),
        decimals: 9,
        isInitialized: true,
        freezeAuthority: null
      }, {
        mintAuthority: null,
        supply: new BN(1000000000),
        decimals: 9,
        isInitialized: true,
        freezeAuthority: null
      });

      const baseAmount = curve.buyTargetAmount(10, percent(5), percent(5));
      const targetAmount = curve.buyWithBaseAmount(baseAmount, percent(5), percent(5));
      expect(targetAmount).to.be.closeTo(10, 0.005);
    });
  })

  describe("with normal base mint", () => {
    let baseMint: PublicKey;
    let curve: PublicKey;
    let tokenBonding: PublicKey;
    let tokenBondingAcct: TokenBondingV0;
    const INITIAL_BALANCE = 1000;
    const DECIMALS = 2;
    beforeEach(async () => {
      baseMint = await createMint(provider, me, DECIMALS);
      await tokenUtils.createAtaAndMint(provider, baseMint, INITIAL_BALANCE);
      curve = await tokenBondingProgram.initializeCurve({
        curve: {
          // @ts-ignore
          c: new BN(1000000000000), // c = 1
          b: new BN(100000000000), // b = 0.1
          curve: {
            exponentialCurveV0: {
            // @ts-ignore
              k: new BN(1000000000000)
            }
          },
        },
      });

      tokenBonding = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        authority: me,
        buyBaseRoyaltyPercentage: percent(5),
        buyTargetRoyaltyPercentage: percent(10),
        sellBaseRoyaltyPercentage: percent(0),
        sellTargetRoyaltyPercentage: percent(0),
        mintCap: new BN(1000), // 10.0
      });
      tokenBondingAcct = (await tokenBondingProgram.account.tokenBondingV0.fetch(
        tokenBonding
      )) as TokenBondingV0;
    });

    it("succesfully creates the curve", async () => {
      const curveAcct = await tokenBondingProgram.account.curveV0.fetch(curve);
      // @ts-ignore
      expect(curveAcct.curve.exponentialCurveV0.k.toNumber()).to.equal(1000000000000);
      // @ts-ignore
      expect(curveAcct.c.toNumber()).to.equal(1000000000000);
      // @ts-ignore
      expect(curveAcct.b.toNumber()).to.equal(100000000000);
    });

    it("allows updating token bonding", async () => {
      let tokenBondingNow = await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding);
      expect(tokenBondingNow.buyTargetRoyaltyPercentage).to.equal(percent(10));
      expect(tokenBondingNow.buyBaseRoyaltyPercentage).to.equal(percent(5));
      expect(tokenBondingNow.buyFrozen).to.equal(false);
      // @ts-ignore
      expect(tokenBondingNow.curve.toBase58()).to.equal(curve.toBase58());
      // @ts-ignore
      expect(tokenBondingNow.authority.toBase58()).to.equal(me.toBase58());

      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        buyTargetRoyaltyPercentage: percent(15),
      });
      tokenBondingNow = await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding);
      expect(tokenBondingNow.buyTargetRoyaltyPercentage).to.equal(percent(15));

      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        buyBaseRoyaltyPercentage: percent(10),
      });
      tokenBondingNow = await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding);
      expect(tokenBondingNow.buyBaseRoyaltyPercentage).to.equal(percent(10));

      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        buyFrozen: true,
      });
      tokenBondingNow = await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding);
      expect(tokenBondingNow.buyFrozen).to.equal(true);

      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        authority: null,
      });
      tokenBondingNow = await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding);
      expect(tokenBondingNow.authority).to.equal(null);
    });

    it("allows buying the bonding curve", async () => {
      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(50),
        slippage: 0.05,
      });

      // Me is also the founder rewards account, so we expect the full amount plus royalties
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0.55);
    });

    it("does not allow buying past the cap", async () => {
      try {
        await tokenBondingProgram.buyV0({
          tokenBonding,
          desiredTargetAmount: new BN(1001),
          slippage: 0.05,
        })
        throw "Shouldn't get here"
      } catch (e) {
        console.log(e);
        expect(e.toString()).to.equal("PassedMintCap: Passed the mint cap")
      }
    });

    it("allows selling", async () => {
      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(50),
        slippage: 0.5,
      });

      await tokenBondingProgram.sellV0({
        tokenBonding,
        targetAmount: new BN(55),
        slippage: 0.5,
      });

      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0);
      await tokenUtils.expectAtaBalance(
        me,
        tokenBondingAcct.baseMint,
        INITIAL_BALANCE / Math.pow(10, DECIMALS)
      );
    });
  });

  describe("royalties", () => {
    let baseMint: PublicKey;
    let curve: PublicKey;
    let tokenBonding: PublicKey;
    let tokenBondingAcct: TokenBondingV0;
    const INITIAL_BALANCE = 1000;
    const DECIMALS = 2;
    beforeEach(async () => {
      baseMint = await createMint(provider, me, DECIMALS);
      await tokenUtils.createAtaAndMint(provider, baseMint, INITIAL_BALANCE);
      await tokenUtils.createAtaAndMint(provider, baseMint, INITIAL_BALANCE, newWallet.publicKey);
      curve = await tokenBondingProgram.initializeCurve({
        curve: {
          // @ts-ignore
          fixedPriceCurveV0: {
            price: new BN(1_000000000000),
          },
        },
      });
    });

    async function createCurve(buyBaseRoyaltyPercentage: number, buyTargetRoyaltyPercentage: number, sellBaseRoyaltyPercentage: number, sellTargetRoyaltyPercentage: number) {
      tokenBonding = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        authority: me,
        buyBaseRoyaltyPercentage: percent(buyBaseRoyaltyPercentage),
        buyTargetRoyaltyPercentage: percent(buyTargetRoyaltyPercentage),
        sellBaseRoyaltyPercentage: percent(sellBaseRoyaltyPercentage),
        sellTargetRoyaltyPercentage: percent(sellTargetRoyaltyPercentage),
        mintCap: new BN(1000), // 10.0
      });
      tokenBondingAcct = (await tokenBondingProgram.account.tokenBondingV0.fetch(
        tokenBonding
      )) as TokenBondingV0;
    }

    it("correctly rewards with base royalties", async () => {
      await createCurve(20, 0, 0, 0);

      const { instructions, signers } = await tokenBondingProgram.buyV0Instructions({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.05,
        sourceAuthority: newWallet.publicKey
      });

      const tx = new Transaction();
      tx.add(...instructions);
      await provider.send(tx, [...signers, newWallet])

      await tokenUtils.expectAtaBalance(newWallet.publicKey, tokenBondingAcct.targetMint, 1);
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.baseMint, (INITIAL_BALANCE / (Math.pow(10, DECIMALS)) + 0.2));
    })


    it("correctly rewards with target royalties", async () => {
      await createCurve(0, 20, 0, 0);

      const { instructions, signers } = await tokenBondingProgram.buyV0Instructions({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.05,
        sourceAuthority: newWallet.publicKey
      });

      const tx = new Transaction();
      tx.add(...instructions);
      await provider.send(tx, [...signers, newWallet])

      await tokenUtils.expectAtaBalance(newWallet.publicKey, tokenBondingAcct.targetMint, 1);
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, .25);
    })
  })

  describe("marketplace", () => {
    async function create(c: any): Promise<{ tokenBonding: PublicKey; baseMint: PublicKey }> {
      const baseMint = await createMint(provider, me, 2);
      await tokenUtils.createAtaAndMint(provider, baseMint, 100_00);
      const curve = await tokenBondingProgram.initializeCurve({
        curve: c,
      });

      const tokenBonding = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: 2,
        authority: me,
        buyBaseRoyaltyPercentage: percent(0),
        buyTargetRoyaltyPercentage: percent(0),
        sellBaseRoyaltyPercentage: percent(0),
        sellTargetRoyaltyPercentage: percent(0),
        mintCap: new BN(10000),
      });

      return {
        tokenBonding,
        baseMint,
      };
    }

    it("allows a doubling mechanic", async () => {
      const { tokenBonding, baseMint } = await create({
        // @ts-ignore
        exponentialCurveV0: {
          a: new BN(10_000000000000),
          b: new BN(2_000000000000),
        },
      });
      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.05,
      });
      await tokenUtils.expectAtaBalance(me, baseMint, 90);

      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(200),
        slippage: 0.05,
      });
      await tokenUtils.expectAtaBalance(me, baseMint, 30);
    });

    it("allows a fixed price", async () => {
      const { tokenBonding, baseMint } = await create({
        // @ts-ignore
        fixedPriceCurveV0: {
          price: new BN(5_000000000000),
        },
      });
      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.05,
      });
      await tokenUtils.expectAtaBalance(me, baseMint, 95);
    });

    it("allows a constant product price", async () => {
      const { tokenBonding, baseMint } = await create({
        // @ts-ignore
        constantProductCurveV0: {
          b: new BN(7_500000000000),
          m: new BN(5_000000000000),
        },
      });
      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.05,
      });
      await tokenUtils.expectAtaBalance(me, baseMint, 90);
    });
  });

  describe("with sol base mint", async () => {
    const baseMint: PublicKey = NATIVE_MINT;
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
            taylorIterations: 15,
          },
        },
      });

      tokenBonding = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        authority: me,
        buyBaseRoyaltyPercentage: percent(5),
        buyTargetRoyaltyPercentage: percent(10),
        sellBaseRoyaltyPercentage: percent(0),
        sellTargetRoyaltyPercentage: percent(0),
        mintCap: new BN(1000), // 10.0
      });
      tokenBondingAcct = (await tokenBondingProgram.account.tokenBondingV0.fetch(
        tokenBonding
      )) as TokenBondingV0;
    });

    it("allows buy/sell", async () => {
      // Also ensure zero sum.
      const initLamports = (await provider.connection.getAccountInfo(me))
        .lamports;
      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(50),
        slippage: 0.05,
      });

      await tokenBondingProgram.buyV0({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.05,
      });

      await tokenBondingProgram.sellV0({
        tokenBonding,
        targetAmount: new BN(66),
        slippage: 0.05,
      });

      await tokenBondingProgram.sellV0({
        tokenBonding,
        targetAmount: new BN(100),
        slippage: 0.05,
      });

      await tokenUtils.expectBalance(tokenBondingAcct.baseStorage, 0.000000001); // Rounding errors always go in base storage favor, so nobody can rob with wiggling
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0);
      const lamports = (await provider.connection.getAccountInfo(me)).lamports;
      expect(lamports).to.within(100000000, initLamports);
    });
  });

  describe("zero sum tests", () => {
    let baseMint: PublicKey;
    let curve: PublicKey;
    let tokenBonding: PublicKey;
    const INITIAL_BALANCE = 100000000;
    const DECIMALS = 2;

    const curves = [
      {
        // @ts-ignore
        exponentialCurveV0: {
          c: new BN(1000000000000), // 1
          g: new BN(100000000000), // 0.1
          taylorIterations: 15,
        },
      },
      {
        // @ts-ignore
        exponentialCurveV0: {
          a: new BN(10_000000000000),
          b: new BN(2_000000000000),
        },
      },
      {
        // @ts-ignore
        fixedPriceCurveV0: {
          price: new BN(5_000000000000),
        },
      }, {
        // @ts-ignore
        constantProductCurveV0: {
          b: new BN(7_500000000000),
          m: new BN(5_000000000000),
        }
      }
    ]

    curves.forEach(curveSpec => {
      it(`is zero sum with ${Object.keys(curveSpec)[0]} curves`, async () => {
        baseMint = await createMint(provider, me, DECIMALS);
        await tokenUtils.createAtaAndMint(provider, baseMint, INITIAL_BALANCE);
        curve = await tokenBondingProgram.initializeCurve({
          // @ts-ignore
          curve: curveSpec
        });

        tokenBonding = await tokenBondingProgram.createTokenBonding({
          curve,
          baseMint,
          targetMintDecimals: DECIMALS,
          authority: me,
          buyBaseRoyaltyPercentage: percent(0),
          buyTargetRoyaltyPercentage: percent(0),
          sellBaseRoyaltyPercentage: percent(0),
          sellTargetRoyaltyPercentage: percent(0)
        });

        await tokenBondingProgram.buyV0({
          tokenBonding,
          desiredTargetAmount: new BN(500),
          slippage: 0.5,
        });

        await tokenBondingProgram.buyV0({
          tokenBonding,
          desiredTargetAmount: new BN(1000),
          slippage: 0.5,
        });

        await tokenBondingProgram.sellV0({
          tokenBonding,
          targetAmount: new BN(1200),
          slippage: 0.5,
        });

        await tokenBondingProgram.sellV0({
          tokenBonding,
          targetAmount: new BN(300),
          slippage: 0.5,
        });

        const tokenBondingAcct = (await tokenBondingProgram.account.tokenBondingV0.fetch(
          tokenBonding
        )) as TokenBondingV0;

        await tokenUtils.expectBalanceWithin(tokenBondingAcct.baseStorage, 0, 0.04); // Rounding errors always go in base storage favor, so nobody can rob with wiggling
        await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0);
      })
    });
  });
});
