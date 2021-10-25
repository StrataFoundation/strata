import fs from "fs";
import * as anchor from "@wum.bo/anchor";
import { getMintInfo } from "@project-serum/common";
import axios from "axios";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { SplWumboIDL, SplWumboIDLJson, TokenRefV0 } from "@wum.bo/spl-wumbo";
import {
  SplTokenBondingIDL,
  SplTokenBondingIDLJson,
  TokenBondingV0,
  Curve,
  fromCurve,
  amountAsNum,
} from "@wum.bo/spl-token-bonding";
import { TokenAccountParser, TokenAccount } from "@wum.bo/spl-utils";
import {
  getHashedName,
  getNameAccountKey,
  ReverseTwitterRegistryState,
} from "@solana/spl-name-service";

const WUMBO_INSTANCE: PublicKey = new PublicKey(
  "BRP7kHUu1c4MMLVauHQF6Jc34iH1EcQaWMijErVXk9S6"
);

const WUM_BONDING: PublicKey = new PublicKey(
  "BiNJNE279p9mP2pYMJfqkStdotLY9mCWSs4PJaPB2aj2"
);

const WUM_TOKEN: PublicKey = new PublicKey(
  "8ZEdEGcrPCLujEQuuUsmuosx2osuuCa8Hfm5WwKW73Ka"
);

const TWITTER_VERIFIER = new PublicKey(
  "DTok7pfUzNeNPqU3Q6foySCezPQE82eRyhX1HdhVNLVC"
);

const TWITTER_TLD = new PublicKey(
  "Fhqd3ostRQQE65hzoA7xFMgT9kge2qPnsTNAKuL2yrnx"
);

const splTokenBondingProgramId = new PublicKey(
  "TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN"
);

const splWumboProgramId = new PublicKey(
  "WumbodN8t7wcDPCY2nGszs4x6HRtL5mJcTR519Qr6m7"
);

const getTwitterName = async (connection: Connection, owner: PublicKey) => {
  const hashedName = await getHashedName(owner.toString());
  const key = await getNameAccountKey(
    hashedName,
    TWITTER_VERIFIER,
    TWITTER_TLD
  );

  return ReverseTwitterRegistryState.retrieve(connection, key);
};

const dump: { inputs: Record<string, any>; outputs: Record<string, any> } = {
  inputs: {},
  outputs: {},
};

