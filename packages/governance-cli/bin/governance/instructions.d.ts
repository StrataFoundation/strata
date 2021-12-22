import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import { RealmConfigArgs, GovernanceConfig, InstructionData, VoteType } from './accounts';
export declare enum GovernanceInstruction {
    CreateRealm = 0,
    DepositGoverningTokens = 1,
    WithdrawGoverningTokens = 2,
    SetGovernanceDelegate = 3,
    CreateAccountGovernance = 4,
    CreateProgramGovernance = 5,
    CreateProposal = 6,
    AddSignatory = 7,
    RemoveSignatory = 8,
    InsertInstruction = 9,
    RemoveInstruction = 10,
    CancelProposal = 11,
    SignOffProposal = 12,
    CastVote = 13,
    FinalizeVote = 14,
    RelinquishVote = 15,
    ExecuteInstruction = 16,
    CreateMintGovernance = 17,
    CreateTokenGovernance = 18,
    SetGovernanceConfig = 19,
    FlagInstructionError = 20,
    SetRealmAuthority = 21,
    SetRealmConfig = 22
}
export declare class CreateRealmArgs {
    instruction: GovernanceInstruction;
    configArgs: RealmConfigArgs;
    name: string;
    constructor(args: {
        name: string;
        configArgs: RealmConfigArgs;
    });
}
export declare class DepositGoverningTokensArgs {
    instruction: GovernanceInstruction;
    amount: BN;
    constructor(args: {
        amount: BN;
    });
}
export declare class WithdrawGoverningTokensArgs {
    instruction: GovernanceInstruction;
}
export declare class CreateAccountGovernanceArgs {
    instruction: GovernanceInstruction;
    config: GovernanceConfig;
    constructor(args: {
        config: GovernanceConfig;
    });
}
export declare class CreateProgramGovernanceArgs {
    instruction: GovernanceInstruction;
    config: GovernanceConfig;
    transferUpgradeAuthority: boolean;
    constructor(args: {
        config: GovernanceConfig;
        transferUpgradeAuthority: boolean;
    });
}
export declare class CreateMintGovernanceArgs {
    instruction: GovernanceInstruction;
    config: GovernanceConfig;
    transferMintAuthority: boolean;
    constructor(args: {
        config: GovernanceConfig;
        transferMintAuthority: boolean;
    });
}
export declare class CreateTokenGovernanceArgs {
    instruction: GovernanceInstruction;
    config: GovernanceConfig;
    transferTokenOwner: boolean;
    constructor(args: {
        config: GovernanceConfig;
        transferTokenOwner: boolean;
    });
}
export declare class SetGovernanceConfigArgs {
    instruction: GovernanceInstruction;
    config: GovernanceConfig;
    constructor(args: {
        config: GovernanceConfig;
    });
}
export declare class CreateProposalArgs {
    instruction: GovernanceInstruction;
    name: string;
    descriptionLink: string;
    governingTokenMint: PublicKey;
    voteType: VoteType;
    options: string[];
    useDenyOption: boolean;
    constructor(args: {
        name: string;
        descriptionLink: string;
        governingTokenMint: PublicKey;
        voteType: VoteType;
        options: string[];
        useDenyOption: boolean;
    });
}
export declare class AddSignatoryArgs {
    instruction: GovernanceInstruction;
    signatory: PublicKey;
    constructor(args: {
        signatory: PublicKey;
    });
}
export declare class SignOffProposalArgs {
    instruction: GovernanceInstruction;
}
export declare class CancelProposalArgs {
    instruction: GovernanceInstruction;
}
export declare enum YesNoVote {
    Yes = 0,
    No = 1
}
export declare class VoteChoice {
    rank: number;
    weightPercentage: number;
    constructor(args: {
        rank: number;
        weightPercentage: number;
    });
}
export declare enum VoteKind {
    Approve = 0,
    Deny = 1
}
export declare class Vote {
    voteType: VoteKind;
    approveChoices: VoteChoice[] | undefined;
    deny: boolean | undefined;
    constructor(args: {
        voteType: VoteKind;
        approveChoices: VoteChoice[] | undefined;
        deny: boolean | undefined;
    });
    toYesNoVote(): YesNoVote;
    static fromYesNoVote(yesNoVote: YesNoVote): Vote;
}
export declare class CastVoteArgs {
    instruction: GovernanceInstruction;
    yesNoVote: YesNoVote | undefined;
    vote: Vote | undefined;
    constructor(args: {
        yesNoVote: YesNoVote | undefined;
        vote: Vote | undefined;
    });
}
export declare class RelinquishVoteArgs {
    instruction: GovernanceInstruction;
}
export declare class FinalizeVoteArgs {
    instruction: GovernanceInstruction;
}
export declare class InsertInstructionArgs {
    instruction: GovernanceInstruction;
    index: number;
    optionIndex: number;
    holdUpTime: number;
    instructionData: InstructionData;
    constructor(args: {
        index: number;
        optionIndex: number;
        holdUpTime: number;
        instructionData: InstructionData;
    });
}
export declare class RemoveInstructionArgs {
    instruction: GovernanceInstruction;
}
export declare class ExecuteInstructionArgs {
    instruction: GovernanceInstruction;
}
export declare class FlagInstructionErrorArgs {
    instruction: GovernanceInstruction;
}
export declare class SetRealmAuthorityArgs {
    instruction: GovernanceInstruction;
    newRealmAuthority: PublicKey;
    constructor(args: {
        newRealmAuthority: PublicKey;
    });
}
export declare class SetRealmConfigArgs {
    instruction: GovernanceInstruction;
    configArgs: RealmConfigArgs;
    constructor(args: {
        configArgs: RealmConfigArgs;
    });
}
//# sourceMappingURL=instructions.d.ts.map