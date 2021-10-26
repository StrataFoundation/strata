import fs from "fs/promises";
import { Command, Option } from "commander";
import * as anchor from "@wum.bo/anchor";
import { Transaction, PublicKey } from "@solana/web3.js";
import {
  createMetadata,
  Data,
  getMetadata,
  percent,
  TOKEN_PROGRAM_ID,
} from "@wum.bo/spl-utils";
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
import { connection, createMintInstructions } from "@project-serum/common";
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";

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
const run = async () => {
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();

  const rawDump = await fs.readFile(options.file);
  const dump = JSON.parse(rawDump.toString());

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

  const signers1 = [];
  const instructions1 = [];
  const wummieMintKeypair = anchor.web3.Keypair.generate();

  signers1.push(wummieMintKeypair);
  const netbWumMint = wummieMintKeypair.publicKey;
  instructions1.push(
    ...(await createMintInstructions(provider, wallet, netbWumMint, 9))
  );

  await createMetadata(
    new Data({
      symbol: "netbWUM",
      name: "Wum Beta Net Worth",
      uri: "https://5ujhyixf6slwojh6dr4vq7kygl7qjpvyu4rmwgkgsiesnq7jjxla.arweave.net/7RJ8IuX0l2ck_hx5WH1YMv8EvrinIssZRpIJJsPpTdY/",
      sellerFeeBasisPoints: 0,
      creators: null,
    }),
    wallet.toBase58(),
    netbWumMint.toBase58(),
    wallet.toBase58(),
    instructions1,
    wallet.toBase58()
  );

  // Change authority back to token bonding
  const [netbWumMintAuthority] = await PublicKey.findProgramAddress(
    [Buffer.from("target-authority", "utf-8"), netbWumMint.toBuffer()],
    splTokenBondingProgramId
  );

  instructions1.push(
    Token.createSetAuthorityInstruction(
      TOKEN_PROGRAM_ID,
      netbWumMint,
      netbWumMintAuthority,
      "MintTokens",
      wallet,
      []
    )
  );

  // Iterate over keys of this and mint/distrubute rWum
  console.log(dump.outputs.totalWumByBetaParticipant);
};

(async () => {
  try {
    await run();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
