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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProposalInstructionAddress = exports.ProposalInstruction = exports.InstructionData = exports.AccountMetaData = exports.getVoteRecordAddress = exports.VoteRecord = exports.VoteWeight = exports.getSignatoryRecordAddress = exports.SignatoryRecord = exports.Proposal = exports.ProposalOption = exports.OptionVoteResult = exports.ProposalState = exports.getTokenOwnerRecordAddress = exports.TokenOwnerRecord = exports.Governance = exports.GovernanceConfig = exports.getRealmConfigAddress = exports.RealmConfigAccount = exports.getTokenHoldingAddress = exports.Realm = exports.RealmConfig = exports.RealmConfigArgs = exports.VoteType = exports.VoteTypeKind = exports.MintMaxVoteWeightSource = exports.MintMaxVoteWeightSourceType = exports.InstructionExecutionFlags = exports.InstructionExecutionStatus = exports.VoteWeightSource = exports.VoteThresholdPercentage = exports.VoteThresholdPercentageType = exports.getAccountProgramVersion = exports.getAccountTypes = exports.GovernanceAccountType = exports.GOVERNANCE_PROGRAM_SEED = exports.PROGRAM_VERSION_V2 = exports.PROGRAM_VERSION_V1 = void 0;
const web3_js_1 = require("@solana/web3.js");
const bn_js_1 = __importDefault(require("bn.js"));
const instructions_1 = require("./instructions");
exports.PROGRAM_VERSION_V1 = 1;
exports.PROGRAM_VERSION_V2 = 2;
/// Seed  prefix for Governance Program PDAs
exports.GOVERNANCE_PROGRAM_SEED = 'governance';
var GovernanceAccountType;
(function (GovernanceAccountType) {
    GovernanceAccountType[GovernanceAccountType["Uninitialized"] = 0] = "Uninitialized";
    GovernanceAccountType[GovernanceAccountType["Realm"] = 1] = "Realm";
    GovernanceAccountType[GovernanceAccountType["TokenOwnerRecord"] = 2] = "TokenOwnerRecord";
    GovernanceAccountType[GovernanceAccountType["AccountGovernance"] = 3] = "AccountGovernance";
    GovernanceAccountType[GovernanceAccountType["ProgramGovernance"] = 4] = "ProgramGovernance";
    GovernanceAccountType[GovernanceAccountType["ProposalV1"] = 5] = "ProposalV1";
    GovernanceAccountType[GovernanceAccountType["SignatoryRecord"] = 6] = "SignatoryRecord";
    GovernanceAccountType[GovernanceAccountType["VoteRecordV1"] = 7] = "VoteRecordV1";
    GovernanceAccountType[GovernanceAccountType["ProposalInstructionV1"] = 8] = "ProposalInstructionV1";
    GovernanceAccountType[GovernanceAccountType["MintGovernance"] = 9] = "MintGovernance";
    GovernanceAccountType[GovernanceAccountType["TokenGovernance"] = 10] = "TokenGovernance";
    GovernanceAccountType[GovernanceAccountType["RealmConfig"] = 11] = "RealmConfig";
    GovernanceAccountType[GovernanceAccountType["VoteRecordV2"] = 12] = "VoteRecordV2";
    GovernanceAccountType[GovernanceAccountType["ProposalInstructionV2"] = 13] = "ProposalInstructionV2";
    GovernanceAccountType[GovernanceAccountType["ProposalV2"] = 14] = "ProposalV2";
})(GovernanceAccountType = exports.GovernanceAccountType || (exports.GovernanceAccountType = {}));
function getAccountTypes(accountClass) {
    switch (accountClass) {
        case Realm:
            return [GovernanceAccountType.Realm];
        case TokenOwnerRecord:
            return [GovernanceAccountType.TokenOwnerRecord];
        case Proposal:
            return [
                GovernanceAccountType.ProposalV1,
                GovernanceAccountType.ProposalV2,
            ];
        case SignatoryRecord:
            return [GovernanceAccountType.SignatoryRecord];
        case VoteRecord:
            return [
                GovernanceAccountType.VoteRecordV1,
                GovernanceAccountType.VoteRecordV2,
            ];
        case ProposalInstruction:
            return [
                GovernanceAccountType.ProposalInstructionV1,
                GovernanceAccountType.ProposalInstructionV2,
            ];
        case RealmConfigAccount:
            return [GovernanceAccountType.RealmConfig];
        case Governance:
            return [
                GovernanceAccountType.AccountGovernance,
                GovernanceAccountType.ProgramGovernance,
                GovernanceAccountType.MintGovernance,
                GovernanceAccountType.TokenGovernance,
            ];
        default:
            throw Error(`${accountClass} account is not supported`);
    }
}
exports.getAccountTypes = getAccountTypes;
function getAccountProgramVersion(accountType) {
    switch (accountType) {
        case GovernanceAccountType.VoteRecordV2:
        case GovernanceAccountType.ProposalInstructionV2:
        case GovernanceAccountType.ProposalV2:
            return exports.PROGRAM_VERSION_V2;
        default:
            return exports.PROGRAM_VERSION_V1;
    }
}
exports.getAccountProgramVersion = getAccountProgramVersion;
var VoteThresholdPercentageType;
(function (VoteThresholdPercentageType) {
    VoteThresholdPercentageType[VoteThresholdPercentageType["YesVote"] = 0] = "YesVote";
    VoteThresholdPercentageType[VoteThresholdPercentageType["Quorum"] = 1] = "Quorum";
})(VoteThresholdPercentageType = exports.VoteThresholdPercentageType || (exports.VoteThresholdPercentageType = {}));
class VoteThresholdPercentage {
    constructor(args) {
        this.type = VoteThresholdPercentageType.YesVote;
        this.value = args.value;
    }
}
exports.VoteThresholdPercentage = VoteThresholdPercentage;
var VoteWeightSource;
(function (VoteWeightSource) {
    VoteWeightSource[VoteWeightSource["Deposit"] = 0] = "Deposit";
    VoteWeightSource[VoteWeightSource["Snapshot"] = 1] = "Snapshot";
})(VoteWeightSource = exports.VoteWeightSource || (exports.VoteWeightSource = {}));
var InstructionExecutionStatus;
(function (InstructionExecutionStatus) {
    InstructionExecutionStatus[InstructionExecutionStatus["None"] = 0] = "None";
    InstructionExecutionStatus[InstructionExecutionStatus["Success"] = 1] = "Success";
    InstructionExecutionStatus[InstructionExecutionStatus["Error"] = 2] = "Error";
})(InstructionExecutionStatus = exports.InstructionExecutionStatus || (exports.InstructionExecutionStatus = {}));
var InstructionExecutionFlags;
(function (InstructionExecutionFlags) {
    InstructionExecutionFlags[InstructionExecutionFlags["None"] = 0] = "None";
    InstructionExecutionFlags[InstructionExecutionFlags["Ordered"] = 1] = "Ordered";
    InstructionExecutionFlags[InstructionExecutionFlags["UseTransaction"] = 2] = "UseTransaction";
})(InstructionExecutionFlags = exports.InstructionExecutionFlags || (exports.InstructionExecutionFlags = {}));
var MintMaxVoteWeightSourceType;
(function (MintMaxVoteWeightSourceType) {
    MintMaxVoteWeightSourceType[MintMaxVoteWeightSourceType["SupplyFraction"] = 0] = "SupplyFraction";
    MintMaxVoteWeightSourceType[MintMaxVoteWeightSourceType["Absolute"] = 1] = "Absolute";
})(MintMaxVoteWeightSourceType = exports.MintMaxVoteWeightSourceType || (exports.MintMaxVoteWeightSourceType = {}));
class MintMaxVoteWeightSource {
    constructor(args) {
        this.type = MintMaxVoteWeightSourceType.SupplyFraction;
        this.value = args.value;
    }
    isFullSupply() {
        return (this.type === MintMaxVoteWeightSourceType.SupplyFraction &&
            this.value.cmp(MintMaxVoteWeightSource.SUPPLY_FRACTION_BASE) === 0);
    }
    getSupplyFraction() {
        if (this.type !== MintMaxVoteWeightSourceType.SupplyFraction) {
            throw new Error('Max vote weight is not fraction');
        }
        return this.value;
    }
}
exports.MintMaxVoteWeightSource = MintMaxVoteWeightSource;
MintMaxVoteWeightSource.SUPPLY_FRACTION_BASE = new bn_js_1.default(10000000000);
MintMaxVoteWeightSource.SUPPLY_FRACTION_DECIMALS = 10;
MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION = new MintMaxVoteWeightSource({
    value: MintMaxVoteWeightSource.SUPPLY_FRACTION_BASE,
});
var VoteTypeKind;
(function (VoteTypeKind) {
    VoteTypeKind[VoteTypeKind["SingleChoice"] = 0] = "SingleChoice";
    VoteTypeKind[VoteTypeKind["MultiChoice"] = 1] = "MultiChoice";
})(VoteTypeKind = exports.VoteTypeKind || (exports.VoteTypeKind = {}));
class VoteType {
    constructor(args) {
        this.type = args.type;
        this.choiceCount = args.choiceCount;
    }
    isSingleChoice() {
        return this.type === VoteTypeKind.SingleChoice;
    }
}
exports.VoteType = VoteType;
VoteType.SINGLE_CHOICE = new VoteType({
    type: VoteTypeKind.SingleChoice,
    choiceCount: undefined,
});
VoteType.MULTI_CHOICE = (choiceCount) => new VoteType({
    type: VoteTypeKind.MultiChoice,
    choiceCount: choiceCount,
});
class RealmConfigArgs {
    constructor(args) {
        this.useCouncilMint = !!args.useCouncilMint;
        this.communityMintMaxVoteWeightSource =
            args.communityMintMaxVoteWeightSource;
        this.minCommunityTokensToCreateGovernance =
            args.minCommunityTokensToCreateGovernance;
        this.useCommunityVoterWeightAddin = args.useCommunityVoterWeightAddin;
    }
}
exports.RealmConfigArgs = RealmConfigArgs;
class RealmConfig {
    constructor(args) {
        this.councilMint = args.councilMint;
        this.communityMintMaxVoteWeightSource =
            args.communityMintMaxVoteWeightSource;
        this.minCommunityTokensToCreateGovernance =
            args.minCommunityTokensToCreateGovernance;
        this.useCommunityVoterWeightAddin = args.useCommunityVoterWeightAddin;
        this.reserved = args.reserved;
    }
}
exports.RealmConfig = RealmConfig;
class Realm {
    constructor(args) {
        this.accountType = GovernanceAccountType.Realm;
        this.communityMint = args.communityMint;
        this.config = args.config;
        this.reserved = args.reserved;
        this.authority = args.authority;
        this.name = args.name;
    }
}
exports.Realm = Realm;
function getTokenHoldingAddress(programId, realm, governingTokenMint) {
    return __awaiter(this, void 0, void 0, function* () {
        const [tokenHoldingAddress] = yield web3_js_1.PublicKey.findProgramAddress([
            Buffer.from(exports.GOVERNANCE_PROGRAM_SEED),
            realm.toBuffer(),
            governingTokenMint.toBuffer(),
        ], programId);
        return tokenHoldingAddress;
    });
}
exports.getTokenHoldingAddress = getTokenHoldingAddress;
class RealmConfigAccount {
    constructor(args) {
        this.accountType = GovernanceAccountType.RealmConfig;
        this.realm = args.realm;
        this.communityVoterWeightAddin = args.communityVoterWeightAddin;
    }
}
exports.RealmConfigAccount = RealmConfigAccount;
function getRealmConfigAddress(programId, realm) {
    return __awaiter(this, void 0, void 0, function* () {
        const [realmConfigAddress] = yield web3_js_1.PublicKey.findProgramAddress([Buffer.from('realm-config'), realm.toBuffer()], programId);
        return realmConfigAddress;
    });
}
exports.getRealmConfigAddress = getRealmConfigAddress;
class GovernanceConfig {
    constructor(args) {
        var _a, _b;
        this.voteThresholdPercentage = args.voteThresholdPercentage;
        this.minCommunityTokensToCreateProposal =
            args.minCommunityTokensToCreateProposal;
        this.minInstructionHoldUpTime = args.minInstructionHoldUpTime;
        this.maxVotingTime = args.maxVotingTime;
        this.voteWeightSource = (_a = args.voteWeightSource) !== null && _a !== void 0 ? _a : VoteWeightSource.Deposit;
        this.proposalCoolOffTime = (_b = args.proposalCoolOffTime) !== null && _b !== void 0 ? _b : 0;
        this.minCouncilTokensToCreateProposal =
            args.minCouncilTokensToCreateProposal;
    }
}
exports.GovernanceConfig = GovernanceConfig;
class Governance {
    constructor(args) {
        this.accountType = args.accountType;
        this.realm = args.realm;
        this.governedAccount = args.governedAccount;
        this.config = args.config;
        this.reserved = args.reserved;
        this.proposalCount = args.proposalCount;
    }
    isProgramGovernance() {
        return this.accountType === GovernanceAccountType.ProgramGovernance;
    }
    isAccountGovernance() {
        return this.accountType === GovernanceAccountType.AccountGovernance;
    }
    isMintGovernance() {
        return this.accountType === GovernanceAccountType.MintGovernance;
    }
    isTokenGovernance() {
        return this.accountType === GovernanceAccountType.TokenGovernance;
    }
}
exports.Governance = Governance;
class TokenOwnerRecord {
    constructor(args) {
        this.accountType = GovernanceAccountType.TokenOwnerRecord;
        this.realm = args.realm;
        this.governingTokenMint = args.governingTokenMint;
        this.governingTokenOwner = args.governingTokenOwner;
        this.governingTokenDepositAmount = args.governingTokenDepositAmount;
        this.unrelinquishedVotesCount = args.unrelinquishedVotesCount;
        this.totalVotesCount = args.totalVotesCount;
        this.outstandingProposalCount = args.outstandingProposalCount;
        this.reserved = args.reserved;
    }
}
exports.TokenOwnerRecord = TokenOwnerRecord;
function getTokenOwnerRecordAddress(programId, realm, governingTokenMint, governingTokenOwner) {
    return __awaiter(this, void 0, void 0, function* () {
        const [tokenOwnerRecordAddress] = yield web3_js_1.PublicKey.findProgramAddress([
            Buffer.from(exports.GOVERNANCE_PROGRAM_SEED),
            realm.toBuffer(),
            governingTokenMint.toBuffer(),
            governingTokenOwner.toBuffer(),
        ], programId);
        return tokenOwnerRecordAddress;
    });
}
exports.getTokenOwnerRecordAddress = getTokenOwnerRecordAddress;
var ProposalState;
(function (ProposalState) {
    ProposalState[ProposalState["Draft"] = 0] = "Draft";
    ProposalState[ProposalState["SigningOff"] = 1] = "SigningOff";
    ProposalState[ProposalState["Voting"] = 2] = "Voting";
    ProposalState[ProposalState["Succeeded"] = 3] = "Succeeded";
    ProposalState[ProposalState["Executing"] = 4] = "Executing";
    ProposalState[ProposalState["Completed"] = 5] = "Completed";
    ProposalState[ProposalState["Cancelled"] = 6] = "Cancelled";
    ProposalState[ProposalState["Defeated"] = 7] = "Defeated";
    ProposalState[ProposalState["ExecutingWithErrors"] = 8] = "ExecutingWithErrors";
})(ProposalState = exports.ProposalState || (exports.ProposalState = {}));
var OptionVoteResult;
(function (OptionVoteResult) {
    OptionVoteResult[OptionVoteResult["None"] = 0] = "None";
    OptionVoteResult[OptionVoteResult["Succeeded"] = 1] = "Succeeded";
    OptionVoteResult[OptionVoteResult["Defeated"] = 2] = "Defeated";
})(OptionVoteResult = exports.OptionVoteResult || (exports.OptionVoteResult = {}));
class ProposalOption {
    constructor(args) {
        this.label = args.label;
        this.voteWeight = args.voteWeight;
        this.voteResult = args.voteResult;
        this.instructionsExecutedCount = args.instructionsExecutedCount;
        this.instructionsCount = args.instructionsCount;
        this.instructionsNextIndex = args.instructionsNextIndex;
    }
}
exports.ProposalOption = ProposalOption;
class Proposal {
    constructor(args) {
        this.accountType = args.accountType;
        this.governance = args.governance;
        this.governingTokenMint = args.governingTokenMint;
        this.state = args.state;
        this.tokenOwnerRecord = args.tokenOwnerRecord;
        this.signatoriesCount = args.signatoriesCount;
        this.signatoriesSignedOffCount = args.signatoriesSignedOffCount;
        this.descriptionLink = args.descriptionLink;
        this.name = args.name;
        // V1
        this.yesVotesCount = args.yesVotesCount;
        this.noVotesCount = args.noVotesCount;
        this.instructionsExecutedCount = args.instructionsExecutedCount;
        this.instructionsCount = args.instructionsCount;
        this.instructionsNextIndex = args.instructionsNextIndex;
        //
        // V2
        this.voteType = args.voteType;
        this.options = args.options;
        this.denyVoteWeight = args.denyVoteWeight;
        this.draftAt = args.draftAt;
        this.signingOffAt = args.signingOffAt;
        this.votingAt = args.votingAt;
        this.votingAtSlot = args.votingAtSlot;
        this.votingCompletedAt = args.votingCompletedAt;
        this.executingAt = args.executingAt;
        this.closedAt = args.closedAt;
        this.executionFlags = args.executionFlags;
        this.maxVoteWeight = args.maxVoteWeight;
        this.voteThresholdPercentage = args.voteThresholdPercentage;
    }
    /// Returns true if Proposal is in state when no voting can happen any longer
    isVoteFinalized() {
        switch (this.state) {
            case ProposalState.Succeeded:
            case ProposalState.Executing:
            case ProposalState.Completed:
            case ProposalState.Cancelled:
            case ProposalState.Defeated:
            case ProposalState.ExecutingWithErrors:
                return true;
            case ProposalState.Draft:
            case ProposalState.SigningOff:
            case ProposalState.Voting:
                return false;
        }
    }
    isFinalState() {
        // 1) ExecutingWithErrors is not really a final state, it's undefined.
        //    However it usually indicates none recoverable execution error so we treat is as final for the ui purposes
        // 2) Succeeded with no instructions is also treated as final since it can't transition any longer
        //    It really doesn't make any sense but until it's solved in the program we have to consider it as final in the ui
        switch (this.state) {
            case ProposalState.Completed:
            case ProposalState.Cancelled:
            case ProposalState.Defeated:
            case ProposalState.ExecutingWithErrors:
                return true;
            case ProposalState.Succeeded:
                return this.instructionsCount === 0;
            case ProposalState.Executing:
            case ProposalState.Draft:
            case ProposalState.SigningOff:
            case ProposalState.Voting:
                return false;
        }
    }
    getStateTimestamp() {
        switch (this.state) {
            case ProposalState.Succeeded:
            case ProposalState.Defeated:
                return this.votingCompletedAt ? this.votingCompletedAt.toNumber() : 0;
            case ProposalState.Completed:
            case ProposalState.Cancelled:
                return this.closedAt ? this.closedAt.toNumber() : 0;
            case ProposalState.Executing:
            case ProposalState.ExecutingWithErrors:
                return this.executingAt ? this.executingAt.toNumber() : 0;
            case ProposalState.Draft:
                return this.draftAt.toNumber();
            case ProposalState.SigningOff:
                return this.signingOffAt ? this.signingOffAt.toNumber() : 0;
            case ProposalState.Voting:
                return this.votingAt ? this.votingAt.toNumber() : 0;
        }
    }
    getStateSortRank() {
        // Always show proposals in voting state at the top
        if (this.state === ProposalState.Voting) {
            return 2;
        }
        // Then show proposals in pending state and finalized at the end
        return this.isFinalState() ? 0 : 1;
    }
    /// Returns true if Proposal has not been voted on yet
    isPreVotingState() {
        return !this.votingAtSlot;
    }
    getYesVoteOption() {
        if (this.options.length !== 1 && !this.voteType.isSingleChoice()) {
            throw new Error('Proposal is not Yes/No vote');
        }
        return this.options[0];
    }
    getYesVoteCount() {
        switch (this.accountType) {
            case GovernanceAccountType.ProposalV1:
                return this.yesVotesCount;
            case GovernanceAccountType.ProposalV2:
                return this.getYesVoteOption().voteWeight;
            default:
                throw new Error(`Invalid account type ${this.accountType}`);
        }
    }
    getNoVoteCount() {
        switch (this.accountType) {
            case GovernanceAccountType.ProposalV1:
                return this.noVotesCount;
            case GovernanceAccountType.ProposalV2:
                return this.denyVoteWeight;
            default:
                throw new Error(`Invalid account type ${this.accountType}`);
        }
    }
}
exports.Proposal = Proposal;
class SignatoryRecord {
    constructor(args) {
        this.accountType = GovernanceAccountType.SignatoryRecord;
        this.proposal = args.proposal;
        this.signatory = args.signatory;
        this.signedOff = !!args.signedOff;
    }
}
exports.SignatoryRecord = SignatoryRecord;
function getSignatoryRecordAddress(programId, proposal, signatory) {
    return __awaiter(this, void 0, void 0, function* () {
        const [signatoryRecordAddress] = yield web3_js_1.PublicKey.findProgramAddress([
            Buffer.from(exports.GOVERNANCE_PROGRAM_SEED),
            proposal.toBuffer(),
            signatory.toBuffer(),
        ], programId);
        return signatoryRecordAddress;
    });
}
exports.getSignatoryRecordAddress = getSignatoryRecordAddress;
class VoteWeight {
    constructor(args) {
        this.yes = args.yes;
        this.no = args.no;
    }
}
exports.VoteWeight = VoteWeight;
class VoteRecord {
    // -------------------------------
    constructor(args) {
        this.accountType = args.accountType;
        this.proposal = args.proposal;
        this.governingTokenOwner = args.governingTokenOwner;
        this.isRelinquished = !!args.isRelinquished;
        // V1
        this.voteWeight = args.voteWeight;
        // V2 -------------------------------
        this.voterWeight = args.voterWeight;
        this.vote = args.vote;
        // -------------------------------
    }
    getNoVoteWeight() {
        var _a, _b;
        switch (this.accountType) {
            case GovernanceAccountType.VoteRecordV1: {
                return (_a = this.voteWeight) === null || _a === void 0 ? void 0 : _a.no;
            }
            case GovernanceAccountType.VoteRecordV2: {
                switch ((_b = this.vote) === null || _b === void 0 ? void 0 : _b.voteType) {
                    case instructions_1.VoteKind.Approve: {
                        return undefined;
                    }
                    case instructions_1.VoteKind.Deny: {
                        return this.voterWeight;
                    }
                    default:
                        throw new Error('Invalid voteKind');
                }
            }
            default:
                throw new Error(`Invalid account type ${this.accountType} `);
        }
    }
    getYesVoteWeight() {
        var _a, _b;
        switch (this.accountType) {
            case GovernanceAccountType.VoteRecordV1: {
                return (_a = this.voteWeight) === null || _a === void 0 ? void 0 : _a.yes;
            }
            case GovernanceAccountType.VoteRecordV2: {
                switch ((_b = this.vote) === null || _b === void 0 ? void 0 : _b.voteType) {
                    case instructions_1.VoteKind.Approve: {
                        return this.voterWeight;
                    }
                    case instructions_1.VoteKind.Deny: {
                        return undefined;
                    }
                    default:
                        throw new Error('Invalid voteKind');
                }
            }
            default:
                throw new Error(`Invalid account type ${this.accountType} `);
        }
    }
}
exports.VoteRecord = VoteRecord;
function getVoteRecordAddress(programId, proposal, tokenOwnerRecord) {
    return __awaiter(this, void 0, void 0, function* () {
        const [voteRecordAddress] = yield web3_js_1.PublicKey.findProgramAddress([
            Buffer.from(exports.GOVERNANCE_PROGRAM_SEED),
            proposal.toBuffer(),
            tokenOwnerRecord.toBuffer(),
        ], programId);
        return voteRecordAddress;
    });
}
exports.getVoteRecordAddress = getVoteRecordAddress;
class AccountMetaData {
    constructor(args) {
        this.pubkey = args.pubkey;
        this.isSigner = !!args.isSigner;
        this.isWritable = !!args.isWritable;
    }
}
exports.AccountMetaData = AccountMetaData;
class InstructionData {
    constructor(args) {
        this.programId = args.programId;
        this.accounts = args.accounts;
        this.data = args.data;
    }
}
exports.InstructionData = InstructionData;
class ProposalInstruction {
    constructor(args) {
        this.accountType = GovernanceAccountType.ProposalInstructionV1;
        this.proposal = args.proposal;
        this.instructionIndex = args.instructionIndex;
        this.optionIndex = args.optionIndex;
        this.holdUpTime = args.holdUpTime;
        this.instruction = args.instruction;
        this.executedAt = args.executedAt;
        this.executionStatus = args.executionStatus;
    }
}
exports.ProposalInstruction = ProposalInstruction;
function getProposalInstructionAddress(programId, programVersion, proposal, optionIndex, instructionIndex) {
    return __awaiter(this, void 0, void 0, function* () {
        let optionIndexBuffer = Buffer.alloc(2);
        optionIndexBuffer.writeInt16LE(optionIndex, 0);
        let instructionIndexBuffer = Buffer.alloc(2);
        instructionIndexBuffer.writeInt16LE(instructionIndex, 0);
        const seeds = programVersion === exports.PROGRAM_VERSION_V1
            ? [
                Buffer.from(exports.GOVERNANCE_PROGRAM_SEED),
                proposal.toBuffer(),
                instructionIndexBuffer,
            ]
            : [
                Buffer.from(exports.GOVERNANCE_PROGRAM_SEED),
                proposal.toBuffer(),
                optionIndexBuffer,
                instructionIndexBuffer,
            ];
        const [instructionAddress] = yield web3_js_1.PublicKey.findProgramAddress(seeds, programId);
        return instructionAddress;
    });
}
exports.getProposalInstructionAddress = getProposalInstructionAddress;
//# sourceMappingURL=accounts.js.map