import * as anchor from "@wum.bo/anchor";
import { getMintInfo } from "@project-serum/common";
import axios from "axios";
import { PublicKey } from "@solana/web3.js";
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

const WUMBO_INSTANCE: PublicKey = new PublicKey(
  "BRP7kHUu1c4MMLVauHQF6Jc34iH1EcQaWMijErVXk9S6"
);

const WUM_BONDING: PublicKey = new PublicKey(
  "BiNJNE279p9mP2pYMJfqkStdotLY9mCWSs4PJaPB2aj2"
);

const WUM_TOKEN: PublicKey = new PublicKey(
  "8ZEdEGcrPCLujEQuuUsmuosx2osuuCa8Hfm5WwKW73Ka"
);

const splTokenBondingProgramId = new PublicKey(
  "TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN"
);

const splWumboProgramId = new PublicKey(
  "WumbodN8t7wcDPCY2nGszs4x6HRtL5mJcTR519Qr6m7"
);

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

  const mints: (string | undefined)[] = [
    WUM_TOKEN.toBase58(),
    ...tokenBondingAcctsWithWumBase.map((tokenBondingAcct) =>
      tokenBondingAcct.account.targetMint.toBase58()
    ),
  ];

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
          mints.includes(tokenAcct?.info?.mint?.toBase58())
        );

        return {
          ...acc,
          [publicKey]: filteredTokenAccts,
        };
      },
      Promise.resolve({})
    );

  const [totalWumByBetaParticipant, totalWumByMint] = await Object.entries(
    tokenAcctsByBetaParticipant
  ).reduce(
    async (
      accP: Promise<Record<string, number>[]>,
      [betaParticipant, tokenAccts],
      currentIndex,
      orgArray
    ) => {
      const [totalWumByBetaParticipantAcc, totalWumByMintAcc] = await accP;
      console.log(
        `Processing: betaParticipant ${currentIndex + 1} of ${orgArray.length}`
      );

      for (let i = 0, len = tokenAccts.length; i < len; i++) {
        const tokenAcct = tokenAccts[i];
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
            const curveAcct = await splTokenBonding.account.curveV0.fetch(
              tokenBondingAcct.curve
            );
            const curve: Curve = fromCurve(curveAcct, baseMint, targetMint);
            const targetAmountNum = amountAsNum(
              tokenAcct.info.amount,
              targetMint
            );
            reclaimedAmount = curve.sellTargetAmount(targetAmountNum);

            totalWumByBetaParticipantAcc[betaParticipant] =
              reclaimedAmount +
              (totalWumByBetaParticipantAcc[betaParticipant] || 0);

            totalWumByMintAcc[tokenAcct.info.mint.toBase58()] =
              reclaimedAmount +
              (totalWumByMintAcc[tokenAcct.info.mint.toBase58()] || 0);
          }
        }
      }

      return [totalWumByBetaParticipantAcc, totalWumByMintAcc];
    },
    Promise.resolve([{}, {}])
  );

  const top10TotalWumCreators = await Object.keys(totalWumByMint)
    .reduce(
      async (
        accP: Promise<(string | number)[][]>,
        mint,
        currentIndex,
        orgArray
      ) => {
        const acc = await accP;
        console.log("Determining top 10");

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
            totalWumByMint[mint],
          ]);
        } catch (e) {
          console.error(e);
        }

        return acc;
      },
      Promise.resolve([])
    )
    .then((multiArrayOfCreatorsWum) =>
      multiArrayOfCreatorsWum
        .sort(([_a, a]: any, [_b, b]: any) => (a > b ? -1 : 1))
        .slice(0, 10)
    );

  console.log("totalWumByBetaParticipant", totalWumByBetaParticipant);
  console.log("totalWumByMint", totalWumByMint);
  console.log("top10TotalWumCreators", top10TotalWumCreators);
};

(async () => {
  try {
    await run();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
