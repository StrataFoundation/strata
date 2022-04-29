/**
 * A script to get holders of a certain mint
 */
import { Command } from "commander";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

const program = new Command();

program
  .version("0.1.0")
  .argument("<mintPublicKey>", "PublicKey of mint")
  .description("Get holders of a certain mint")
  .action(async (mintPublicKey, solanaUrl) => {
    let holders = {};
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
        }
      }
    });

    console.log(holders);
  });

program.parse();
