import * as anchor from "@project-serum/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  ExponentialCurveConfig,
  SplTokenBonding,
  TimeCurve,
  TimeCurveConfig,
} from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { percent, SplTokenMetadata } from "@strata-foundation/spl-utils";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import fs from "fs";
import {
  NAMESPACES_IDL,
  NAMESPACES_PROGRAM,
  NAMESPACES_PROGRAM_ID,
} from "@cardinal/namespaces";
import { ChatSdk, ChatIDL, IdentifierType } from "@strata-foundation/chat";
//@ts-ignore
import LitJsSdk from "lit-js-sdk";

function timeIncrease(curve: TimeCurveConfig, c: number = 1): TimeCurveConfig {
  return (
    curve
      // Causes a 9.09091% bump
      .addCurve(
        6 * 60 * 60, // 6 hours after launch
        new ExponentialCurveConfig({
          c,
          b: 0,
          pow: 1,
          frac: 10,
        }),
        null,
        {
          percentage: percent(10)!,
          interval: 6 * 60 * 60, // 6 hours
        }
      )
      // 7.57576% bump
      .addCurve(
        12 * 60 * 60, // 12 hours after launch
        new ExponentialCurveConfig({
          c,
          b: 0,
          pow: 1,
          frac: 5,
        }),
        null,
        {
          percentage: percent(8)!,
          interval: 12 * 60 * 60, // 12 hours
        }
      )
      // 8.33333% bump
      .addCurve(
        24 * 60 * 60, // 24 hours after launch
        new ExponentialCurveConfig({
          c,
          b: 0,
          pow: 1,
          frac: 3,
        }),
        null,
        {
          percentage: percent(9)!,
          interval: 12 * 60 * 60, // 12 hours
        }
      )
      // 8.33333% bump
      .addCurve(
        36 * 60 * 60, // 36 hours after launch
        new ExponentialCurveConfig({
          c,
          b: 0,
          pow: 1,
          frac: 2,
        }),
        null,
        {
          percentage: percent(9)!,
          interval: 12 * 60 * 60, // 12 hours
        }
      )
  );
}

async function run() {
  console.log(process.env.ANCHOR_PROVIDER_URL);
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider() as anchor.AnchorProvider;

  const tokenBondingSdk = await SplTokenBonding.init(provider);
  const tokenCollectiveSdk = await SplTokenCollective.init(provider);
  const openMintKeypair = Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(fs.readFileSync(process.env.OPEN_MINT_PATH!).toString())
    )
  );
  const wrappedSolKeypair = Keypair.fromSecretKey(
    new Uint8Array(
      JSON.parse(fs.readFileSync(process.env.WRAPPED_SOL_MINT_PATH!).toString())
    )
  );

  await tokenBondingSdk.initializeSolStorage({
    mintKeypair: wrappedSolKeypair,
  });
  // c S ^ (pow/frac) +  b

  // 0.005
  const curve = await tokenBondingSdk.initializeCurve({
    config: timeIncrease(
      new TimeCurveConfig().addCurve(
        0,
        new ExponentialCurveConfig({
          c: 0,
          b: 0.005, // 0.005 SOL per OPEN token starting
          pow: 0,
          frac: 2,
        })
      ),
      0.005
    ),
  });
  const socialCurve = await tokenBondingSdk.initializeCurve({
    config: timeIncrease(
      new TimeCurveConfig().addCurve(
        0,
        new ExponentialCurveConfig({
          c: 0,
          b: 0.1, // 1 OPEN per 10 social token starting
          pow: 0,
          frac: 2,
        })
      ),
      0.1
    ),
  });

  const goLiveDate = new Date(0);
  goLiveDate.setUTCSeconds(1642604400); // 9am CST on January 19th

  const { collective, tokenBonding } =
    await tokenCollectiveSdk.createCollective({
      metadata: {
        name: "Open Collective",
        symbol: "OPEN",
        uri: "https://strata-token-metadata.s3.us-east-2.amazonaws.com/open.json",
      },
      bonding: {
        targetMintKeypair: openMintKeypair,
        curve,
        baseMint: new PublicKey("So11111111111111111111111111111111111111112"),
        index: 0,
        reserveAuthority: null,
        curveAuthority: new PublicKey(
          "7HJ1MRRXK6MeKVCigSy555rjXrLUiBxvLmFFoBnVmGW9"
        ),
        generalAuthority: new PublicKey(
          "7HJ1MRRXK6MeKVCigSy555rjXrLUiBxvLmFFoBnVmGW9"
        ),
        targetMintDecimals: 9,
        buyBaseRoyaltyPercentage: 0,
        buyTargetRoyaltyPercentage: 0,
        sellBaseRoyaltyPercentage: 0,
        sellTargetRoyaltyPercentage: 0,
        goLiveDate,
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
          uri: "https://strata-token-metadata.s3.us-east-2.amazonaws.com/unclaimed.json",
        },
        claimedTokenBondingSettings: {
          maxSellBaseRoyaltyPercentage: 10,
          maxSellTargetRoyaltyPercentage: 10,
          maxBuyBaseRoyaltyPercentage: 25,
          maxBuyTargetRoyaltyPercentage: 25,
        },
      },
    });

  console.log(
    `Open Collective: ${collective}, bonding: ${tokenBonding}, open: ${
      openMintKeypair.publicKey
    }, openMetadata: ${await Metadata.getPDA(
      openMintKeypair.publicKey.toBase58()
    )}`
  );
  const litClient = new LitJsSdk.LitNodeClient();
  const namespacesProgram = new anchor.Program<NAMESPACES_PROGRAM>(
    NAMESPACES_IDL,
    NAMESPACES_PROGRAM_ID,
    provider
  );
  const ChatIDLJson = await anchor.Program.fetchIdl(ChatSdk.ID, provider);
  const chatProgram = new anchor.Program<ChatIDL>(
    ChatIDLJson as ChatIDL,
    ChatSdk.ID,
    provider
  ) as anchor.Program<ChatIDL>;
  const tokenBondingProgram = await SplTokenBonding.init(
    provider,
    SplTokenBonding.ID
  );
  const tokenMetadataProgram = await SplTokenMetadata.init(provider);

  const chatSdk = new ChatSdk({
    provider,
    program: chatProgram,
    litClient,
    namespacesProgram,
    tokenBondingProgram,
    tokenMetadataProgram,
  });

  await chatSdk.initializeNamespaces();
  const { certificateMint: identifierCertificateMint } =
    await chatSdk.claimIdentifier({
      type: IdentifierType.Chat,
      identifier: "openchat",
    });
  await chatSdk.initializeChat({
    identifierCertificateMint,
    name: "Open Collective Chat",
    imageUrl:
      "https://strata-token-metadata.s3.us-east-2.amazonaws.com/open.png",
    permissions: {
      readPermissionKey: new PublicKey(openMintKeypair.publicKey),
      postPermissionKey: new PublicKey(openMintKeypair.publicKey),
    },
  });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
