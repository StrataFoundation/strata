import fs from "fs/promises";
import { Command, Option } from "commander";
import * as anchor from "@wum.bo/anchor";
import { Transaction, PublicKey } from "@solana/web3.js";
import { createMetadata, Data } from "@wum.bo/spl-utils";
import {
  SplTokenBonding,
  SplTokenBondingIDL,
  SplTokenBondingIDLJson,
} from "@wum.bo/spl-token-bonding";
import { SplWumbo, SplWumboIDL, SplWumboIDLJson } from "@wum.bo/spl-wumbo";
import {
  SplTokenStaking,
  SplTokenStakingIDL,
  SplTokenStakingIDLJson,
} from "@wum.bo/spl-token-staking";
import {
  SplTokenAccountSplit,
  SplTokenAccountSplitIDL,
  SplTokenAccountSplitIDLJson,
} from "@wum.bo/spl-token-account-split";
import { createMintInstructions } from "@project-serum/common";
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

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
  .requiredOption("-f, --file <file>", "dump file from aggregateBeta")
  .parse();

const options = program.opts();

const mintTo = async ({
  provider,
  mint,
  amount,
  to,
}: {
  provider: anchor.Provider;
  mint: PublicKey;
  amount: anchor.BN;
  to: PublicKey;
}) => {
  const mintTx = new Transaction();
  mintTx.add(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mint,
      to,
      provider.wallet.publicKey,
      [],
      amount.toNumber()
    )
  );
  await provider.send(mintTx);
};

const createAta = async ({
  provider,
  mint,
  betaParticipant,
  payer,
}: {
  provider: anchor.Provider;
  mint: PublicKey;
  betaParticipant: PublicKey;
  payer: PublicKey;
}) => {
  const ata = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    betaParticipant
  );

  if (!(await provider.connection.getAccountInfo(ata))) {
    const ataTx = new Transaction({ feePayer: payer });
    ataTx.add(
      Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        mint,
        ata,
        betaParticipant,
        payer
      )
    );

    await provider.send(ataTx);
  }

  return ata;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const run = async () => {
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();
  const connection = provider.connection;

  const rawDump = await fs.readFile(options.file);
  const {
    outputs: { totalWumByBetaParticipant },
  } = JSON.parse(rawDump.toString());

  const splTokenBondingProgramId = new PublicKey(
    "TBondz6ZwSM5fs4v2GpnVBMuwoncPkFLFR9S422ghhN"
  );
  const splWumboProgramId = new PublicKey(
    "WumbodN8t7wcDPCY2nGszs4x6HRtL5mJcTR519Qr6m7"
  );
  const splTokenAccountSplitProgramId = new PublicKey(
    "Sp1it1Djn2NmQvXLPnGM4zAXArxuchvSdytNt5n76Hm"
  );
  const splTokenStakingProgramId = new PublicKey(
    "TStakXwvzEZiK6PSNpXuNx6wEsKc93NtSaMxmcqG6qP"
  );

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
  const splTokenAccountSplit = new anchor.Program(
    SplTokenAccountSplitIDLJson,
    splTokenAccountSplitProgramId,
    provider
  ) as anchor.Program<SplTokenAccountSplitIDL>;
  const splTokenStaking = new anchor.Program(
    SplTokenStakingIDLJson,
    splTokenStakingProgramId,
    provider
  ) as anchor.Program<SplTokenStakingIDL>;

  const splTokenBondingProgram = new SplTokenBonding(provider, splTokenBonding);
  const splTokenStakingProgram = new SplTokenStaking(provider, splTokenStaking);
  const splTokenAccountSplitProgram = new SplTokenAccountSplit(
    provider,
    splTokenAccountSplit,
    splTokenStakingProgram
  );
  const splWumboProgram = new SplWumbo({
    provider,
    program: splWumbo,
    splTokenBondingProgram,
    splTokenAccountSplitProgram,
    splTokenStakingProgram,
  });

  const wallet = splWumboProgram.wallet.publicKey;

  const signers = [];
  const instructions = [];
  const netbWumMintKeypair = anchor.web3.Keypair.generate();

  signers.push(netbWumMintKeypair);

  const netbWumMint = netbWumMintKeypair.publicKey;

  instructions.push(
    ...(await createMintInstructions(provider, wallet, netbWumMint, 9))
  );

  console.log("Creating metadata");
  await createMetadata(
    new Data({
      symbol: "netbWUM",
      name: "netbWUM",
      uri: "https://5ujhyixf6slwojh6dr4vq7kygl7qjpvyu4rmwgkgsiesnq7jjxla.arweave.net/7RJ8IuX0l2ck_hx5WH1YMv8EvrinIssZRpIJJsPpTdY/",
      sellerFeeBasisPoints: 0,
      creators: null,
    }),
    wallet.toBase58(),
    netbWumMint.toBase58(),
    wallet.toBase58(),
    instructions,
    wallet.toBase58()
  );

  const tx = new Transaction({
    recentBlockhash: (await connection.getRecentBlockhash("finalized"))
      .blockhash,
    feePayer: wallet,
  }).add(...instructions);

  console.log("Creating netbWumMint");
  await splWumboProgram.provider.send(tx, signers, {
    commitment: "finalized",
    preflightCommitment: "finalized",
  });

  // iterate over participants and mint amount;
  const failed: Record<string, { amount: number; error: Error }> = {};

  for await (const [index, [betaParticipant, amount]] of [
    ...Object.entries(totalWumByBetaParticipant),
  ].entries()) {
    console.log(
      `Minting betaParticipant ${index + 1} of ${
        Object.keys(totalWumByBetaParticipant).length
      }`
    );

    if ((amount as number) > 0) {
      let retries = 5;
      let success = false;
      let error: Error;

      const ata = await createAta({
        provider,
        mint: netbWumMint,
        betaParticipant: new PublicKey(betaParticipant),
        payer: wallet,
      });

      while (retries-- > 0 && !success) {
        console.log(`Try ${5 - retries} of 5`);
        await sleep(250);

        try {
          await mintTo({
            provider,
            mint: netbWumMint,
            to: ata,
            amount: new anchor.BN((amount as number) * Math.pow(10, 9)),
          });
          success = true;
        } catch (err) {
          console.error(err);
          error = err as Error;
        }
      }

      if (!success)
        failed[betaParticipant] = {
          amount: amount as number,
          error: error!,
        };
    }
  }

  if (Object.keys(failed).length) {
    try {
      await fs.writeFile(
        "./failedBetaDistributions.json",
        JSON.stringify(failed)
      );
    } catch (err) {
      console.log("Error writting file", err);
    }
  }
};

(async () => {
  try {
    await run();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
