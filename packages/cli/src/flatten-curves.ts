import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  CurveV0,
  ExponentialCurveConfig,
  SplTokenBonding,
} from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import {
  createMint,
  sendMultipleInstructions,
} from "@strata-foundation/spl-utils";
import readline from "readline";
import fs from "fs";

async function input(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

function checkIsFixedPrice(curve: CurveV0): boolean {
  const hasOneCurve =
    //@ts-ignore
    curve.definition?.timeV0?.curves &&
    //@ts-ignore
    curve.definition.timeV0.curves.length == 1;

  if (!hasOneCurve) return false;

  //@ts-ignore
  const expCurve = curve.definition.timeV0.curves[0]?.curve?.exponentialCurveV0;

  const isFixedCurve =
    expCurve &&
    expCurve.c?.toNumber() === 1000000000000 &&
    expCurve.pow === 0 &&
    expCurve.frac === 1;
  return !!isFixedCurve;
}

async function createTestTokens(
  tokenBondingSdk: SplTokenBonding,
  tokenCollectiveSdk: SplTokenCollective,
  provider: anchor.AnchorProvider
) {
  let config = {
    isOpen: false,
    unclaimedTokenBondingSettings: {
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
    },
    unclaimedTokenMetadataSettings: {
      symbol: "UNCLAIMED",
      uri: "https://wumbo-token-metadata.s3.us-east-2.amazonaws.com/open.json",
      nameIsNameServiceName: true,
    },
  };
  const collective = new PublicKey(
    "3cYa5WvT2bgXSLxxu9XDJSHV3x5JZGM91Nc3B7jYhBL7"
  );
  const goLiveDate = new Date(0);
  goLiveDate.setUTCSeconds(1642690800);

  await createToken(
    tokenBondingSdk,
    tokenCollectiveSdk,
    collective,
    goLiveDate,
    provider
  );
  await createToken(
    tokenBondingSdk,
    tokenCollectiveSdk,
    collective,
    goLiveDate,
    provider
  );
  await createToken(
    tokenBondingSdk,
    tokenCollectiveSdk,
    collective,
    goLiveDate,
    provider
  );
}

async function createToken(
  tokenBondingSdk: SplTokenBonding,
  tokenCollectiveSdk: SplTokenCollective,
  collective: any,
  goLiveDate: any,
  provider: anchor.AnchorProvider
) {
  let curve = await tokenBondingSdk.initializeCurve({
    config: new ExponentialCurveConfig({
      c: 1,
      b: 0,
      pow: 1,
      frac: 1,
    }),
  });
  let owner = Keypair.generate();
  const { instructions, signers } =
    await tokenCollectiveSdk.createSocialTokenInstructions({
      collective,
      owner: owner.publicKey,
      authority: owner.publicKey,
      metadata: {
        name: "test",
        symbol: "TEST",
      },
      tokenBondingParams: {
        goLiveDate,
        curve,
        buyBaseRoyaltyPercentage: 0,
        buyTargetRoyaltyPercentage: 0,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
      },
    });

  await sendMultipleInstructions(
    tokenCollectiveSdk.errors || new Map(),
    provider,
    instructions,
    [signers[0], signers[1], [...signers[2], owner]]
  );
}

export const chunks = <T>(array: T[], size: number): T[][] =>
  Array.apply(0, new Array(Math.ceil(array.length / size))).map((_, index) =>
    array.slice(index * size, (index + 1) * size)
  );

// TODO add some timers to account for rate limiting on mainnet or use genesys
async function run() {
  console.log(`Provider URL: ${process.env.ANCHOR_PROVIDER_URL}`);
  console.log(`Admin Wallet: ${process.env.ANCHOR_WALLET}`);
  const ans = await input(
    "Are you sure you want to run this command at the above network with the above wallet? (y/n) "
  );
  if (ans != "y") {
    console.log("exiting");
    return;
  }

  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  const tokenBondingSdk = await SplTokenBonding.init(provider);
  const tokenCollectiveSdk = await SplTokenCollective.init(provider);

  // uncomment the below line to create some social tokens to test this command on for devnet/localnet
  // await createTestTokens(tokenBondingSdk, tokenCollectiveSdk, provider);
  // return;

  const tokenRefs = await tokenCollectiveSdk.program.account.tokenRefV0.all();
  console.log(`There are ${tokenRefs.length} social tokens to process`);
  // set the current price as the new permanent fixed price
  const newCurve = await tokenBondingSdk.initializeCurve({
    config: new ExponentialCurveConfig({
      c: 1,
      pow: 0,
      frac: 1,
      b: 0,
    }),
  });

  let counter = 0;
  let failed = 0;
  let fixedCounter = 0;
  for (const tokenRefGroup of chunks(tokenRefs, 5)) {
    await Promise.all(
      tokenRefGroup.map(async (tokenRef) => {
        // skip social tokens that aren't on the open collective
        if (
          !tokenRef.account.collective ||
          !tokenRef.account.collective.equals(
            new PublicKey("3cYa5WvT2bgXSLxxu9XDJSHV3x5JZGM91Nc3B7jYhBL7")
          )
        ) {
          return null
        }
        const tokenBonding = (await tokenBondingSdk.getTokenBonding(
          tokenRef.account.tokenBonding!
        ))!;
        const currentCurve = await tokenBondingSdk.getCurve(
          tokenBonding?.curve
        );
        if (!currentCurve) return null;
        // if the curve is already fixed, skip it
        if (checkIsFixedPrice(currentCurve)) {
          fixedCounter += 1;
          return null;
        }

        try {
          await tokenCollectiveSdk.updateCurve({
            tokenRef: tokenRef.publicKey,
            curve: newCurve,
            adminKey: provider.wallet.publicKey,
          });
        } catch (e: any) {
          failed += 1;
          console.error(`Failed to update ${tokenRef.publicKey.toBase58()}`, e);
        }

        counter += 1;
      })
    );
  }
  console.log(`There were ${counter} tokens transformed to fixed curves`);
  console.log(
    `There were ${fixedCounter} tokens that already had fixed curves`
  );

  console.log(`There were ${failed} failures`);
  const collectives = [
    await tokenCollectiveSdk.program.account.collectiveV0.fetch(
      new PublicKey("3cYa5WvT2bgXSLxxu9XDJSHV3x5JZGM91Nc3B7jYhBL7")
    ),
  ];
  console.log(`There are ${collectives.length} collectives to process`);

  let fixedCounter2 = 0;
  let counter2 = 0;
  for (const collective of collectives) {
    const [tokenBondingKey, _] = await SplTokenBonding.tokenBondingKey(
      collective.mint
    );
    const tokenBonding = await tokenBondingSdk.getTokenBonding(tokenBondingKey);
    if (!tokenBonding) continue;
    const currentCurve = await tokenBondingSdk.getCurve(tokenBonding?.curve);

    // if the curve is already fixed, skip it
    if (checkIsFixedPrice(currentCurve)) {
      fixedCounter2 += 1;
      continue;
    }

    // get the current price of the dynamic curve
    const pricing = await tokenBondingSdk.getPricing(tokenBonding.publicKey);
    const currentBuyPrice = pricing.buyTargetAmount(1);

    // set the current price as the new permanent fixed price
    const newCurve = await tokenBondingSdk.initializeCurve({
      config: new ExponentialCurveConfig({
        c: 0,
        pow: 0,
        frac: 1,
        b: currentBuyPrice,
      }),
    });

    await tokenBondingSdk.updateCurve({
      tokenBonding: tokenBondingKey,
      curve: newCurve,
    });

    counter2 += 1;
  }
  console.log(`There were ${counter2} collectives transformed to fixed curves`);
  console.log(
    `There were ${fixedCounter2} collectives that already had fixed curves`
  );
  console.log(
    `There were ${
      collectives.length - counter2 - fixedCounter2
    } collectives that didn't have bonding curves`
  );
  process.exit();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
