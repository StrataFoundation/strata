#! /usr/bin/env node
import {
  AccountMetaData,
  BPF_UPGRADE_LOADER_ID,
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
import { sendAndConfirmWithRetry } from "@strata-foundation/spl-utils";
import bs58 from "bs58";
import "./borshFill";
import { createCloseInstruction } from "./createCloseInstruction";

const GOVERNANCE_PROGRAM_ID = new PublicKey(
  "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"
);

export const chunks = <T>(array: T[], size: number): T[][] =>
  Array.apply(
    0,
    new Array(Math.ceil(array.length / size))
  ).map((_, index) => array.slice(index * size, (index + 1) * size));

async function run() {
  const programId = new PublicKey(process.env.PROGRAM_ID!);
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
    network.startsWith("http") ? network : clusterApiUrl(network as Cluster)
  );

  const buffers = (
    await connection.getProgramAccounts(BPF_UPGRADE_LOADER_ID, {
      dataSlice: {
        length: 0,
        offset: 0,
      },
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: bs58.encode(Buffer.from(new Uint8Array([1, 0, 0, 0]))),
          },
        },
        {
          memcmp: {
            offset: 4,
            bytes: bs58.encode(Buffer.from(new Uint8Array([1]))),
          },
        },
        {
          memcmp: {
            offset: 5,
            bytes: bs58.encode(governanceKey.toBuffer()),
          },
        },
      ],
    })
  ).map((b) => b.pubkey);

  const tx = new Transaction();
  let instructions: TransactionInstruction[] = [];
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
    "Close all buffers",
    "Close all program buffers",
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

  tx.add(...instructions);
  tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  tx.sign(wallet);
  await sendAndConfirmWithRetry(
    connection,
    tx.serialize(),
    {
      skipPreflight: true,
    },
    "confirmed"
  );

  const ixs = chunks(
    await Promise.all(
      buffers.map(async (bufferKey) => {
        const upgradeIx = await createCloseInstruction(
          programId,
          bufferKey,
          governanceKey,
          wallet.publicKey
        );
        return new InstructionData({
          programId: upgradeIx.programId,
          accounts: upgradeIx.keys.map((key) => new AccountMetaData(key)),
          data: upgradeIx.data,
        });
      })
    ),
    1 // TODO: When multiple commands supported change this
  );

  for (const [index, ixGroup] of ixs.entries()) {
    const tx2 = new Transaction();
    tx2.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    const instructions: TransactionInstruction[] = [];
    await withInsertTransaction(
      instructions,
      GOVERNANCE_PROGRAM_ID,
      version,
      governanceKey,
      proposal,
      tokenOwner,
      wallet.publicKey,
      index,
      0,
      0,
      ixGroup,
      wallet.publicKey
    );
    tx2.add(...instructions);
    tx2.sign(wallet);
    await sendAndConfirmWithRetry(
      connection,
      tx2.serialize(),
      {
        skipPreflight: true,
      },
      "confirmed"
    );
  }

  if (!signatory) {
    const tx2 = new Transaction();
    tx2.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    instructions = [];
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
    tx2.add(...instructions);
    tx2.sign(wallet);
    await sendAndConfirmWithRetry(
      connection,
      tx2.serialize(),
      {
        skipPreflight: true,
      },
      "confirmed"
    );
  }

  // await sendAndConfirmTransaction(connection, tx, [wallet]);
  console.log(proposal.toBase58());
}

run().catch((e) => {
  console.error(e);
  console.error(e.stack);
  process.exit(1);
});
