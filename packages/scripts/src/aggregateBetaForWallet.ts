import * as anchor from "@wum.bo/anchor";
import { Command, Option } from "commander";
import { getMintInfo } from "@project-serum/common";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  SplTokenBondingIDL,
  SplTokenBondingIDLJson,
  TokenBondingV0,
  Curve,
  fromCurve,
  amountAsNum,
} from "@wum.bo/spl-token-bonding";
import { TokenAccountParser } from "@wum.bo/spl-utils";

const program = new Command();
program
  .addOption(
    new Option("-w, --wallet <file>", "anchor wallet file")
      .env("ANCHOR_WALLET")
      .makeOptionMandatory()
  )
  .addOption(
    new Option("-u, --Url <url>", "anchor provider url")
      .env("ANCHOR_PROVIDER_URL")
      .makeOptionMandatory()
  )
  .requiredOption(
    "-p, --participant <publicKey>",
    "beta participant publickey to aggregate"
  )
  .parse();

const options = program.opts();

const WUM_BONDING: PublicKey = new PublicKey(
  "BiNJNE279p9mP2pYMJfqkStdotLY9mCWSs4PJaPB2aj2"
);

const WUM_TOKEN: PublicKey = new PublicKey(
  "8ZEdEGcrPCLujEQuuUsmuosx2osuuCa8Hfm5WwKW73Ka"
);

const splTokenBondingProgramId = new PublicKey(
  "TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN"
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

  const tokenAccts = await provider.connection.getTokenAccountsByOwner(
    new PublicKey(options.participant),
    { programId: TOKEN_PROGRAM_ID }
  );

  const parsedTokenAccts = tokenAccts.value.map(({ pubkey, account }) =>
    TokenAccountParser(pubkey.toBase58(), account)
  );

  const filteredTokenAccts = parsedTokenAccts.filter((tokenAcct) =>
    tokenAcct?.info?.mint ? mints.has(tokenAcct?.info?.mint?.toBase58()) : false
  );

  let curveAcct: any;

  const totalWum = await filteredTokenAccts.reduce(
    async (accP: Promise<number>, tokenAcct) => {
      let acc = await accP;

      let tokenBondingAcct;
      let targetMint;
      let baseMint;
      let reclaimedAmount = 0;

      if (tokenAcct) {
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

            acc = acc + reclaimedAmount;
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

            acc = acc + reclaimedAmount;
          }
        }
      }

      return acc;
    },
    Promise.resolve(0)
  );

  console.log(`BetaParticipant: ${options.participant} has ${totalWum}`);
};

(async () => {
  try {
    await run();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
