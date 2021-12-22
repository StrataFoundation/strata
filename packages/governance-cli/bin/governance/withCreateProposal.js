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
exports.withCreateProposal = void 0;
const web3_js_1 = require("@solana/web3.js");
const serialisation_1 = require("./serialisation");
const borsh_1 = require("borsh");
const instructions_1 = require("./instructions");
const accounts_1 = require("./accounts");
const withCreateProposal = (instructions, programId, programVersion, realm, governance, tokenOwnerRecord, name, descriptionLink, governingTokenMint, governanceAuthority, proposalIndex, voteType, options, useDenyOption, payer) => __awaiter(void 0, void 0, void 0, function* () {
    const systemId = web3_js_1.SystemProgram.programId;
    const args = new instructions_1.CreateProposalArgs({
        name,
        descriptionLink,
        governingTokenMint,
        voteType,
        options,
        useDenyOption,
    });
    const data = Buffer.from((0, borsh_1.serialize)((0, serialisation_1.getGovernanceSchema)(programVersion), args));
    let proposalIndexBuffer = Buffer.alloc(4);
    proposalIndexBuffer.writeInt32LE(proposalIndex, 0);
    const [proposalAddress] = yield web3_js_1.PublicKey.findProgramAddress([
        Buffer.from(accounts_1.GOVERNANCE_PROGRAM_SEED),
        governance.toBuffer(),
        governingTokenMint.toBuffer(),
        proposalIndexBuffer,
    ], programId);
    const keys = [
        {
            pubkey: realm,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: proposalAddress,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: governance,
            isWritable: true,
            isSigner: false,
        },
        {
            pubkey: tokenOwnerRecord,
            isWritable: true,
            isSigner: false,
        },
        ...(programVersion > serialisation_1.PROGRAM_VERSION_V1
            ? [
                {
                    pubkey: governingTokenMint,
                    isWritable: false,
                    isSigner: false,
                },
            ]
            : []),
        {
            pubkey: governanceAuthority,
            isWritable: false,
            isSigner: true,
        },
        {
            pubkey: payer,
            isWritable: false,
            isSigner: true,
        },
        {
            pubkey: systemId,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: web3_js_1.SYSVAR_RENT_PUBKEY,
            isWritable: false,
            isSigner: false,
        },
        {
            pubkey: web3_js_1.SYSVAR_CLOCK_PUBKEY,
            isWritable: false,
            isSigner: false,
        },
    ];
    instructions.push(new web3_js_1.TransactionInstruction({
        keys,
        programId,
        data,
    }));
    return proposalAddress;
});
exports.withCreateProposal = withCreateProposal;
//# sourceMappingURL=withCreateProposal.js.map