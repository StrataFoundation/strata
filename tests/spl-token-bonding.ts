import * as anchor from "@project-serum/anchor";
import { AnchorProvider, BN } from "@project-serum/anchor";
import {
  createMint,
  createAtaAndMint,
} from "@strata-foundation/spl-utils";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { expect, use } from "chai";
import ChaiAsPromised from "chai-as-promised";
import {
  ExponentialCurve,
  ExponentialCurveConfig,
  ITokenBonding,
  SplTokenBonding,
  TimeCurveConfig,
  TimeDecayExponentialCurveConfig,
  TokenBondingV0,
} from "../packages/spl-token-bonding/src";
import { BondingPricing } from "../packages/spl-token-bonding/src/pricing";
import { waitForUnixTime } from "./utils/clock";
import { TokenUtils } from "./utils/token";

use(ChaiAsPromised);

function percent(percent: number): number {
  return Math.floor((percent / 100) * 4294967295); // uint32 max value
}

describe("spl-token-bonding", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.local("http://127.0.0.1:8899"));
  const provider = anchor.getProvider() as AnchorProvider;

  const program = anchor.workspace.SplTokenBonding;
  const tokenUtils = new TokenUtils(provider);
  const tokenBondingProgram = new SplTokenBonding(provider, program);
  const me = tokenBondingProgram.wallet.publicKey;
  const newWallet = Keypair.generate();

  before(async () => {
    await tokenBondingProgram.initializeSolStorage({
      mintKeypair: Keypair.generate(),
    });
  });

  describe("exp curve test", () => {
    it("it does the correct calculation when supply is 0", () => {
      const curve = new ExponentialCurve(
        {
          c: new BN(1000000000000), // c = 1
          b: new BN(0),
          // @ts-ignore
          pow: 1,
          // @ts-ignore
          frac: 2,
        },
        0,
        0
      );

      const baseAmount = curve.buyTargetAmount(10, percent(5), percent(5));
      expect(baseAmount).to.be.closeTo(23.96623025761275, 0.005);
    });

    it("is the same forward and backward when supply and reserves are nonzero", () => {
      const curve = new ExponentialCurve(
        {
          c: new BN(1000000000000), // c = 1
          b: new BN(0), // b = 0
          // @ts-ignore
          pow: 1,
          // @ts-ignore
          frac: 2,
        },
        1,
        1
      );

      const baseAmount = curve.buyTargetAmount(10, percent(5), percent(5));
      const targetAmount = curve.buyWithBaseAmount(
        baseAmount,
        percent(5),
        percent(5)
      );
      expect(targetAmount).to.be.closeTo(10, 0.005);
    });
  });

  describe("with normal base mint", () => {
    let baseMint: PublicKey;
    let curve: PublicKey;
    let tokenBonding: PublicKey;
    let tokenBondingAcct: ITokenBonding;
    const INITIAL_BALANCE = 1000;
    const DECIMALS = 2;
    beforeEach(async () => {
      baseMint = await createMint(provider, me, DECIMALS);
      await createAtaAndMint(provider, baseMint, INITIAL_BALANCE);
      curve = await tokenBondingProgram.initializeCurve({
        config: new ExponentialCurveConfig({
          c: 1,
          b: 0,
          pow: 1,
          frac: 1,
        }),
      });

      const { tokenBonding: tokenBondingOut } =
        await tokenBondingProgram.createTokenBonding({
          curve,
          baseMint,
          targetMintDecimals: DECIMALS,
          generalAuthority: me,
          reserveAuthority: me,
          buyBaseRoyaltyPercentage: 5,
          buyTargetRoyaltyPercentage: 10,
          sellBaseRoyaltyPercentage: 0,
          sellTargetRoyaltyPercentage: 0,
          mintCap: new BN(1000), // 10.0
        });
      tokenBonding = tokenBondingOut;
      tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
    });

    it("succesfully creates the curve", async () => {
      const curveAcct = await tokenBondingProgram.getCurve(curve);
      // @ts-ignore
      const c = curveAcct.definition.timeV0.curves[0].curve;
      // @ts-ignore
      expect(c.exponentialCurveV0.pow).to.equal(1);
      // @ts-ignore
      expect(c.exponentialCurveV0.frac).to.equal(1);
      // @ts-ignore
      expect(c.exponentialCurveV0.c.toNumber()).to.equal(1000000000000);
      // @ts-ignore
      expect(c.exponentialCurveV0.b.toNumber()).to.equal(0);
    });

    it("allows updating token bonding", async () => {
      let tokenBondingNow = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
      expect(tokenBondingNow.buyTargetRoyaltyPercentage).to.equal(percent(10));
      expect(tokenBondingNow.buyBaseRoyaltyPercentage).to.equal(percent(5));
      expect(tokenBondingNow.buyFrozen).to.equal(false);
      // @ts-ignore
      expect(tokenBondingNow.curve.toBase58()).to.equal(curve.toBase58());
      // @ts-ignore
      expect(tokenBondingNow.generalAuthority.toBase58()).to.equal(
        me.toBase58()
      );

      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        buyTargetRoyaltyPercentage: 15,
      });
      tokenBondingNow = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
      expect(tokenBondingNow.buyTargetRoyaltyPercentage).to.equal(percent(15));

      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        buyBaseRoyaltyPercentage: 10,
      });
      tokenBondingNow = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
      expect(tokenBondingNow.buyBaseRoyaltyPercentage).to.equal(percent(10));

      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        buyFrozen: true,
      });
      tokenBondingNow = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
      expect(tokenBondingNow.buyFrozen).to.equal(true);

      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        generalAuthority: null,
      });
      tokenBondingNow = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
      expect(tokenBondingNow.generalAuthority).to.equal(null);

      await tokenBondingProgram.updateTokenBonding({
        tokenBonding,
        reserveAuthority: null,
      });
      tokenBondingNow = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
      expect(tokenBondingNow.reserveAuthority).to.equal(null);
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
        });
        throw "Shouldn't get here";
      } catch (e: any) {
        console.log(e);
        expect(e.toString()).to.equal("PassedMintCap: Passed the mint cap");
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

  describe("buy with base vs buy with target", () => {
    let baseMint: PublicKey;
    let curve: PublicKey;
    let tokenBonding: PublicKey;
    let tokenBondingAcct: ITokenBonding;
    const INITIAL_BALANCE = 1000000;
    const DECIMALS = 2;
    beforeEach(async () => {
      baseMint = await createMint(provider, me, DECIMALS);
      await createAtaAndMint(provider, baseMint, INITIAL_BALANCE);
      curve = await tokenBondingProgram.initializeCurve({
        config: new ExponentialCurveConfig({
          c: 1,
          b: 0,
          pow: 1,
          frac: 1,
        }),
      });

      const { tokenBonding: tokenBondingOut } =
        await tokenBondingProgram.createTokenBonding({
          curve,
          baseMint,
          targetMintDecimals: DECIMALS,
          generalAuthority: me,
          buyBaseRoyaltyPercentage: 0,
          buyTargetRoyaltyPercentage: 0,
          sellBaseRoyaltyPercentage: 0,
          sellTargetRoyaltyPercentage: 0,
          mintCap: new BN(1000), // 10.0
        });
      tokenBonding = tokenBondingOut;
      tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
    });

    it("has the same result from buying with base as buy with target amount", async () => {
      const { targetAmount } = await tokenBondingProgram.swap({
        baseMint: tokenBondingAcct.baseMint,
        targetMint: tokenBondingAcct.targetMint,
        baseAmount: 2,
        slippage: 0.5,
      });

      await tokenBondingProgram.sell({
        tokenBonding,
        targetAmount,
        slippage: 0.5,
      });

      const ata = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenBondingAcct.targetMint,
        me
      );
      const pre = (await provider.connection.getTokenAccountBalance(ata))!.value
        .uiAmount;

      await tokenBondingProgram.buy({
        tokenBonding: tokenBondingAcct.publicKey,
        desiredTargetAmount: targetAmount,
        slippage: 0.5,
      });
      const post = (await provider.connection.getTokenAccountBalance(ata))!
        .value.uiAmount;
      expect(post! - pre!).to.eq(targetAmount!);
    });

    it("(when not an initial buy) has the same result from buying with base as buy with target amount", async () => {
      await tokenBondingProgram.swap({
        baseMint: tokenBondingAcct.baseMint,
        targetMint: tokenBondingAcct.targetMint,
        baseAmount: 2,
        slippage: 0.5,
      });

      const targetAmount = 4;

      const ata = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenBondingAcct.baseMint,
        me
      );
      const pre = (await provider.connection.getTokenAccountBalance(ata))!.value
        .uiAmount;
      await tokenBondingProgram.buy({
        tokenBonding,
        desiredTargetAmount: targetAmount,
        slippage: 0.5,
      });
      const post = (await provider.connection.getTokenAccountBalance(ata))!
        .value.uiAmount;

      await tokenBondingProgram.sell({
        tokenBonding,
        targetAmount,
        slippage: 0.5,
      });

      const { targetAmount: newTargetAmount } = await tokenBondingProgram.swap({
        baseMint: tokenBondingAcct.baseMint,
        targetMint: tokenBondingAcct.targetMint,
        baseAmount: pre! - post!,
        slippage: 0.5,
      });
      expect(newTargetAmount).to.within(0.02, targetAmount!);
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
      await createAtaAndMint(provider, baseMint, INITIAL_BALANCE);
      curve = await tokenBondingProgram.initializeCurve({
        config: new TimeCurveConfig()
          .addCurve(
            0,
            new ExponentialCurveConfig({
              c: 0,
              b: 1,
              pow: 0,
              frac: 1,
            })
          )
          .addCurve(
            15, // 20 seconds
            new ExponentialCurveConfig({
              c: 1,
              b: 0,
              pow: 1,
              frac: 1,
            })
          ),
      });

      ({ tokenBonding } = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        generalAuthority: me,
        buyBaseRoyaltyPercentage: 0,
        buyTargetRoyaltyPercentage: 0,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
        mintCap: new BN(1000), // 10.0
      }));
      tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      )) as TokenBondingV0;
    });

    it("switches from a fixed price model to a linear model", async () => {
      await tokenBondingProgram.buy({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.5,
      });
      await tokenUtils.expectAtaBalance(
        me,
        tokenBondingAcct.baseMint,
        INITIAL_BALANCE / Math.pow(10, DECIMALS) - 1
      );

      await waitForUnixTime(
        provider.connection,
        BigInt(tokenBondingAcct.goLiveUnixTime.toNumber() + 15)
      );
      await tokenBondingProgram.sell({
        tokenBonding,
        targetAmount: new BN(50),
        slippage: 0.5,
      });

      await tokenUtils.expectAtaBalance(
        me,
        tokenBondingAcct.baseMint,
        INITIAL_BALANCE / Math.pow(10, DECIMALS) - 0.25
      );
    });
  });

  describe("time decay curve", () => {
    let curve: PublicKey;
    let tokenBonding: PublicKey;
    let tokenBondingAcct: TokenBondingV0;
    const INITIAL_BALANCE = 1000;
    const DECIMALS = 2;

    before(async () => {
      const baseMint = await createMint(provider, me, DECIMALS);
      await createAtaAndMint(provider, baseMint, INITIAL_BALANCE);
      curve = await tokenBondingProgram.initializeCurve({
        config: new TimeDecayExponentialCurveConfig({
          c: 1,
          k0: 2,
          k1: 0.5,
          interval: 10,
          d: 0.5,
        }),
      });

      ({ tokenBonding } = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        generalAuthority: me,
        buyBaseRoyaltyPercentage: 0,
        buyTargetRoyaltyPercentage: 0,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
        mintCap: new BN(1000), // 10.0
      }));
      tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      )) as TokenBondingV0;
    });

    it("The price slowly drops over the interval", async () => {
      const { targetAmount: amount0 } = await tokenBondingProgram.swap({
        baseMint: tokenBondingAcct.baseMint,
        targetMint: tokenBondingAcct.targetMint,
        baseAmount: 1,
        slippage: 1,
      });
      // expect(amount0).to.within(0.001, 0.5);
      await waitForUnixTime(
        provider.connection,
        BigInt(tokenBondingAcct.goLiveUnixTime.toNumber() + 10)
      );

      const { targetAmount: amount1 } = await tokenBondingProgram.swap({
        baseMint: tokenBondingAcct.baseMint,
        targetMint: tokenBondingAcct.targetMint,
        baseAmount: 1,
        slippage: 0.05,
      });
      expect(amount1).lt(amount0);
    });
  });

  describe("edge cases", () => {
    let baseMint: PublicKey;
    let curve: PublicKey;
    let tokenBonding: PublicKey;
    let tokenBondingAcct: TokenBondingV0;
    let buyBaseRoyalties: PublicKey;
    let sellBaseRoyalties: PublicKey;
    let buyTargetRoyalties: PublicKey;
    let sellTargetRoyalties: PublicKey;
    const INITIAL_BALANCE = 1000;
    const DECIMALS = 2;
    beforeEach(async () => {
      baseMint = await createMint(provider, me, DECIMALS);
      await createAtaAndMint(
        provider,
        baseMint,
        INITIAL_BALANCE,
        newWallet.publicKey
      );
      curve = await tokenBondingProgram.initializeCurve({
        config: new ExponentialCurveConfig({
          c: 0,
          b: 1,
          pow: 0,
          frac: 1,
        }),
      });

      ({
        tokenBonding,
        buyBaseRoyalties,
        sellBaseRoyalties,
        buyTargetRoyalties,
        sellTargetRoyalties,
      } = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        generalAuthority: me,
        buyBaseRoyaltyPercentage: 0,
        sellBaseRoyaltyPercentage: 0,
        buyTargetRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
        mintCap: new BN(1000), // 10.0
      }));
      tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      )) as TokenBondingV0;
    });

    it("does not fail when the royalty account is closed and royalties are 0", async () => {
      await tokenBondingProgram.sendInstructions(
        [
          Token.createCloseAccountInstruction(
            TOKEN_PROGRAM_ID,
            buyBaseRoyalties,
            me,
            me,
            []
          ),
        ],
        []
      );
      const { instructions, signers } =
        await tokenBondingProgram.buyInstructions({
          tokenBonding,
          desiredTargetAmount: new BN(100),
          slippage: 0.5,
          sourceAuthority: newWallet.publicKey,
        });
      await tokenBondingProgram.sendInstructions(instructions, [
        ...signers,
        newWallet,
      ]);

      const { instructions: instructions2, signers: signers2 } =
        await tokenBondingProgram.sellInstructions({
          tokenBonding,
          targetAmount: new BN(100),
          slippage: 0.5,
          sourceAuthority: newWallet.publicKey,
        });
      await tokenBondingProgram.sendInstructions(instructions2, [
        ...signers2,
        newWallet,
      ]);

      await tokenUtils.expectAtaBalance(
        newWallet.publicKey,
        tokenBondingAcct.targetMint,
        0
      );
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.baseMint, 0);
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0);
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
      await createAtaAndMint(provider, baseMint, INITIAL_BALANCE);
      await createAtaAndMint(
        provider,
        baseMint,
        INITIAL_BALANCE,
        newWallet.publicKey
      );
      curve = await tokenBondingProgram.initializeCurve({
        config: new ExponentialCurveConfig({
          c: 0,
          b: 1,
          pow: 0,
          frac: 1,
        }),
      });
    });

    async function createCurve(
      buyBaseRoyaltyPercentage: number,
      buyTargetRoyaltyPercentage: number,
      sellBaseRoyaltyPercentage: number,
      sellTargetRoyaltyPercentage: number
    ) {
      ({ tokenBonding } = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        generalAuthority: me,
        buyBaseRoyaltyPercentage,
        buyTargetRoyaltyPercentage,
        sellBaseRoyaltyPercentage,
        sellTargetRoyaltyPercentage,
        mintCap: new BN(1000), // 10.0
      }));
      tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      )) as TokenBondingV0;
    }

    it("correctly rewards with base royalties", async () => {
      await createCurve(20, 0, 0, 0);

      const { instructions, signers } =
        await tokenBondingProgram.buyInstructions({
          tokenBonding,
          desiredTargetAmount: new BN(100),
          slippage: 0.05,
          sourceAuthority: newWallet.publicKey,
        });

      const tx = new Transaction();
      tx.add(...instructions);
      await provider.sendAndConfirm(tx, [...signers, newWallet]);

      await tokenUtils.expectAtaBalance(
        newWallet.publicKey,
        tokenBondingAcct.targetMint,
        1
      );
      await tokenUtils.expectAtaBalance(
        me,
        tokenBondingAcct.baseMint,
        INITIAL_BALANCE / Math.pow(10, DECIMALS) + 0.2
      );
    });

    it("correctly rewards with target royalties", async () => {
      await createCurve(0, 20, 0, 0);

      const { instructions, signers } =
        await tokenBondingProgram.buyInstructions({
          tokenBonding,
          desiredTargetAmount: new BN(100),
          slippage: 0.05,
          sourceAuthority: newWallet.publicKey,
        });

      const tx = new Transaction();
      tx.add(...instructions);
      await provider.sendAndConfirm(tx, [...signers, newWallet]);

      await tokenUtils.expectAtaBalance(
        newWallet.publicKey,
        tokenBondingAcct.targetMint,
        1
      );
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0.25);
    });
  });

  async function createRoyaltyFree(
    c: any,
    initialBalance: number = 100_00
  ): Promise<{ tokenBonding: PublicKey; baseMint: PublicKey }> {
    const baseMint = await createMint(provider, me, 2);
    await createAtaAndMint(provider, baseMint, initialBalance);
    const curve = await tokenBondingProgram.initializeCurve(c);

    const { tokenBonding } = await tokenBondingProgram.createTokenBonding({
      curve,
      reserveAuthority: provider.wallet.publicKey,
      baseMint,
      targetMintDecimals: 2,
      generalAuthority: me,
      buyBaseRoyaltyPercentage: 0,
      buyTargetRoyaltyPercentage: 0,
      sellBaseRoyaltyPercentage: 0,
      sellTargetRoyaltyPercentage: 0,
    });

    return {
      tokenBonding,
      baseMint,
    };
  }
  describe("marketplace", () => {
    it("allows a fixed price", async () => {
      const { tokenBonding, baseMint } = await createRoyaltyFree({
        config: new ExponentialCurveConfig({
          c: 0,
          b: 5,
          pow: 0,
          frac: 1,
        }),
      });
      await tokenBondingProgram.buy({
        tokenBonding,
        desiredTargetAmount: new BN(100),
        slippage: 0.05,
      });
      await tokenUtils.expectAtaBalance(me, baseMint, 95);
      const tokenBondingAcct2 = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
      expect(tokenBondingAcct2.reserveBalanceFromBonding.toNumber()).to.eq(
        5 * 100
      );
      expect(tokenBondingAcct2.supplyFromBonding.toNumber()).to.eq(1 * 100);
    });
  });

  it("handles large purchases when exponential", async () => {
    const { tokenBonding, baseMint } = await createRoyaltyFree(
      {
        config: new TimeCurveConfig().addCurve(
          0,
          new ExponentialCurveConfig({
            c: 1,
            b: 0,
            pow: 1,
            frac: 10,
          })
        ),
      },
      10000000000000
    );
    await tokenBondingProgram.buy({
      tokenBonding,
      baseAmount: 100000000000,
      slippage: 0.05,
    });
  });

  describe("shock absorbtion on curve change", () => {
    it("handles buy with target", async () => {
      const { tokenBonding, baseMint } = await createRoyaltyFree({
        config: new TimeCurveConfig()
          .addCurve(
            0,
            new ExponentialCurveConfig({
              c: 0,
              b: 1,
              pow: 0,
              frac: 1,
            })
          )
          .addCurve(
            1,
            new ExponentialCurveConfig({
              c: 0,
              b: 1,
              pow: 0,
              frac: 1,
            }),
            {
              interval: 200,
              percentage: percent(10),
            },
            null
          ),
      });
      const tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
      const ata = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenBondingAcct.baseMint,
        me
      );
      const targetAta = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenBondingAcct.targetMint,
        me
      );
      await waitForUnixTime(
        provider.connection,
        BigInt(tokenBondingAcct.goLiveUnixTime.toNumber() + 1)
      );
      await tokenBondingProgram.buy({
        tokenBonding,
        desiredTargetAmount: 10,
        slippage: 0.05,
      });
      const balance = (await provider.connection.getTokenAccountBalance(ata))
        .value.uiAmount;
      // 1:1, so we would expect without shock we'd have 90
      expect(balance).to.be.lessThan(90);
      tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 10);
    });

    it("handles buy with base", async () => {
      const { tokenBonding, baseMint } = await createRoyaltyFree({
        config: new TimeCurveConfig()
          .addCurve(
            0,
            new ExponentialCurveConfig({
              c: 0,
              b: 1,
              pow: 0,
              frac: 1,
            })
          )
          .addCurve(
            1,
            new ExponentialCurveConfig({
              c: 0,
              b: 1,
              pow: 0,
              frac: 1,
            }),
            {
              interval: 200,
              percentage: percent(10),
            },
            null
          ),
      });
      const tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
      await waitForUnixTime(
        provider.connection,
        BigInt(tokenBondingAcct.goLiveUnixTime.toNumber() + 1)
      );
      const targetAta = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenBondingAcct.targetMint,
        me
      );
      await tokenBondingProgram.buy({
        tokenBonding,
        baseAmount: 10,
        slippage: 0.05,
      });
      const targetBalance = (
        await provider.connection.getTokenAccountBalance(targetAta)
      ).value.uiAmount;
      // Should still take 10, but I should get less than 10 in target mint
      tokenUtils.expectAtaBalance(me, tokenBondingAcct.baseMint, 90);
      expect(targetBalance).to.be.lessThan(10);
    });

    it("handles sell", async () => {
      const { tokenBonding, baseMint } = await createRoyaltyFree({
        config: new TimeCurveConfig()
          .addCurve(
            0,
            new ExponentialCurveConfig({
              c: 0,
              b: 1,
              pow: 0,
              frac: 1,
            })
          )
          .addCurve(
            1,
            new ExponentialCurveConfig({
              c: 0,
              b: 1,
              pow: 0,
              frac: 1,
            }),
            null,
            {
              interval: 200,
              percentage: percent(10),
            }
          ),
      });
      const tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;
      await waitForUnixTime(
        provider.connection,
        BigInt(tokenBondingAcct.goLiveUnixTime.toNumber() + 1)
      );
      const ata = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        tokenBondingAcct.baseMint,
        me
      );
      await tokenBondingProgram.buy({
        tokenBonding,
        desiredTargetAmount: 10,
        slippage: 0.05,
      });
      await tokenBondingProgram.sell({
        tokenBonding,
        targetAmount: 10,
        slippage: 0.05,
      });
      const balance = (await provider.connection.getTokenAccountBalance(ata))
        .value.uiAmount;
      // 1:1, so we would expect without shock we'd less than our full amount back
      expect(balance).to.be.lessThan(100);
      tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0);
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
          b: 0,
          pow: 1,
          frac: 1,
        }),
      });

      ({ tokenBonding } = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint,
        targetMintDecimals: DECIMALS,
        generalAuthority: me,
        buyBaseRoyaltyPercentage: 5,
        buyTargetRoyaltyPercentage: 10,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
        mintCap: new BN(1000), // 10.0
      }));
      tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      )) as TokenBondingV0;
    });

    it("allows buy/sell", async () => {
      // Also ensure zero sum.
      const initLamports = (await provider.connection.getAccountInfo(me))!
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
      const lamports = (await provider.connection.getAccountInfo(me))!.lamports;
      expect(lamports).to.within(100000000, initLamports);
    });
  });

  describe("zero sum tests", () => {
    let baseMint: PublicKey;
    let curve: PublicKey;
    let tokenBonding: PublicKey;
    const INITIAL_BALANCE = 1000000000000000;
    const DECIMALS = 2;

    const curves = [
      {
        config: new ExponentialCurveConfig({
          c: 0.0001,
          b: 0,
          pow: 1,
          frac: 2,
        }),
      },
      {
        config: new ExponentialCurveConfig({
          c: 0.0002,
          b: 0,
          pow: 1,
          frac: 2,
        }),
      },
      {
        config: new ExponentialCurveConfig({
          c: 0,
          b: 0.1,
          pow: 0,
          frac: 1,
        }),
      },
    ];

    function roundToDecimals(num: number, decimals: number): number {
      return Math.trunc(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
    }

    curves.forEach((curveSpec, index) => {
      it(`is zero sum with curve ${index}`, async () => {
        baseMint = await createMint(provider, me, DECIMALS);
        await createAtaAndMint(provider, baseMint, INITIAL_BALANCE);
        // @ts-ignore
        curve = await tokenBondingProgram.initializeCurve(curveSpec);

        ({ tokenBonding } = await tokenBondingProgram.createTokenBonding({
          curve,
          baseMint,
          targetMintDecimals: DECIMALS,
          generalAuthority: me,
          buyBaseRoyaltyPercentage: 0,
          buyTargetRoyaltyPercentage: 0,
          sellBaseRoyaltyPercentage: 0,
          sellTargetRoyaltyPercentage: 0,
        }));
        const tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(
          tokenBonding
        )) as TokenBondingV0;

        await tokenBondingProgram.buy({
          tokenBonding,
          desiredTargetAmount: new BN(5000),
          slippage: 0.5,
        });

        // Test buy with base amount, sell with target amount
        const { targetAmount } = await tokenBondingProgram.swap({
          baseMint: tokenBondingAcct.baseMint,
          targetMint: tokenBondingAcct.targetMint,
          baseAmount: new BN(10),
          slippage: 0.5,
        });
        await tokenBondingProgram.sell({
          tokenBonding,
          targetAmount,
          slippage: 0.5,
        });

        await tokenBondingProgram.buy({
          tokenBonding,
          desiredTargetAmount: new BN(100_000_000_00000),
          slippage: 0.5,
        });

        // Ensure at high prices, the price stays consistent
        const ata = await Token.getAssociatedTokenAddress(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          baseMint,
          me
        );
        const pre = (await provider.connection.getTokenAccountBalance(ata))!
          .value.uiAmount!;
        await tokenBondingProgram.buy({
          tokenBonding,
          desiredTargetAmount: new BN(50),
          slippage: 0.5,
        });
        await tokenBondingProgram.buy({
          tokenBonding,
          desiredTargetAmount: new BN(80),
          slippage: 0.5,
        });
        await tokenBondingProgram.sell({
          tokenBonding,
          targetAmount: new BN(50 + 80),
          slippage: 0.5,
        });

        const post = (await provider.connection.getTokenAccountBalance(ata))!
          .value.uiAmount!;
        // Buy rounds up, sell rounds down. So we can potentially be off by 3 of the smallest unit
        expect(post).to.within(3 / Math.pow(10, DECIMALS), pre!);

        await tokenBondingProgram.sell({
          tokenBonding,
          targetAmount: new BN(9000000000000),
          slippage: 0.5,
        });

        await tokenBondingProgram.sell({
          tokenBonding,
          targetAmount: new BN(1000000005000),
          slippage: 0.5,
        });

        await tokenUtils.expectBalanceWithin(
          tokenBondingAcct.baseStorage,
          0,
          0.04
        ); // Rounding errors always go in base storage favor, so nobody can rob with wiggling
        await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0);
      });
    });
  });

  describe("nested curves", () => {
    let baseMint: PublicKey;
    let tokenBonding: PublicKey;
    let tokenBondingAcct: ITokenBonding;
    const INITIAL_BALANCE = 100000000;
    const DECIMALS = 2;
    let targetAmount: number;
    let pricing: BondingPricing;

    const curves = [
      {
        config: new ExponentialCurveConfig({
          c: 0,
          b: 2,
          pow: 0,
          frac: 1,
        }),
      },
      {
        config: new ExponentialCurveConfig({
          c: 0,
          b: 5,
          pow: 0,
          frac: 1,
        }),
      },
      {
        config: new ExponentialCurveConfig({
          c: 0,
          b: 2,
          pow: 0,
          frac: 1,
        }),
      },
    ];

    before(async () => {
      baseMint = await createMint(provider, me, DECIMALS);
      await createAtaAndMint(provider, baseMint, INITIAL_BALANCE);

      let currentBaseMint = baseMint;
      for (const curveSpec of curves) {
        // @ts-ignore
        const curve = await tokenBondingProgram.initializeCurve(curveSpec);
        let targetMint;
        ({ tokenBonding, targetMint } =
          await tokenBondingProgram.createTokenBonding({
            curve,
            baseMint: currentBaseMint,
            targetMintDecimals: DECIMALS,
            generalAuthority: me,
            buyBaseRoyaltyPercentage: 0,
            buyTargetRoyaltyPercentage: 0,
            sellBaseRoyaltyPercentage: 0,
            sellTargetRoyaltyPercentage: 0,
          }));
        currentBaseMint = targetMint;
      }

      tokenBondingAcct = (await tokenBondingProgram.getTokenBonding(
        tokenBonding
      ))!;

      // 100 -> 50 --> 50/5 (10) -> 10/2 (5)
      ({ targetAmount } = await tokenBondingProgram.swap({
        baseMint,
        targetMint: tokenBondingAcct.targetMint,
        baseAmount: 100,
        slippage: 0.5,
      }));
      pricing = (await tokenBondingProgram.getPricing(tokenBonding))!;
    });

    it("correctly bought up to the target", async () => {
      expect(targetAmount).to.eq(5);
    });

    describe("pricing", () => {
      it("can display the current price in terms of the base token", () => {
        expect(pricing.current(baseMint)).to.eq(2 * 5 * 2);
      });

      it("can display the tvl in terms of the base token", () => {
        expect(pricing.locked(baseMint)).to.eq(5 * 2 * 5 * 2);
      });

      it("can tell what amount of base I will get for selling target", () => {
        expect(pricing.sellTargetAmount(2, baseMint)).to.eq(2 * 2 * 5 * 2);
      });

      it("can tell what amount of base I will need to buy a target amount", () => {
        expect(pricing.buyTargetAmount(2, baseMint)).to.eq(2 * 2 * 5 * 2);
      });

      it("can tell what amount of target I will get for a given base amount", () => {
        expect(pricing.buyWithBaseAmount(100, baseMint)).to.eq(5);
      });

      it("can tell what amount of target I will get for a given negative base amount", () => {
        expect(pricing.buyWithBaseAmount(-100, baseMint)).to.eq(-5);
      });

      it("can tell what amount of target I will get for a given base amount (swapTargetAmount)", () => {
        expect(
          pricing.swapTargetAmount(100, baseMint, tokenBondingAcct.targetMint)
        ).to.eq(-5);
      });

      it("can tell what amount of base I will get for selling target (swapTargetAmount)", () => {
        expect(
          pricing.swapTargetAmount(5, tokenBondingAcct.targetMint, baseMint)
        ).to.eq(100);
      });
    });

    it("allows selling with swap", async () => {
      ({ targetAmount } = await tokenBondingProgram.swap({
        baseMint: tokenBondingAcct.targetMint,
        targetMint: baseMint,
        baseAmount: 5,
        slippage: 0.5,
      }));
      await tokenUtils.expectAtaBalance(me, tokenBondingAcct.targetMint, 0);
      await tokenUtils.expectAtaBalance(
        me,
        baseMint,
        INITIAL_BALANCE / Math.pow(10, DECIMALS)
      );
    });
  });

  describe("reserve authority", () => {
    it("can transfer funds from the curve", async () => {
      const { tokenBonding, baseMint } = await createRoyaltyFree({
        config: new ExponentialCurveConfig({
          c: 0,
          b: 5,
          pow: 0,
          frac: 1,
        }),
      });
      const ata = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        baseMint,
        me
      );
      const initialBalance = (
        await provider.connection.getTokenAccountBalance(ata)
      ).value.uiAmount!;
      await tokenBondingProgram.buy({
        tokenBonding,
        baseAmount: 10,
        slippage: 0.05,
      });
      await tokenBondingProgram.transferReserves({
        tokenBonding,
        amount: 10,
      });
      await tokenUtils.expectAtaBalance(me, baseMint, initialBalance);

      // Test that close works, since the curve is empty
      await tokenBondingProgram.close({
        tokenBonding,
      });
    });

    it("can transfer funds from the curve when native", async () => {
      // Also ensure zero sum.
      const initLamports = (await provider.connection.getAccountInfo(me))!
        .lamports;
      const curve = await tokenBondingProgram.initializeCurve({
        config: new ExponentialCurveConfig({
          c: 1,
          b: 0,
          pow: 1,
          frac: 1,
        }),
      });

      const { tokenBonding } = await tokenBondingProgram.createTokenBonding({
        curve,
        baseMint: NATIVE_MINT,
        reserveAuthority: me,
        targetMintDecimals: 2,
        generalAuthority: me,
        buyBaseRoyaltyPercentage: 0,
        buyTargetRoyaltyPercentage: 0,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
        mintCap: new BN(1000), // 10.0
      });
      await tokenBondingProgram.buy({
        tokenBonding,
        baseAmount: 2,
        slippage: 0.05,
      });
      await tokenBondingProgram.transferReserves({
        tokenBonding,
        amount: 2,
      });
      const postLamports = (await provider.connection.getAccountInfo(me))!
        .lamports;

      expect(postLamports).to.within(100000000, initLamports);

      // Test that close works, since the curve is empty
      await tokenBondingProgram.close({
        tokenBonding,
      });
    });
  });
});
