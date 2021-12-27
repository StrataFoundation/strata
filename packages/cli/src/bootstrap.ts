import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ExponentialCurveConfig, SplTokenBonding, TimeCurve, TimeCurveConfig } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { getMetadata, percent } from "@strata-foundation/spl-utils";
import fs from "fs";

function timeIncrease(curve: TimeCurveConfig): TimeCurveConfig {
  return curve
    // Causes a 9.09091% bump
    .addCurve(6 * 60 * 60, // 6 hours after launch
      new ExponentialCurveConfig({
        c: 1,
        b: 0,
        pow: 1,
        frac: 10
      }),
      null,
      {
        percentage: percent(10)!,
        interval: 6 * 60 * 60, // 6 hours
      }
    )
    // 7.57576% bump
    .addCurve(12 * 60 * 60, // 12 hours after launch
      new ExponentialCurveConfig({
        c: 1,
        b: 0,
        pow: 1,
        frac: 5
      }),
      null,
      {
        percentage: percent(8)!,
        interval: 6 * 60 * 60, // 6 hours
      }
    )
    // 8.33333% bump
    .addCurve(24 * 60 * 60, // 24 hours after launch
      new ExponentialCurveConfig({
        c: 1,
        b: 0,
        pow: 1,
        frac: 3
      }),
      null,
      {
        percentage: percent(9)!,
        interval: 6 * 60 * 60, // 6 hours
      }
    )
    // 8.33333% bump
    .addCurve(32 * 60 * 60, // 32 hours after launch
      new ExponentialCurveConfig({
        c: 1,
        b: 0,
        pow: 1,
        frac: 2
      }),
      null,
      {
        percentage: percent(9)!,
        interval: 6 * 60 * 60, // 6 hours
      }
    )
}

async function run() {
  console.log(process.env.ANCHOR_PROVIDER_URL)
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();

  const tokenBondingSdk = await SplTokenBonding.init(provider);
  const tokenCollectiveSdk = await SplTokenCollective.init(provider);
  const openMintKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(process.env.OPEN_MINT_PATH!).toString())));
  const wrappedSolKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(process.env.WRAPPED_SOL_MINT_PATH!).toString())));

  await tokenBondingSdk.initializeSolStorage({
    mintKeypair: wrappedSolKeypair
  });
  const curve = await tokenBondingSdk.initializeCurve({
    config: timeIncrease(new TimeCurveConfig()
      .addCurve(0, new ExponentialCurveConfig({
        c: 0,
        b: 0.005, // 0.005 SOL per OPEN token starting
        pow: 0,
        frac: 2
      })))
  });
  const socialCurve = await tokenBondingSdk.initializeCurve({
    config: timeIncrease(new TimeCurveConfig()
    .addCurve(0, new ExponentialCurveConfig({
      c: 0,
      b: 1, // 1 OPEN per social token starting
      pow: 0,
      frac: 2
    })))
  });

  const { collective, tokenBonding } = await tokenCollectiveSdk.createCollective({
    metadata: {
      name: "Test Collective",
      symbol: "TEST",
      uri: "https://strata-token-metadata.s3.us-east-2.amazonaws.com/test.json"
    },
    bonding: {
      targetMintKeypair: openMintKeypair,
      curve,
      baseMint: new PublicKey("So11111111111111111111111111111111111111112"),
      index: 0,
      // TODO: If in prod, don't take these authorities
      reserveAuthority: provider.wallet.publicKey,
      curveAuthority: provider.wallet.publicKey,
      targetMintDecimals: 9,
      buyBaseRoyaltyPercentage: 0,
      buyTargetRoyaltyPercentage: 0,
      sellBaseRoyaltyPercentage: 0,
      sellTargetRoyaltyPercentage: 0
    },
    authority: provider.wallet.publicKey,
    config: {
      isOpen: true,
      unclaimedTokenBondingSettings: {
        curve: socialCurve,
        buyBaseRoyalties: {
          ownedByName: true,
        },
        sellBaseRoyalties: {
          ownedByName: true,
        },
        buyTargetRoyalties: {
          ownedByName: true,
        },
        sellTargetRoyalties: {
          ownedByName: true,
        },
        minBuyBaseRoyaltyPercentage: 0,
        maxBuyBaseRoyaltyPercentage: 0,
        minSellBaseRoyaltyPercentage: 0,
        maxSellBaseRoyaltyPercentage: 0,
        minBuyTargetRoyaltyPercentage: 5,
        maxBuyTargetRoyaltyPercentage: 5,
        minSellTargetRoyaltyPercentage: 0,
        maxSellTargetRoyaltyPercentage: 0,
      },
      unclaimedTokenMetadataSettings: {
        symbol: "UNCLAIMED",
        nameIsNameServiceName: true,
        uri: "https://wumbo-token-metadata.s3.us-east-2.amazonaws.com/open.json",
      },
      claimedTokenBondingSettings: {
        maxSellBaseRoyaltyPercentage: 20,
        maxSellTargetRoyaltyPercentage: 20,
      }
    }
  });

  console.log(`Open Collective: ${collective}, bonding: ${tokenBonding}, open: ${openMintKeypair.publicKey}, openMetadata: ${await getMetadata(openMintKeypair.publicKey.toBase58())}`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
})