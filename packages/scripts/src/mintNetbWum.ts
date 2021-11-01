import { Command, Option } from "commander";
import * as anchor from "@wum.bo/anchor";
import { Transaction, PublicKey } from "@solana/web3.js";
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
  .requiredOption("-a, --amount <number>", "number to mint to")
  .requiredOption("-t, --to <publicKey>", "publickey to mint to")
  .parse();

const options = program.opts();
const createAtaAndMintTo = async ({
  provider,
  mint,
  amount,
  betaParticipant,
  payer,
}: {
  provider: anchor.Provider;
  mint: PublicKey;
  amount: anchor.BN;
  betaParticipant: PublicKey;
  payer: PublicKey;
}) => {
  const tx = new Transaction();
  const ata = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    betaParticipant
  );

  tx.add(
    Token.createAssociatedTokenAccountInstruction(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      ata,
      betaParticipant,
      payer
    )
  );

  tx.add(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      mint,
      ata,
      provider.wallet.publicKey,
      [],
      amount.toNumber()
    )
  );

  await provider.send(tx);
};

const run = async () => {
  anchor.setProvider(anchor.Provider.env());
  const provider = anchor.getProvider();
  const connection = provider.connection;

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

  const netbWumMint = new PublicKey(
    "HvdnoodTaRSaB7AEtm7QaDveqW9M3r4hmoNaqTggQkVp"
  );

  const wallet = splWumboProgram.wallet.publicKey;
  const sanitizedAmount = +options.amount * Math.pow(10, 9);

  try {
    console.log(`Minting: ${options.amount} to ${options.to}`);
    await createAtaAndMintTo({
      provider,
      mint: netbWumMint,
      betaParticipant: new PublicKey(options.to),
      amount: new anchor.BN(sanitizedAmount),
      payer: wallet,
    });
  } catch (e) {
    console.error(e);
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
