import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ExponentialCurveConfig, SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { getMetadata } from "@strata-foundation/spl-utils";
import fs from "fs";

async function run() {
  console.log(process.env.ANCHOR_PROVIDER_URL)
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();

  const tokenBondingSdk = await SplTokenBonding.init(provider);
  const tokenCollectiveSdk = await SplTokenCollective.init(provider);
  const openMintKeypair = Keypair.fromSecretKey(new Uint8Array(JSON.parse(fs.readFileSync(process.env.OPEN_MINT_PATH!).toString())));
  
  await tokenBondingSdk.initializeSolStorage();
  const curve = await tokenBondingSdk.initializeCurve({
    config: new ExponentialCurveConfig({
      c: 0.001,
      b: 0,
      pow: 1,
      frac: 2
    })
  });
  const socialCurve = await tokenBondingSdk.initializeCurve({
    config: new ExponentialCurveConfig({
      c: 0.0001,
      b: 0,
      pow: 1,
      frac: 2
    })
  });

  const { collective, tokenBonding } = await tokenCollectiveSdk.createCollective({
    metadata: {
      name: "Open Collective",
      symbol: "OPEN",
      uri: "https://strata-token-metadata.s3.us-east-2.amazonaws.com/open.json"
    },
    bonding: {
      targetMintKeypair: openMintKeypair,
      curve,
      baseMint: new PublicKey("So11111111111111111111111111111111111111112"),
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