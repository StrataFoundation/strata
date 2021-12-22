"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInstructionDataFromBase64 = exports.GovernanceAccountParser = exports.getGovernanceSchemaForAccount = exports.getGovernanceSchema = exports.GOVERNANCE_SCHEMA = exports.GOVERNANCE_SCHEMA_V1 = exports.serializeInstructionToBase64 = exports.PROGRAM_VERSION_V2 = exports.PROGRAM_VERSION_V1 = void 0;
const borsh_1 = require("borsh");
const instructions_1 = require("./instructions");
const accounts_1 = require("./accounts");
const borsh_2 = require("borsh");
const serialisation_1 = require("./core/serialisation");
const borsh_3 = require("borsh");
exports.PROGRAM_VERSION_V1 = 1;
exports.PROGRAM_VERSION_V2 = 2;
{ }
// ------------ u16 ------------
// Temp. workaround to support u16.
borsh_1.BinaryReader.prototype.readU16 = function () {
    const reader = this;
    const value = reader.buf.readUInt16LE(reader.offset);
    reader.offset += 2;
    return value;
};
// Temp. workaround to support u16.
borsh_1.BinaryWriter.prototype.writeU16 = function (value) {
    const writer = this;
    writer.maybeResize();
    writer.buf.writeUInt16LE(value, writer.length);
    writer.length += 2;
};
// ------------ VoteType ------------
borsh_1.BinaryReader.prototype.readVoteType = function () {
    const reader = this;
    const value = reader.buf.readUInt8(reader.offset);
    reader.offset += 1;
    if (value === accounts_1.VoteTypeKind.SingleChoice) {
        return accounts_1.VoteType.SINGLE_CHOICE;
    }
    const choiceCount = reader.buf.readUInt16LE(reader.offset);
    return accounts_1.VoteType.MULTI_CHOICE(choiceCount);
};
borsh_1.BinaryWriter.prototype.writeVoteType = function (value) {
    const writer = this;
    writer.maybeResize();
    writer.buf.writeUInt8(value.type, writer.length);
    writer.length += 1;
    if (value.type === accounts_1.VoteTypeKind.MultiChoice) {
        writer.buf.writeUInt16LE(value.choiceCount, writer.length);
        writer.length += 2;
    }
};
// ------------ Vote ------------
borsh_1.BinaryReader.prototype.readVote = function () {
    const reader = this;
    const value = reader.buf.readUInt8(reader.offset);
    reader.offset += 1;
    if (value === instructions_1.VoteKind.Deny) {
        return new instructions_1.Vote({ voteType: value, approveChoices: undefined, deny: true });
    }
    let approveChoices = [];
    reader.readArray(() => {
        const rank = reader.buf.readUInt8(reader.offset);
        reader.offset += 1;
        const weightPercentage = reader.buf.readUInt8(reader.offset);
        reader.offset += 1;
        approveChoices.push(new instructions_1.VoteChoice({ rank: rank, weightPercentage: weightPercentage }));
    });
    return new instructions_1.Vote({
        voteType: value,
        approveChoices: approveChoices,
        deny: undefined,
    });
};
borsh_1.BinaryWriter.prototype.writeVote = function (value) {
    const writer = this;
    writer.maybeResize();
    writer.buf.writeUInt8(value.voteType, writer.length);
    writer.length += 1;
    if (value.voteType === instructions_1.VoteKind.Approve) {
        writer.writeArray(value.approveChoices, (item) => {
            writer.buf.writeUInt8(item.rank, writer.length);
            writer.length += 1;
            writer.buf.writeUInt8(item.weightPercentage, writer.length);
            writer.length += 1;
        });
    }
};
// Serializes sdk instruction into InstructionData and encodes it as base64 which then can be entered into the UI form
const serializeInstructionToBase64 = (instruction) => {
    let data = new accounts_1.InstructionData({
        programId: instruction.programId,
        data: instruction.data,
        accounts: instruction.keys.map(k => new accounts_1.AccountMetaData({
            pubkey: k.pubkey,
            isSigner: k.isSigner,
            isWritable: k.isWritable,
        })),
    });
    return Buffer.from((0, borsh_2.serialize)(exports.GOVERNANCE_SCHEMA, data)).toString('base64');
};
exports.serializeInstructionToBase64 = serializeInstructionToBase64;
exports.GOVERNANCE_SCHEMA_V1 = createGovernanceSchema(1);
exports.GOVERNANCE_SCHEMA = createGovernanceSchema(2);
function getGovernanceSchema(programVersion) {
    switch (programVersion) {
        case 1:
            return exports.GOVERNANCE_SCHEMA_V1;
        default:
            return exports.GOVERNANCE_SCHEMA;
    }
}
exports.getGovernanceSchema = getGovernanceSchema;
function createGovernanceSchema(programVersion) {
    return new Map([
        [
            accounts_1.RealmConfigArgs,
            {
                kind: 'struct',
                fields: [
                    ['useCouncilMint', 'u8'],
                    ['minCommunityTokensToCreateGovernance', 'u64'],
                    ['communityMintMaxVoteWeightSource', accounts_1.MintMaxVoteWeightSource],
                    // V1 of the program used restrictive instruction deserialisation which didn't allow additional data
                    programVersion > exports.PROGRAM_VERSION_V1
                        ? ['useCommunityVoterWeightAddin', 'u8']
                        : undefined,
                ].filter(Boolean),
            },
        ],
        [
            instructions_1.CreateRealmArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    ['name', 'string'],
                    ['configArgs', accounts_1.RealmConfigArgs],
                ],
            },
        ],
        [
            instructions_1.DepositGoverningTokensArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    // V1 of the program used restrictive instruction deserialisation which didn't allow additional data
                    programVersion > exports.PROGRAM_VERSION_V1 ? ['amount', 'u64'] : undefined,
                ].filter(Boolean),
            },
        ],
        [
            instructions_1.WithdrawGoverningTokensArgs,
            {
                kind: 'struct',
                fields: [['instruction', 'u8']],
            },
        ],
        [
            instructions_1.CreateAccountGovernanceArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    ['config', accounts_1.GovernanceConfig],
                ],
            },
        ],
        [
            instructions_1.CreateProgramGovernanceArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    ['config', accounts_1.GovernanceConfig],
                    ['transferUpgradeAuthority', 'u8'],
                ],
            },
        ],
        [
            instructions_1.CreateMintGovernanceArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    ['config', accounts_1.GovernanceConfig],
                    ['transferMintAuthority', 'u8'],
                ],
            },
        ],
        [
            instructions_1.CreateTokenGovernanceArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    ['config', accounts_1.GovernanceConfig],
                    ['transferTokenOwner', 'u8'],
                ],
            },
        ],
        [
            instructions_1.SetGovernanceConfigArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    ['config', accounts_1.GovernanceConfig],
                ],
            },
        ],
        [
            instructions_1.CreateProposalArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    ['name', 'string'],
                    ['descriptionLink', 'string'],
                    ...(programVersion === exports.PROGRAM_VERSION_V1
                        ? [['governingTokenMint', 'pubkey']]
                        : [
                            ['voteType', 'voteType'],
                            ['options', ['string']],
                            ['useDenyOption', 'u8'],
                        ]),
                ],
            },
        ],
        [
            instructions_1.AddSignatoryArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    ['signatory', 'pubkey'],
                ],
            },
        ],
        [
            instructions_1.SignOffProposalArgs,
            {
                kind: 'struct',
                fields: [['instruction', 'u8']],
            },
        ],
        [
            instructions_1.CancelProposalArgs,
            {
                kind: 'struct',
                fields: [['instruction', 'u8']],
            },
        ],
        [
            instructions_1.RelinquishVoteArgs,
            {
                kind: 'struct',
                fields: [['instruction', 'u8']],
            },
        ],
        [
            instructions_1.FinalizeVoteArgs,
            {
                kind: 'struct',
                fields: [['instruction', 'u8']],
            },
        ],
        [
            instructions_1.VoteChoice,
            {
                kind: 'struct',
                fields: [
                    ['rank', 'u8'],
                    ['weightPercentage', 'u8'],
                ],
            },
        ],
        [
            instructions_1.CastVoteArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    programVersion === exports.PROGRAM_VERSION_V1
                        ? ['yesNoVote', 'u8']
                        : ['vote', 'vote'],
                ],
            },
        ],
        [
            instructions_1.InsertInstructionArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    programVersion > exports.PROGRAM_VERSION_V1
                        ? ['optionIndex', 'u16']
                        : undefined,
                    ['index', 'u16'],
                    ['holdUpTime', 'u32'],
                    ['instructionData', accounts_1.InstructionData],
                ].filter(Boolean),
            },
        ],
        [
            instructions_1.RemoveInstructionArgs,
            {
                kind: 'struct',
                fields: [['instruction', 'u8']],
            },
        ],
        [
            instructions_1.ExecuteInstructionArgs,
            {
                kind: 'struct',
                fields: [['instruction', 'u8']],
            },
        ],
        [
            instructions_1.FlagInstructionErrorArgs,
            {
                kind: 'struct',
                fields: [['instruction', 'u8']],
            },
        ],
        [
            instructions_1.SetRealmAuthorityArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    ['newRealmAuthority', { kind: 'option', type: 'pubkey' }],
                ],
            },
        ],
        [
            instructions_1.SetRealmConfigArgs,
            {
                kind: 'struct',
                fields: [
                    ['instruction', 'u8'],
                    ['configArgs', accounts_1.RealmConfigArgs],
                ],
            },
        ],
        [
            accounts_1.InstructionData,
            {
                kind: 'struct',
                fields: [
                    ['programId', 'pubkey'],
                    ['accounts', [accounts_1.AccountMetaData]],
                    ['data', ['u8']],
                ],
            },
        ],
        [
            accounts_1.AccountMetaData,
            {
                kind: 'struct',
                fields: [
                    ['pubkey', 'pubkey'],
                    ['isSigner', 'u8'],
                    ['isWritable', 'u8'],
                ],
            },
        ],
        [
            accounts_1.MintMaxVoteWeightSource,
            {
                kind: 'struct',
                fields: [
                    ['type', 'u8'],
                    ['value', 'u64'],
                ],
            },
        ],
        [
            accounts_1.RealmConfig,
            {
                kind: 'struct',
                fields: [
                    ['useCommunityVoterWeightAddin', 'u8'],
                    ['reserved', [7]],
                    ['minCommunityTokensToCreateGovernance', 'u64'],
                    ['communityMintMaxVoteWeightSource', accounts_1.MintMaxVoteWeightSource],
                    ['councilMint', { kind: 'option', type: 'pubkey' }],
                ],
            },
        ],
        [
            accounts_1.Realm,
            {
                kind: 'struct',
                fields: [
                    ['accountType', 'u8'],
                    ['communityMint', 'pubkey'],
                    ['config', accounts_1.RealmConfig],
                    ['reserved', [8]],
                    ['authority', { kind: 'option', type: 'pubkey' }],
                    ['name', 'string'],
                ],
            },
        ],
        [
            accounts_1.RealmConfigAccount,
            {
                kind: 'struct',
                fields: [
                    ['accountType', 'u8'],
                    ['realm', 'pubkey'],
                    ['communityVoterWeightAddin', { kind: 'option', type: 'pubkey' }],
                ],
            },
        ],
        [
            accounts_1.Governance,
            {
                kind: 'struct',
                fields: [
                    ['accountType', 'u8'],
                    ['realm', 'pubkey'],
                    ['governedAccount', 'pubkey'],
                    ['proposalCount', 'u32'],
                    ['config', accounts_1.GovernanceConfig],
                    ['reserved', [8]],
                ],
            },
        ],
        [
            accounts_1.VoteThresholdPercentage,
            {
                kind: 'struct',
                fields: [
                    ['type', 'u8'],
                    ['value', 'u8'],
                ],
            },
        ],
        [
            accounts_1.GovernanceConfig,
            {
                kind: 'struct',
                fields: [
                    ['voteThresholdPercentage', accounts_1.VoteThresholdPercentage],
                    ['minCommunityTokensToCreateProposal', 'u64'],
                    ['minInstructionHoldUpTime', 'u32'],
                    ['maxVotingTime', 'u32'],
                    ['voteWeightSource', 'u8'],
                    ['proposalCoolOffTime', 'u32'],
                    ['minCouncilTokensToCreateProposal', 'u64'],
                ],
            },
        ],
        [
            accounts_1.TokenOwnerRecord,
            {
                kind: 'struct',
                fields: [
                    ['accountType', 'u8'],
                    ['realm', 'pubkey'],
                    ['governingTokenMint', 'pubkey'],
                    ['governingTokenOwner', 'pubkey'],
                    ['governingTokenDepositAmount', 'u64'],
                    ['unrelinquishedVotesCount', 'u32'],
                    ['totalVotesCount', 'u32'],
                    ['outstandingProposalCount', 'u8'],
                    ['reserved', [7]],
                    ['governanceDelegate', { kind: 'option', type: 'pubkey' }],
                ],
            },
        ],
        [
            accounts_1.ProposalOption,
            {
                kind: 'struct',
                fields: [
                    ['label', 'string'],
                    ['voteWeight', 'u64'],
                    ['voteResult', 'u8'],
                    ['instructionsExecutedCount', 'u16'],
                    ['instructionsCount', 'u16'],
                    ['instructionsNextIndex', 'u16'],
                ],
            },
        ],
        [
            accounts_1.Proposal,
            {
                kind: 'struct',
                fields: [
                    ['accountType', 'u8'],
                    ['governance', 'pubkey'],
                    ['governingTokenMint', 'pubkey'],
                    ['state', 'u8'],
                    ['tokenOwnerRecord', 'pubkey'],
                    ['signatoriesCount', 'u8'],
                    ['signatoriesSignedOffCount', 'u8'],
                    ...(programVersion === exports.PROGRAM_VERSION_V1
                        ? [
                            ['yesVotesCount', 'u64'],
                            ['noVotesCount', 'u64'],
                            ['instructionsExecutedCount', 'u16'],
                            ['instructionsCount', 'u16'],
                            ['instructionsNextIndex', 'u16'],
                        ]
                        : [
                            ['voteType', 'voteType'],
                            ['options', [accounts_1.ProposalOption]],
                            ['denyVoteWeight', { kind: 'option', type: 'u64' }],
                        ]),
                    ['draftAt', 'u64'],
                    ['signingOffAt', { kind: 'option', type: 'u64' }],
                    ['votingAt', { kind: 'option', type: 'u64' }],
                    ['votingAtSlot', { kind: 'option', type: 'u64' }],
                    ['votingCompletedAt', { kind: 'option', type: 'u64' }],
                    ['executingAt', { kind: 'option', type: 'u64' }],
                    ['closedAt', { kind: 'option', type: 'u64' }],
                    ['executionFlags', 'u8'],
                    ['maxVoteWeight', { kind: 'option', type: 'u64' }],
                    [
                        'voteThresholdPercentage',
                        { kind: 'option', type: accounts_1.VoteThresholdPercentage },
                    ],
                    ['name', 'string'],
                    ['descriptionLink', 'string'],
                ],
            },
        ],
        [
            accounts_1.SignatoryRecord,
            {
                kind: 'struct',
                fields: [
                    ['accountType', 'u8'],
                    ['proposal', 'pubkey'],
                    ['signatory', 'pubkey'],
                    ['signedOff', 'u8'],
                ],
            },
        ],
        [
            accounts_1.VoteWeight,
            {
                kind: 'enum',
                values: [
                    ['yes', 'u64'],
                    ['no', 'u64'],
                ],
            },
        ],
        [
            accounts_1.VoteRecord,
            {
                kind: 'struct',
                fields: [
                    ['accountType', 'u8'],
                    ['proposal', 'pubkey'],
                    ['governingTokenOwner', 'pubkey'],
                    ['isRelinquished', 'u8'],
                    ...(programVersion === exports.PROGRAM_VERSION_V1
                        ? [['voteWeight', accounts_1.VoteWeight]]
                        : [
                            ['voterWeight', 'u64'],
                            ['vote', 'vote'],
                        ]),
                ],
            },
        ],
        [
            accounts_1.ProposalInstruction,
            {
                kind: 'struct',
                fields: [
                    ['accountType', 'u8'],
                    ['proposal', 'pubkey'],
                    programVersion > exports.PROGRAM_VERSION_V1
                        ? ['optionIndex', 'u16']
                        : undefined,
                    ['instructionIndex', 'u16'],
                    ['holdUpTime', 'u32'],
                    ['instruction', accounts_1.InstructionData],
                    ['executedAt', { kind: 'option', type: 'u64' }],
                    ['executionStatus', 'u8'],
                ].filter(Boolean),
            },
        ],
    ]);
}
function getGovernanceSchemaForAccount(accountType) {
    return getGovernanceSchema((0, accounts_1.getAccountProgramVersion)(accountType));
}
exports.getGovernanceSchemaForAccount = getGovernanceSchemaForAccount;
const GovernanceAccountParser = (classType) => (0, serialisation_1.BorshAccountParser)(classType, (accountType) => getGovernanceSchemaForAccount(accountType));
exports.GovernanceAccountParser = GovernanceAccountParser;
function getInstructionDataFromBase64(instructionDataBase64) {
    const instructionDataBin = Buffer.from(instructionDataBase64, 'base64');
    const instructionData = (0, borsh_3.deserializeUnchecked)(exports.GOVERNANCE_SCHEMA, accounts_1.InstructionData, instructionDataBin);
    return instructionData;
}
exports.getInstructionDataFromBase64 = getInstructionDataFromBase64;
//# sourceMappingURL=serialisation.js.map