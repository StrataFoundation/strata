#! /usr/bin/env node
import {
  AccountMetaData,
  getGovernanceProgramVersion,
  getTokenOwnerRecordAddress,
  Governance,
  GovernanceAccountParser,
  InstructionData,
  Realm,
  VoteType,
  withAddSignatory,
  withCreateProposal,
  withInsertTransaction,
  withSignOffProposal,
} from "@solana/spl-governance";
import {
  Cluster,
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { Base64 } from "js-base64";
import axios from "axios";
import "./borshFill";
import { createIdlUpgradeInstruction } from "./createIdlUpgradeInstruction";
import { createUpgradeInstruction } from "./createUpgradeInstruction";

const GOVERNANCE_PROGRAM_ID = new PublicKey(
  "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"
);

async function run() {
  const programId = new PublicKey(process.env.PROGRAM_ID!);
  const bufferKey = new PublicKey(process.env.BUFFER!);
  const idlBufferKey =
    process.env.IDL_BUFFER && new PublicKey(process.env.IDL_BUFFER);
  const governanceKey = new PublicKey(process.env.GOVERNANCE_KEY!);
  const network = process.env.NETWORK!;
  const signatory =
    process.env.SIGNATORY && new PublicKey(process.env.SIGNATORY);
  const wallet = Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(
        require("fs").readFileSync(process.env.WALLET!, {
          encoding: "utf-8",
        })
      )
    )
  );
  const connection = new Connection(
    network.startsWith("http") ? network : clusterApiUrl(network as Cluster),
    {}
  );

  const tx = new Transaction();
  const instructions: TransactionInstruction[] = [];
  const info = await connection.getAccountInfo(governanceKey);
  const gov = GovernanceAccountParser(Governance)(governanceKey, info!).account;
  const realmKey = gov.realm;
  const realmInfo = await connection.getAccountInfo(realmKey);
  const realm = GovernanceAccountParser(Realm)(
    governanceKey,
    realmInfo!
  ).account;
  PublicKey.prototype.toString = PublicKey.prototype.toBase58;

  const tokenOwner = await getTokenOwnerRecordAddress(
    GOVERNANCE_PROGRAM_ID,
    realmKey,
    realm.communityMint,
    wallet.publicKey
  );
  console.log(tokenOwner.toBase58());
  const version = await getGovernanceProgramVersion(
    connection,
    GOVERNANCE_PROGRAM_ID
  );

  const proposal = await withCreateProposal(
    instructions,
    GOVERNANCE_PROGRAM_ID,
    version,
    realmKey,
    governanceKey,
    tokenOwner,
    process.env.NAME!,
    process.env.DESCRIPTION!,
    realm.communityMint,
    wallet.publicKey,
    gov.proposalCount,
    VoteType.SINGLE_CHOICE,
    ["Approve"],
    true,
    wallet.publicKey
  );

  // If signatory provided, add it. Otherwise add ourselves and sign off immediately
  const signatoryRecord = await withAddSignatory(
    instructions,
    GOVERNANCE_PROGRAM_ID,
    1,
    proposal,
    tokenOwner,
    wallet.publicKey,
    signatory ? signatory : wallet.publicKey,
    wallet.publicKey
  );

  const upgradeIx = await createUpgradeInstruction(
    programId,
    bufferKey,
    governanceKey,
    wallet.publicKey
  );

  let upgradeIdlIx: TransactionInstruction | null = null;
  if (idlBufferKey) {
    upgradeIdlIx = await createIdlUpgradeInstruction(
      programId,
      idlBufferKey,
      governanceKey
    );
  }
  await withInsertTransaction(
    instructions,
    GOVERNANCE_PROGRAM_ID,
    version,
    governanceKey,
    proposal,
    tokenOwner,
    wallet.publicKey,
    0,
    0,
    0,
    [
      new InstructionData({
        programId: upgradeIx.programId,
        accounts: upgradeIx.keys.map((key) => new AccountMetaData(key)),
        data: upgradeIx.data,
      }),
    ],
    wallet.publicKey
  );
  // TODO: Do these both in one command when UI supports it
  if (upgradeIdlIx) {
    await withInsertTransaction(
      instructions,
      GOVERNANCE_PROGRAM_ID,
      version,
      governanceKey,
      proposal,
      tokenOwner,
      wallet.publicKey,
      1,
      0,
      0,
      [
        new InstructionData({
          programId: upgradeIdlIx.programId,
          accounts: upgradeIdlIx.keys.map((key) => new AccountMetaData(key)),
          data: upgradeIdlIx.data,
        }),
      ],
      wallet.publicKey
    );
  }

  if (!signatory) {
    await withSignOffProposal(
      instructions,
      GOVERNANCE_PROGRAM_ID,
      version,
      realmKey,
      governanceKey,
      proposal,
      wallet.publicKey,
      signatoryRecord,
      undefined
    );
  }

  tx.add(...instructions);
  tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  tx.sign(wallet);
  console.log(
    await connection.sendRawTransaction(tx.serialize(), { skipPreflight: true })
  );
  // await sendAndConfirmTransaction(connection, tx, [wallet]);
  console.log(proposal.toBase58());
}

run().catch((e) => {
  console.error(e);
  console.error(e.stack);
  process.exit(1);
});
