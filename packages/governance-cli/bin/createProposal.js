#! /usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./borshFill");
const web3_js_1 = require("@solana/web3.js");
const createUpgradeInstruction_1 = require("./createUpgradeInstruction");
const accounts_1 = require("./governance/accounts");
const serialisation_1 = require("./governance/serialisation");
const withCreateProposal_1 = require("./governance/withCreateProposal");
const withInsertInstruction_1 = require("./governance/withInsertInstruction");
const withAddSignatory_1 = require("./governance/withAddSignatory");
const GOVERNANCE_PROGRAM_ID = new web3_js_1.PublicKey("GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const programId = new web3_js_1.PublicKey(process.env.PROGRAM_ID);
        const bufferKey = new web3_js_1.PublicKey(process.env.BUFFER);
        const governanceKey = new web3_js_1.PublicKey(process.env.GOVERNANCE_KEY);
        const network = process.env.NETWORK;
        const signatory = new web3_js_1.PublicKey(process.env.SIGNATORY);
        const wallet = web3_js_1.Keypair.fromSecretKey(Buffer.from(JSON.parse(require("fs").readFileSync(process.env.WALLET, {
            encoding: "utf-8",
        }))));
        const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)(network));
        const tx = new web3_js_1.Transaction();
        const instructions = [];
        const info = yield connection.getAccountInfo(governanceKey);
        const gov = (0, serialisation_1.GovernanceAccountParser)(accounts_1.Governance)(governanceKey, info);
        const realmKey = gov.info.realm;
        const realmInfo = yield connection.getAccountInfo(realmKey);
        const realm = (0, serialisation_1.GovernanceAccountParser)(accounts_1.Realm)(governanceKey, realmInfo);
        const tokenOwner = yield (0, accounts_1.getTokenOwnerRecordAddress)(GOVERNANCE_PROGRAM_ID, realmKey, realm.info.communityMint, wallet.publicKey);
        const proposal = yield (0, withCreateProposal_1.withCreateProposal)(instructions, GOVERNANCE_PROGRAM_ID, 1, realmKey, governanceKey, tokenOwner, process.env.NAME, process.env.DESCRIPTION, realm.info.communityMint, wallet.publicKey, gov.info.proposalCount, accounts_1.VoteType.SINGLE_CHOICE, ["Approve"], true, wallet.publicKey);
        // Add the proposal creator as the default signatory
        yield (0, withAddSignatory_1.withAddSignatory)(instructions, GOVERNANCE_PROGRAM_ID, proposal, tokenOwner, wallet.publicKey, signatory, wallet.publicKey);
        yield (0, withInsertInstruction_1.withInsertInstruction)(instructions, GOVERNANCE_PROGRAM_ID, 1, governanceKey, proposal, tokenOwner, wallet.publicKey, 0, 0, (0, serialisation_1.getInstructionDataFromBase64)((0, serialisation_1.serializeInstructionToBase64)(yield (0, createUpgradeInstruction_1.createUpgradeInstruction)(programId, bufferKey, governanceKey, wallet.publicKey))), wallet.publicKey);
        tx.add(...instructions);
        tx.recentBlockhash = (yield connection.getRecentBlockhash()).blockhash;
        yield (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [wallet]);
        console.log(proposal.toBase58());
    });
}
run().catch(e => {
    console.error(e);
    console.error(e.stack);
    process.exit(1);
});
//# sourceMappingURL=createProposal.js.map