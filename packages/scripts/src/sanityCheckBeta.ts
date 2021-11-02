import fs from "fs/promises";
import path from "path";
import * as anchor from "@wum.bo/anchor";
import { Command, Option } from "commander";
import { Connection, PublicKey, TransactionSignature } from "@solana/web3.js";

const program = new Command();
program
  .addOption(
    new Option("-w, --wallet <file>", "anchor wallet file")
      .env("ANCHOR_WALLET")
      .makeOptionMandatory()
  )
  .addOption(
    new Option("-u, --url <url>", "anchor provider url")
      .env("ANCHOR_PROVIDER_URL")
      .makeOptionMandatory()
  )
  .requiredOption("-s, --stage <number>", "stage to run script")
  .option("-f, --file <file>", "out put of stage 1 for sanity check")
  .parse();

const options = program.opts();
const rootDir = path.join(__dirname, "../..");
const betaAccountFiles = [
  path.join(rootDir, "/beta_accounts_1.json"),
  path.join(rootDir, "/beta_accounts_2.json"),
  path.join(rootDir, "/beta_accounts_3.json"),
  path.join(rootDir, "/beta_accounts_4.json"),
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const output: { feePayers: string[] } = { feePayers: [] };

const fetchFeePayers = async () => {
  console.log(process.env.ANCHOR_PROVIDER_URL);
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();

  const getAllConfirmedSignatures: any = async (
    before?: TransactionSignature
  ) => {
    await sleep(500);
    console.log(`Fetching signatures before: ${before}`);
    const results = await provider.connection.getConfirmedSignaturesForAddress2(
      new PublicKey("BiNJNE279p9mP2pYMJfqkStdotLY9mCWSs4PJaPB2aj2"),
      { before },
      "finalized"
    );

    if (results.length > 0) {
      return results.concat(
        await getAllConfirmedSignatures(results[results.length - 1].signature)
      );
    } else {
      return results;
    }
  };

  const confirmedSignatures: anchor.web3.ConfirmedSignatureInfo[] =
    await getAllConfirmedSignatures();

  const feePayers: Set<string> = await confirmedSignatures.reduce(
    async (accP: any, signatureInfo) => {
      const acc = await accP;
      await sleep(500);
      let count = 0;
      let maxTries = 3;

      console.log(
        `Fetching transaction try (${count + 1} of ${maxTries}) for SIG: ${
          signatureInfo.signature
        }`
      );

      while (true) {
        try {
          const transaction = await provider.connection.getConfirmedTransaction(
            signatureInfo.signature,
            "finalized"
          );

          if (transaction && transaction.transaction.feePayer)
            acc.add(transaction.transaction.feePayer.toBase58());

          return acc;
        } catch (err) {
          if (++count == maxTries) throw err;
        }
      }
    },
    Promise.resolve(new Set())
  );

  output.feePayers = [...feePayers];

  try {
    await fs.writeFile("./sanityCheckBetaOutput.json", JSON.stringify(output));
  } catch (err) {
    console.error("Error writting files", err);
  }
};

const sanityCheck = async () => {
  if (!options.file) {
    console.log("Provide stage 1 ouptput file");
    process.exit(1);
  }

  console.log(process.env.ANCHOR_PROVIDER_URL);
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();

  const betaParticipants: Set<string> = await Promise.all(
    betaAccountFiles.map(async (path) => {
      const raw = await fs.readFile(path);
      return JSON.parse(raw.toString());
    })
  ).then(
    (contents) =>
      new Set([
        ...contents
          .reduce((acc: Set<string>, content) => {
            content.map((obj: any) => acc.add(obj.key.payload));
            return acc;
          }, new Set())
          .values(),
      ])
  );

  const rawDump = await fs.readFile(options.file);
  const { feePayers: payers } = JSON.parse(rawDump.toString());

  const feePayers = new Set([...payers]);

  const feePayersMinusBetaParticipants = new Set(
    [...feePayers].filter((x) => !betaParticipants.has(x))
  );

  console.log([...feePayersMinusBetaParticipants]);
};

(async () => {
  try {
    if (options.stage === "1") await fetchFeePayers();
    if (options.stage === "2") await sanityCheck();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
