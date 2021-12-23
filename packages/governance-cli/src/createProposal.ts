#! /usr/bin/env node
import "./borshFill";
import { Cluster, clusterApiUrl, Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction, TransactionInstruction } from "@solana/web3.js";
import { createUpgradeInstruction } from "./createUpgradeInstruction";
import { getTokenOwnerRecordAddress, Governance, Realm, VoteType } from "./governance/accounts";
import { getInstructionDataFromBase64, GovernanceAccountParser, serializeInstructionToBase64 } from "./governance/serialisation";
import { withCreateProposal } from "./governance/withCreateProposal";
import { withInsertInstruction } from "./governance/withInsertInstruction";
import { withAddSignatory } from "./governance/withAddSignatory";
import { createIdlUpgradeInstruction } from "./createIdlUpgradeInstruction";

const GOVERNANCE_PROGRAM_ID = new PublicKey("GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw");

async function run() {
  const programId = new PublicKey(process.env.PROGRAM_ID!);
  const bufferKey = new PublicKey(process.env.BUFFER!);
  const idlBufferKey = new PublicKey(process.env.IDL_BUFFER!);
  const governanceKey = new PublicKey(process.env.GOVERNANCE_KEY!);
  const network = process.env.NETWORK!;
  const signatory = new PublicKey(process.env.SIGNATORY!);
  const wallet = Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(
        require("fs").readFileSync(
          process.env.WALLET!,
          {
            encoding: "utf-8",
          }
        )
      )
    )
  );
  const connection = new Connection(clusterApiUrl(network as Cluster));

  const tx = new Transaction();
  const instructions: TransactionInstruction[] = [];
  const info = await connection.getAccountInfo(governanceKey);
  const gov = GovernanceAccountParser(Governance)(
    governanceKey,
    info!,
  );
  const realmKey = gov.info.realm;
  const realmInfo = await connection.getAccountInfo(realmKey);
  const realm = GovernanceAccountParser(Realm)(
    governanceKey,
    realmInfo!,
  );

  const tokenOwner = await getTokenOwnerRecordAddress(
    GOVERNANCE_PROGRAM_ID,
    realmKey,
    realm.info.communityMint,
    wallet.publicKey,
  );
  const proposal = await withCreateProposal(
    instructions,
    GOVERNANCE_PROGRAM_ID,
    1,
    realmKey,
    governanceKey,
    tokenOwner,
    process.env.NAME!,
    process.env.DESCRIPTION!,
    realm.info.communityMint,
    wallet.publicKey,
    gov.info.proposalCount,
    VoteType.SINGLE_CHOICE,
    ["Approve"],
    true,
    wallet.publicKey
  );

  // Add the proposal creator as the default signatory
  await withAddSignatory(
    instructions,
    GOVERNANCE_PROGRAM_ID,
    proposal,
    tokenOwner,
    wallet.publicKey,
    signatory,
    wallet.publicKey,
  );

  await withInsertInstruction(
    instructions,
    GOVERNANCE_PROGRAM_ID,
    1,
    governanceKey,
    proposal,
    tokenOwner,
    wallet.publicKey,
    0,
    0,
    getInstructionDataFromBase64(serializeInstructionToBase64(await createUpgradeInstruction(
      programId,
      bufferKey,
      governanceKey,
      wallet.publicKey
    ))),
    wallet.publicKey
  );

  // Upgrade idl
  await withInsertInstruction(
    instructions,
    GOVERNANCE_PROGRAM_ID,
    1,
    governanceKey,
    proposal,
    tokenOwner,
    wallet.publicKey,
    1,
    0,
    getInstructionDataFromBase64(serializeInstructionToBase64(await createIdlUpgradeInstruction(
      programId,
      idlBufferKey,
      governanceKey,
    ))),
    wallet.publicKey
  );

  tx.add(...instructions);
  tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  await sendAndConfirmTransaction(connection, tx, [wallet]);
  console.log(proposal.toBase58());
}

run().catch(e => {
  console.error(e);
  console.error(e.stack);
  process.exit(1);
})

