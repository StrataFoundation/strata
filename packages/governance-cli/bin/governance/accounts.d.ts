import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { Vote } from './instructions';
export declare const PROGRAM_VERSION_V1 = 1;
export declare const PROGRAM_VERSION_V2 = 2;
export declare const GOVERNANCE_PROGRAM_SEED = "governance";
export declare enum GovernanceAccountType {
    Uninitialized = 0,
    Realm = 1,
    TokenOwnerRecord = 2,
    AccountGovernance = 3,
    ProgramGovernance = 4,
    ProposalV1 = 5,
    SignatoryRecord = 6,
    VoteRecordV1 = 7,
    ProposalInstructionV1 = 8,
    MintGovernance = 9,
    TokenGovernance = 10,
    RealmConfig = 11,
    VoteRecordV2 = 12,
    ProposalInstructionV2 = 13,
    ProposalV2 = 14
}
export interface GovernanceAccount {
    accountType: GovernanceAccountType;
}
export declare type GovernanceAccountClass = typeof Realm | typeof TokenOwnerRecord | typeof Governance | typeof Proposal | typeof SignatoryRecord | typeof VoteRecord | typeof ProposalInstruction | typeof RealmConfigAccount;
export declare function getAccountTypes(accountClass: GovernanceAccountClass): GovernanceAccountType[];
export declare function getAccountProgramVersion(accountType: GovernanceAccountType): 1 | 2;
export declare enum VoteThresholdPercentageType {
    YesVote = 0,
    Quorum = 1
}
export declare class VoteThresholdPercentage {
    type: VoteThresholdPercentageType;
    value: number;
    constructor(args: {
        value: number;
    });
}
export declare enum VoteWeightSource {
    Deposit = 0,
    Snapshot = 1
}
export declare enum InstructionExecutionStatus {
    None = 0,
    Success = 1,
    Error = 2
}
export declare enum InstructionExecutionFlags {
    None = 0,
    Ordered = 1,
    UseTransaction = 2
}
export declare enum MintMaxVoteWeightSourceType {
    SupplyFraction = 0,
    Absolute = 1
}
export declare class MintMaxVoteWeightSource {
    type: MintMaxVoteWeightSourceType;
    value: BN;
    constructor(args: {
        value: BN;
    });
    static SUPPLY_FRACTION_BASE: BN;
    static SUPPLY_FRACTION_DECIMALS: number;
    static FULL_SUPPLY_FRACTION: MintMaxVoteWeightSource;
    isFullSupply(): boolean;
    getSupplyFraction(): BN;
}
export declare enum VoteTypeKind {
    SingleChoice = 0,
    MultiChoice = 1
}
export declare class VoteType {
    type: VoteTypeKind;
    choiceCount: number | undefined;
    constructor(args: {
        type: VoteTypeKind;
        choiceCount: number | undefined;
    });
    static SINGLE_CHOICE: VoteType;
    static MULTI_CHOICE: (choiceCount: number) => VoteType;
    isSingleChoice(): boolean;
}
export declare class RealmConfigArgs {
    useCouncilMint: boolean;
    communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
    minCommunityTokensToCreateGovernance: BN;
    useCommunityVoterWeightAddin: boolean;
    constructor(args: {
        useCouncilMint: boolean;
        communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
        minCommunityTokensToCreateGovernance: BN;
        useCommunityVoterWeightAddin: boolean;
    });
}
export declare class RealmConfig {
    councilMint: PublicKey | undefined;
    communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
    minCommunityTokensToCreateGovernance: BN;
    useCommunityVoterWeightAddin: boolean;
    reserved: Uint8Array;
    constructor(args: {
        councilMint: PublicKey | undefined;
        communityMintMaxVoteWeightSource: MintMaxVoteWeightSource;
        minCommunityTokensToCreateGovernance: BN;
        reserved: Uint8Array;
        useCommunityVoterWeightAddin: boolean;
    });
}
export declare class Realm {
    accountType: GovernanceAccountType;
    communityMint: PublicKey;
    config: RealmConfig;
    reserved: Uint8Array;
    authority: PublicKey | undefined;
    name: string;
    constructor(args: {
        communityMint: PublicKey;
        reserved: Uint8Array;
        config: RealmConfig;
        authority: PublicKey | undefined;
        name: string;
    });
}
export declare function getTokenHoldingAddress(programId: PublicKey, realm: PublicKey, governingTokenMint: PublicKey): Promise<PublicKey>;
export declare class RealmConfigAccount {
    accountType: GovernanceAccountType;
    realm: PublicKey;
    communityVoterWeightAddin: PublicKey | undefined;
    constructor(args: {
        realm: PublicKey;
        communityVoterWeightAddin: PublicKey | undefined;
    });
}
export declare function getRealmConfigAddress(programId: PublicKey, realm: PublicKey): Promise<PublicKey>;
export declare class GovernanceConfig {
    voteThresholdPercentage: VoteThresholdPercentage;
    minCommunityTokensToCreateProposal: BN;
    minInstructionHoldUpTime: number;
    maxVotingTime: number;
    voteWeightSource: VoteWeightSource;
    proposalCoolOffTime: number;
    minCouncilTokensToCreateProposal: BN;
    constructor(args: {
        voteThresholdPercentage: VoteThresholdPercentage;
        minCommunityTokensToCreateProposal: BN;
        minInstructionHoldUpTime: number;
        maxVotingTime: number;
        voteWeightSource?: VoteWeightSource;
        proposalCoolOffTime?: number;
        minCouncilTokensToCreateProposal: BN;
    });
}
export declare class Governance {
    accountType: GovernanceAccountType;
    realm: PublicKey;
    governedAccount: PublicKey;
    config: GovernanceConfig;
    proposalCount: number;
    reserved?: Uint8Array;
    constructor(args: {
        realm: PublicKey;
        governedAccount: PublicKey;
        accountType: number;
        config: GovernanceConfig;
        reserved?: Uint8Array;
        proposalCount: number;
    });
    isProgramGovernance(): boolean;
    isAccountGovernance(): boolean;
    isMintGovernance(): boolean;
    isTokenGovernance(): boolean;
}
export declare class TokenOwnerRecord {
    accountType: GovernanceAccountType;
    realm: PublicKey;
    governingTokenMint: PublicKey;
    governingTokenOwner: PublicKey;
    governingTokenDepositAmount: BN;
    unrelinquishedVotesCount: number;
    totalVotesCount: number;
    outstandingProposalCount: number;
    reserved: Uint8Array;
    governanceDelegate?: PublicKey;
    constructor(args: {
        realm: PublicKey;
        governingTokenMint: PublicKey;
        governingTokenOwner: PublicKey;
        governingTokenDepositAmount: BN;
        unrelinquishedVotesCount: number;
        totalVotesCount: number;
        outstandingProposalCount: number;
        reserved: Uint8Array;
    });
}
export declare function getTokenOwnerRecordAddress(programId: PublicKey, realm: PublicKey, governingTokenMint: PublicKey, governingTokenOwner: PublicKey): Promise<PublicKey>;
export declare enum ProposalState {
    Draft = 0,
    SigningOff = 1,
    Voting = 2,
    Succeeded = 3,
    Executing = 4,
    Completed = 5,
    Cancelled = 6,
    Defeated = 7,
    ExecutingWithErrors = 8
}
export declare enum OptionVoteResult {
    None = 0,
    Succeeded = 1,
    Defeated = 2
}
export declare class ProposalOption {
    label: string;
    voteWeight: BN;
    voteResult: OptionVoteResult;
    instructionsExecutedCount: number;
    instructionsCount: number;
    instructionsNextIndex: number;
    constructor(args: {
        label: string;
        voteWeight: BN;
        voteResult: OptionVoteResult;
        instructionsExecutedCount: number;
        instructionsCount: number;
        instructionsNextIndex: number;
    });
}
export declare class Proposal {
    accountType: GovernanceAccountType;
    governance: PublicKey;
    governingTokenMint: PublicKey;
    state: ProposalState;
    tokenOwnerRecord: PublicKey;
    signatoriesCount: number;
    signatoriesSignedOffCount: number;
    yesVotesCount: BN;
    noVotesCount: BN;
    instructionsExecutedCount: number;
    instructionsCount: number;
    instructionsNextIndex: number;
    voteType: VoteType;
    options: ProposalOption[];
    denyVoteWeight: BN | undefined;
    draftAt: BN;
    signingOffAt: BN | null;
    votingAt: BN | null;
    votingAtSlot: BN | null;
    votingCompletedAt: BN | null;
    executingAt: BN | null;
    closedAt: BN | null;
    executionFlags: InstructionExecutionFlags;
    maxVoteWeight: BN | null;
    voteThresholdPercentage: VoteThresholdPercentage | null;
    name: string;
    descriptionLink: string;
    constructor(args: {
        accountType: GovernanceAccountType;
        governance: PublicKey;
        governingTokenMint: PublicKey;
        state: ProposalState;
        tokenOwnerRecord: PublicKey;
        signatoriesCount: number;
        signatoriesSignedOffCount: number;
        descriptionLink: string;
        name: string;
        yesVotesCount: BN;
        noVotesCount: BN;
        instructionsExecutedCount: number;
        instructionsCount: number;
        instructionsNextIndex: number;
        voteType: VoteType;
        options: ProposalOption[];
        denyVoteWeight: BN | undefined;
        draftAt: BN;
        signingOffAt: BN | null;
        votingAt: BN | null;
        votingAtSlot: BN | null;
        votingCompletedAt: BN | null;
        executingAt: BN | null;
        closedAt: BN | null;
        executionFlags: InstructionExecutionFlags;
        maxVoteWeight: BN | null;
        voteThresholdPercentage: VoteThresholdPercentage | null;
    });
    isVoteFinalized(): boolean;
    isFinalState(): boolean;
    getStateTimestamp(): number;
    getStateSortRank(): number;
    isPreVotingState(): boolean;
    getYesVoteOption(): ProposalOption;
    getYesVoteCount(): BN;
    getNoVoteCount(): BN;
}
export declare class SignatoryRecord {
    accountType: GovernanceAccountType;
    proposal: PublicKey;
    signatory: PublicKey;
    signedOff: boolean;
    constructor(args: {
        proposal: PublicKey;
        signatory: PublicKey;
        signedOff: boolean;
    });
}
export declare function getSignatoryRecordAddress(programId: PublicKey, proposal: PublicKey, signatory: PublicKey): Promise<PublicKey>;
export declare class VoteWeight {
    yes: BN;
    no: BN;
    constructor(args: {
        yes: BN;
        no: BN;
    });
}
export declare class VoteRecord {
    accountType: GovernanceAccountType;
    proposal: PublicKey;
    governingTokenOwner: PublicKey;
    isRelinquished: boolean;
    voteWeight: VoteWeight | undefined;
    voterWeight: BN | undefined;
    vote: Vote | undefined;
    constructor(args: {
        accountType: GovernanceAccountType;
        proposal: PublicKey;
        governingTokenOwner: PublicKey;
        isRelinquished: boolean;
        voteWeight: VoteWeight | undefined;
        voterWeight: BN | undefined;
        vote: Vote | undefined;
    });
    getNoVoteWeight(): BN | undefined;
    getYesVoteWeight(): BN | undefined;
}
export declare function getVoteRecordAddress(programId: PublicKey, proposal: PublicKey, tokenOwnerRecord: PublicKey): Promise<PublicKey>;
export declare class AccountMetaData {
    pubkey: PublicKey;
    isSigner: boolean;
    isWritable: boolean;
    constructor(args: {
        pubkey: PublicKey;
        isSigner: boolean;
        isWritable: boolean;
    });
}
export declare class InstructionData {
    programId: PublicKey;
    accounts: AccountMetaData[];
    data: Uint8Array;
    constructor(args: {
        programId: PublicKey;
        accounts: AccountMetaData[];
        data: Uint8Array;
    });
}
export declare class ProposalInstruction {
    accountType: GovernanceAccountType;
    proposal: PublicKey;
    instructionIndex: number;
    optionIndex: number;
    holdUpTime: number;
    instruction: InstructionData;
    executedAt: BN | null;
    executionStatus: InstructionExecutionStatus;
    constructor(args: {
        proposal: PublicKey;
        instructionIndex: number;
        optionIndex: number;
        holdUpTime: number;
        instruction: InstructionData;
        executedAt: BN | null;
        executionStatus: InstructionExecutionStatus;
    });
}
export declare function getProposalInstructionAddress(programId: PublicKey, programVersion: number, proposal: PublicKey, optionIndex: number, instructionIndex: number): Promise<PublicKey>;
//# sourceMappingURL=accounts.d.ts.map