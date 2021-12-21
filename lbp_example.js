const { Token, ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const BN = require("bn.js");
const { SplTokenBonding } = require("./packages/spl-token-bonding/dist/lib");

const timeCurve = await tokenBondingSdk.initializeCurve({
  config: new TimeCurveConfig().addCurve(
      0,
      new ExponentialCurveConfig({
        c: 1,
        b: 0,
        pow: 5,
        frac: 1
      })
    ).addCurve(
      1 * 60 * 60, // 1 hour
      new ExponentialCurveConfig({
        c: 1,
        b: 0,
        pow: 4,
        frac: 1
      })
    ).addCurve(
      2 * 60 * 60, // 2 hours
      new ExponentialCurveConfig({
        c: 1,
        b: 0,
        pow: 3,
        frac: 1
      })
    ).addCurve(
      3 * 60 * 60, // 3 hours
      new ExponentialCurveConfig({
        c: 1,
        b: 0,
        pow: 2,
        frac: 1
      })
    ).addCurve(
      4 * 60 * 60, // 4 hours
      new ExponentialCurveConfig({
        c: 1,
        b: 0,
        pow: 1,
        frac: 1
      })
    )
});

const { tokenBonding } = await tokenBondingSdk.createTokenBonding({
  curve,
  baseStorage: await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    SplTokenBonding.WRAPPED_SOL_MINT,
    provider.wallet.publicKey
  ),
  baseMint: new PublicKey("So11111111111111111111111111111111111111112"),
  targetMintDecimals: 2,
  mintCap: new BN(100_000),
  buyBaseRoyaltyPercentage: 0,
  buyTargetRoyaltyPercentage: 0,
  sellBaseRoyaltyPercentage: 0,
  sellTargetRoyaltyPercentage: 0
})
const tokenBondingAcct = await tokenBondingSdk.getTokenBonding(tokenBonding);

"ACmLdZhtECp9HPfNLuoH918wPC7WRVErtVFrfqbyy48B"
1 SOL ≈ 15.538466007