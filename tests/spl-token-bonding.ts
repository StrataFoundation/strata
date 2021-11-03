import * as anchor from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import { createMint } from "@project-serum/common";
import { NATIVE_MINT } from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { ExponentialCurve, ExponentialCurveConfig, SplTokenBonding, TimeCurveConfig, TokenBondingV0 } from "../packages/spl-token-bonding/src";
import { waitForUnixTime } from './utils/clock';
import { TokenUtils } from "./utils/token";


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
      {
        c: new BN(1000000000000), // c = 1
        b: new BN(100000000000), // b = 0.1
        // @ts-ignore
        pow: new BN(1),
        // @ts-ignore
        frac: new BN(2)
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
      {
        c: new BN(1000000000000), // c = 1
        b: new BN(100000000000), // b = 0.1
        // @ts-ignore
        pow: new BN(1),
        // @ts-ignore
        frac: new BN(2)
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
        config: new ExponentialCurveConfig({
          c: 1,
          b: 0.1,
          pow: 1,
          frac: 1
        })
      });

      tokenBonding = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        authority: me,
        buyBaseRoyaltyPercentage: 5,
        buyTargetRoyaltyPercentage: 10,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
        mintCap: new BN(1000), // 10.0
      });
      tokenBondingAcct = (await tokenBondingProgram.account.tokenBondingV0.fetch(
        tokenBonding
      )) as TokenBondingV0;
    });

    it("succesfully creates the curve", async () => {
      const curveAcct = await tokenBondingProgram.account.curveV0.fetch(curve);
      // @ts-ignore
      const c = curveAcct.definition.timeV0.curves[0].curve;
      // @ts-ignore
      expect(c.exponentialCurveV0.pow).to.equal(1);
      // @ts-ignore
      expect(c.exponentialCurveV0.frac).to.equal(1);
      // @ts-ignore
      expect(c.exponentialCurveV0.c.toNumber()).to.equal(1000000000000);
      // @ts-ignore
      expect(c.exponentialCurveV0.b.toNumber()).to.equal(100000000000);
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
        buyTargetRoyaltyPercentage: 15,
      });
      tokenBondingNow = await tokenBondingProgram.account.tokenBondingV0.fetch(tokenBonding);
      expect(tokenBondingNow.buyTargetRoyaltyPercentage).to.equal(percent(15));

      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        buyBaseRoyaltyPercentage: 10,
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
      await tokenBondingProgram.buy({
        tokenBonding,
        desiredTargetAmount: new BN(50),
        slippage: 0.05,
      });

      // Me is also the founder rewards account, so we expect the full amount plus royalties
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0.55);
    });

    it("does not allow buying past the cap", async () => {
      try {
        await tokenBondingProgram.buy({
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
      await tokenBondingProgram.buy({
        tokenBonding,
        desiredTargetAmount: new BN(50),
        slippage: 0.5,
      });

      await tokenBondingProgram.sell({
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

  describe("time curve", () => {
    let curve: PublicKey;
    let tokenBonding: PublicKey;
    let tokenBondingAcct: TokenBondingV0;
    const INITIAL_BALANCE = 1000;
    const DECIMALS = 2;
    
    before(async () => {
      const baseMint = await createMint(provider, me, DECIMALS);
      await tokenUtils.createAtaAndMint(provider, baseMint, INITIAL_BALANCE);
      curve = await tokenBondingProgram.initializeCurve({
        config: new TimeCurveConfig().addCurve(
          0,
          new ExponentialCurveConfig({
            c: 0,
            b: 1,
            pow: 1,
            frac: 1
          })
        ).addCurve(
          10, // 10 seconds
          new ExponentialCurveConfig({
            c: 1,
            b: 0,
            pow: 1,
            frac: 1
          })
        )
      });

      tokenBonding = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        authority: me,
        buyBaseRoyaltyPercentage: 0,
        buyTargetRoyaltyPercentage: 0,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
        mintCap: new BN(1000), // 10.0
      });
      tokenBondingAcct = (await tokenBondingProgram.account.tokenBondingV0.fetch(
        tokenBonding
      )) as TokenBondingV0;
    })

    it ("switches from a fixed price model to a linear model", async () => {
      await tokenBondingProgram.buy({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.5
      });
      await tokenUtils.expectAtaBalance(
        me,
        tokenBondingAcct.baseMint,
        INITIAL_BALANCE / Math.pow(10, DECIMALS) - 1
      );

      await waitForUnixTime(provider.connection, BigInt(tokenBondingAcct.goLiveUnixTime.toNumber() + 10));
      await tokenBondingProgram.sell({
        tokenBonding,
        targetAmount: new BN(50),
        slippage: 0.5
      });

      await tokenUtils.expectAtaBalance(
        me,
        tokenBondingAcct.baseMint,
        INITIAL_BALANCE / Math.pow(10, DECIMALS) - 0.25
      );
    })
  })

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
        config: new ExponentialCurveConfig({
          c: 0,
          b: 1,
          pow: 0,
          frac: 1
        })
      });
    });

    async function createCurve(buyBaseRoyaltyPercentage: number, buyTargetRoyaltyPercentage: number, sellBaseRoyaltyPercentage: number, sellTargetRoyaltyPercentage: number) {
      tokenBonding = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        authority: me,
        buyBaseRoyaltyPercentage,
        buyTargetRoyaltyPercentage,
        sellBaseRoyaltyPercentage,
        sellTargetRoyaltyPercentage,
        mintCap: new BN(1000), // 10.0
      });
      tokenBondingAcct = (await tokenBondingProgram.account.tokenBondingV0.fetch(
        tokenBonding
      )) as TokenBondingV0;
    }

    it("correctly rewards with base royalties", async () => {
      await createCurve(20, 0, 0, 0);

      const { instructions, signers } = await tokenBondingProgram.buyInstructions({
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

      const { instructions, signers } = await tokenBondingProgram.buyInstructions({
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
      const curve = await tokenBondingProgram.initializeCurve(c);

      const tokenBonding = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: 2,
        authority: me,
        buyBaseRoyaltyPercentage: 0,
        buyTargetRoyaltyPercentage: 0,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
        mintCap: new BN(10000),
      });

      return {
        tokenBonding,
        baseMint,
      };
    }

    it("allows a fixed price", async () => {
      const { tokenBonding, baseMint } = await create({
        config: new ExponentialCurveConfig({
          c: 0,
          b: 5,
          pow: 0,
          frac: 1
        })
      });
      await tokenBondingProgram.buy({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.05,
      });
      await tokenUtils.expectAtaBalance(me, baseMint, 95);
    });

    it("allows a constant product price", async () => {
      const { tokenBonding, baseMint } = await create({
        config: new ExponentialCurveConfig({
          c: 5,
          b: 7.5,
          pow: 1,
          frac: 1
        })
      });
      await tokenBondingProgram.buy({
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
        config: new ExponentialCurveConfig({
          c: 1,
          b: 0.1,
          pow: 1,
          frac: 1
        })
      });

      tokenBonding = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        authority: me,
        buyBaseRoyaltyPercentage: 5,
        buyTargetRoyaltyPercentage: 10,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
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
      await tokenBondingProgram.buy({
        tokenBonding,
        desiredTargetAmount: new BN(50),
        slippage: 0.05,
      });

      await tokenBondingProgram.buy({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.05,
      });

      await tokenBondingProgram.sell({
        tokenBonding,
        targetAmount: new BN(66),
        slippage: 0.05,
      });

      await tokenBondingProgram.sell({
        tokenBonding,
        targetAmount: new BN(100),
        slippage: 0.05,
      });

      await tokenUtils.expectBalance(tokenBondingAcct.baseStorage, 0);
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
        config: new ExponentialCurveConfig({
          c: 1,
          b: 0,
          pow: 1,
          frac: 2
        })
      },
      {
        config: new ExponentialCurveConfig({
          c: 2,
          b: 0,
          pow: 1,
          frac: 2
        })
      },
      {
        config: new ExponentialCurveConfig({
          c: 0,
          b: 0.1,
          pow: 0,
          frac: 1
        })
      }
    ]

    curves.forEach((curveSpec, index) => {
      it(`is zero sum with curve ${index}`, async () => {
        baseMint = await createMint(provider, me, DECIMALS);
        await tokenUtils.createAtaAndMint(provider, baseMint, INITIAL_BALANCE);
        // @ts-ignore
        curve = await tokenBondingProgram.initializeCurve(curveSpec);

        tokenBonding = await tokenBondingProgram.createTokenBonding({
          curve,
          baseMint,
          targetMintDecimals: DECIMALS,
          authority: me,
          buyBaseRoyaltyPercentage: 0,
          buyTargetRoyaltyPercentage: 0,
          sellBaseRoyaltyPercentage: 0,
          sellTargetRoyaltyPercentage: 0
        });

        await tokenBondingProgram.buy({
          tokenBonding,
          desiredTargetAmount: new BN(500),
          slippage: 0.5,
        });

        await tokenBondingProgram.buy({
          tokenBonding,
          desiredTargetAmount: new BN(1000),
          slippage: 0.5,
        });

        await tokenBondingProgram.sell({
          tokenBonding,
          targetAmount: new BN(1200),
          slippage: 0.5,
        });

        await tokenBondingProgram.sell({
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
