/**
 * A script to get holders of a certain mint
 */
import { Command } from "commander";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

const program = new Command();

const suffleArray = (array: any[]) => {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
};

program
  .version("0.1.0")
  .argument("<mintPublicKey>", "PublicKey of mint")
  .description("select a random wallet from people who hold a sol mint token")
  .action(async (mintPublicKey, solanaUrl) => {
    let holders: { [holder: string]: { amount: number } } = {};
    let entriesBucket = [];

    const mint = new PublicKey(mintPublicKey);
    const connection = new Connection(
      clusterApiUrl("mainnet-beta"),
      "confirmed"
    );

    const accounts = await connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID,
      {
        filters: [
          {
            dataSize: 165, // number of bytes
          },
          {
            memcmp: {
              offset: 0, // number of bytes
              bytes: mint.toBase58(),
            },
          },
        ],
      }
    );

    console.log(
      `Found ${accounts.length} token account(s) for mint ${mint.toString()}: `
    );

    accounts.forEach((a: any, i) => {
      if (a.account.data.parsed.info.tokenAmount.uiAmount > 0) {
        // @ts-ignore
        if (!holders[a.account.data.parsed.info.owner]) {
          // @ts-ignore
          holders[a.account.data.parsed.info.owner] = {
            amount: +a.account.data.parsed.info.tokenAmount.uiAmount,
          };
        } else {
          // @ts-ignore
          holders[a.account.data.parsed.info.owner].amount +=
            +a.account.data.parsed.info.tokenAmount.uiAmount;
          // @ts-ignore
        }
      }
    });

    // Create a bucket of owners with their amount of entries
    for (const [key, value] of Object.entries(holders)) {
      entriesBucket.push(...[...Array(value.amount).keys()].map((x) => key));
    }

    console.log(`Shuffling ${entriesBucket.length} entries`);
    // Shuffle the array of entries
    suffleArray(entriesBucket);

    // Select random winner
    console.log(
      `Winner: ${
        entriesBucket[Math.floor(Math.random() * (entriesBucket.length - 1))]
      }`
    );
  });

program.parse();