const run = async () => {
  console.log(process.env.ANCHOR_PROVIDER_URL);
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();

  const splTokenBonding = new anchor.Program(
    SplTokenBondingIDLJson,
    splTokenBondingProgramId,
    provider
  ) as anchor.Program<SplTokenBondingIDL>;

  const splWumbo = new anchor.Program(
    SplWumboIDLJson,
    splWumboProgramId,
    provider
  ) as anchor.Program<SplWumboIDL>;

  const betaParticipants: { publicKey: string }[] = await axios({
    url: "https://prod-api.teamwumbo.com/graphql",
    method: "post",
    data: {
      query: `query {
        topWumHolders(startRank:0, stopRank:500000) {
          publicKey
        }
      }`,
    },
  }).then((res: any) => res.data.data.topWumHolders);

  const tokenBondingAccts = await splTokenBonding.account.tokenBondingV0.all();
  const wumBondingAcct = await splTokenBonding.account.tokenBondingV0.fetch(
    WUM_BONDING
  );

  const tokenBondingAcctsWithWumBase = tokenBondingAccts.filter(
    (tokenBondingAcct) => tokenBondingAcct.account.baseMint.equals(WUM_TOKEN)
  );

  const tokenBondingAcctsByTargetMint: { [key: string]: TokenBondingV0 } =
    tokenBondingAcctsWithWumBase.reduce(
      (acc, tokenBondingAcct) => ({
        ...acc,
        [tokenBondingAcct.account.targetMint.toBase58()]:
          tokenBondingAcct.account,
      }),
      {}
    );

  const mints = new Set([
    WUM_TOKEN.toBase58(),
    ...tokenBondingAcctsWithWumBase.map((tokenBondingAcct) =>
      tokenBondingAcct.account.targetMint.toBase58()
    ),
  ]);

  const tokenAcctsByBetaParticipant: { [key: string]: TokenAccount[] } =
    await betaParticipants.reduce(
      async (accP, { publicKey }, currentIndex, orgArray) => {
        const acc = await accP;
        console.log(
          `Retrieving tokenAccts for betaParticipant ${currentIndex + 1} of ${
            orgArray.length
          }`
        );

        const tokenAccts = await provider.connection.getTokenAccountsByOwner(
          new PublicKey(publicKey),
          { programId: TOKEN_PROGRAM_ID }
        );

        const parsedTokenAccts = tokenAccts.value.map(({ pubkey, account }) =>
          TokenAccountParser(pubkey.toBase58(), account)
        );

        const filteredTokenAccts = parsedTokenAccts.filter((tokenAcct) =>
          tokenAcct?.info?.mint
            ? mints.has(tokenAcct?.info?.mint?.toBase58())
            : false
        );

        return {
          ...acc,
          [publicKey]: filteredTokenAccts,
        };
      },
      Promise.resolve({})
    );

  let curveAcct: any;
  const [totalWumByBetaParticipant, totalSupplyByMint] = await Object.entries(
    tokenAcctsByBetaParticipant
  ).reduce(
    async (
      accP: Promise<Record<string, number>[]>,
      [betaParticipant, tokenAccts],
      currentIndex,
      orgArray
    ) => {
      const [totalWumByBetaParticipantAcc, totalSupplyByMintAcc] = await accP;
      console.log(
        `Processing: betaParticipant ${currentIndex + 1} of ${orgArray.length}`
      );

      for (const tokenAcct of tokenAccts) {
        let tokenBondingAcct;
        let targetMint;
        let baseMint;
        let reclaimedAmount = 0;
        const [hasAmount, isWum] = [
          !!tokenAcct.info.amount,
          tokenAcct.info.mint.equals(WUM_TOKEN),
        ];

        if (hasAmount) {
          if (isWum) {
            tokenBondingAcct = wumBondingAcct;
            targetMint = await getMintInfo(
              provider,
              tokenBondingAcct.targetMint
            );
            reclaimedAmount = amountAsNum(tokenAcct.info.amount, targetMint);
            totalWumByBetaParticipantAcc[betaParticipant] =
              reclaimedAmount +
              (totalWumByBetaParticipantAcc[betaParticipant] || 0);
          } else {
            tokenBondingAcct =
              tokenBondingAcctsByTargetMint[tokenAcct.info.mint.toBase58()];
            targetMint = await getMintInfo(
              provider,
              tokenBondingAcct.targetMint
            );
            baseMint = await getMintInfo(provider, tokenBondingAcct.baseMint);

            if (!curveAcct) {
              curveAcct = await splTokenBonding.account.curveV0.fetch(
                tokenBondingAcct.curve
              );
            }

            const curve: Curve = fromCurve(curveAcct, baseMint, targetMint);

            const targetAmountNum = amountAsNum(
              tokenAcct.info.amount,
              targetMint
            );
            reclaimedAmount = curve.sellTargetAmount(targetAmountNum);

            totalWumByBetaParticipantAcc[betaParticipant] =
              reclaimedAmount +
              (totalWumByBetaParticipantAcc[betaParticipant] || 0);

            totalSupplyByMintAcc[tokenAcct.info.mint.toBase58()] =
              targetAmountNum +
              (totalSupplyByMintAcc[tokenAcct.info.mint.toBase58()] || 0);
          }
        }
      }

      return [totalWumByBetaParticipantAcc, totalSupplyByMintAcc];
    },
    Promise.resolve([{}, {}])
  );

  const top11CreatorsBySupply = await Object.keys(totalSupplyByMint)
    .reduce(async (accP: Promise<(string | number)[][]>, mint) => {
      const acc = await accP;
      console.log("Determining top 11");

      const [reverseTokenRef] = await PublicKey.findProgramAddress(
        [
          Buffer.from("reverse-token-ref", "utf-8"),
          WUMBO_INSTANCE.toBuffer(),
          new PublicKey(mint).toBuffer(),
        ],
        splWumboProgramId
      );

      try {
        const reverseTokenRefAcct: TokenRefV0 =
          await splWumbo.account.tokenRefV0.fetch(reverseTokenRef);

        const hasOwner = !!(reverseTokenRefAcct.owner as PublicKey);

        if (!hasOwner) return acc;

        acc.push([
          (reverseTokenRefAcct.owner as PublicKey).toBase58(),
          totalSupplyByMint[mint],
        ]);
      } catch (e) {
        console.error(e);
      }

      return acc;
    }, Promise.resolve([]))
    .then((multiArrayOfCreatorsWum) =>
      multiArrayOfCreatorsWum
        .sort(([_a, a]: any, [_b, b]: any) => (a > b ? -1 : 1))
        .slice(0, 11)
        .reduce(async (accP, [owner, supply]) => {
          const acc = await accP;
          const handle = await getTwitterName(
            provider.connection,
            new PublicKey(owner)
          );

          return {
            ...acc,
            [owner]: {
              handle: handle.twitterHandle,
              totalWum: totalWumByBetaParticipant[owner],
              totalSupply: supply,
            },
          };
        }, Promise.resolve({}))
    );

  dump.inputs["betaParticipants"] = betaParticipants;
  dump.inputs["tokenBondingAcctsWithWumBase"] = tokenBondingAcctsWithWumBase;
  dump.inputs["mints"] = mints;
  dump.inputs["tokenAcctsByBetaParticipant"] = tokenAcctsByBetaParticipant;
  dump.outputs["totalWumByBetaParticipant"] = totalWumByBetaParticipant;
  dump.outputs["totalSupplyByMint"] = totalSupplyByMint;
  dump.outputs["top11CreatorsBySupply"] = top11CreatorsBySupply;

  fs.writeFile("./aggregateBetaDump.json", JSON.stringify(dump), (err) => {
    if (err) {
      console.error("Error writing file", err);
    }
  });

  fs.writeFile(
    "./aggregateBetaOutput.json",
    JSON.stringify(top11CreatorsBySupply),
    (err) => {
      if (err) {
        console.error("Error writing file", err);
      }
    }
  );
};

(async () => {
  try {
    await run();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
