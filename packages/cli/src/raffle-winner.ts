/**
 * A script to select a random wallet from people who hold a sol mint token
 */
import { Command } from "commander";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
  u64,
} from "@solana/spl-token";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";

type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T; // from lodash
const truthy = <T>(value: T): value is Truthy<T> => !!value;

const program = new Command();
program
  .version("0.1.0")
  .argument("<mintPublicKey>", "PublicKey of mint")
  .argument("<solanaUrl", "url for solana")
  .description("select a random wallet from people who hold a sol mint token")
  .action(async (mintPublicKey, solanaUrl) => {
    const mint = new PublicKey(mintPublicKey);
    const connection = new Connection(solanaUrl);

    console.log(mintPublicKey);
    console.log(solanaUrl);
  });

program.parse();
