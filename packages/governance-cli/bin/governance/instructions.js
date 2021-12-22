"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetRealmConfigArgs = exports.SetRealmAuthorityArgs = exports.FlagInstructionErrorArgs = exports.ExecuteInstructionArgs = exports.RemoveInstructionArgs = exports.InsertInstructionArgs = exports.FinalizeVoteArgs = exports.RelinquishVoteArgs = exports.CastVoteArgs = exports.Vote = exports.VoteKind = exports.VoteChoice = exports.YesNoVote = exports.CancelProposalArgs = exports.SignOffProposalArgs = exports.AddSignatoryArgs = exports.CreateProposalArgs = exports.SetGovernanceConfigArgs = exports.CreateTokenGovernanceArgs = exports.CreateMintGovernanceArgs = exports.CreateProgramGovernanceArgs = exports.CreateAccountGovernanceArgs = exports.WithdrawGoverningTokensArgs = exports.DepositGoverningTokensArgs = exports.CreateRealmArgs = exports.GovernanceInstruction = void 0;
var GovernanceInstruction;
(function (GovernanceInstruction) {
    GovernanceInstruction[GovernanceInstruction["CreateRealm"] = 0] = "CreateRealm";
    GovernanceInstruction[GovernanceInstruction["DepositGoverningTokens"] = 1] = "DepositGoverningTokens";
    GovernanceInstruction[GovernanceInstruction["WithdrawGoverningTokens"] = 2] = "WithdrawGoverningTokens";
    GovernanceInstruction[GovernanceInstruction["SetGovernanceDelegate"] = 3] = "SetGovernanceDelegate";
    GovernanceInstruction[GovernanceInstruction["CreateAccountGovernance"] = 4] = "CreateAccountGovernance";
    GovernanceInstruction[GovernanceInstruction["CreateProgramGovernance"] = 5] = "CreateProgramGovernance";
    GovernanceInstruction[GovernanceInstruction["CreateProposal"] = 6] = "CreateProposal";
    GovernanceInstruction[GovernanceInstruction["AddSignatory"] = 7] = "AddSignatory";
    GovernanceInstruction[GovernanceInstruction["RemoveSignatory"] = 8] = "RemoveSignatory";
    GovernanceInstruction[GovernanceInstruction["InsertInstruction"] = 9] = "InsertInstruction";
    GovernanceInstruction[GovernanceInstruction["RemoveInstruction"] = 10] = "RemoveInstruction";
    GovernanceInstruction[GovernanceInstruction["CancelProposal"] = 11] = "CancelProposal";
    GovernanceInstruction[GovernanceInstruction["SignOffProposal"] = 12] = "SignOffProposal";
    GovernanceInstruction[GovernanceInstruction["CastVote"] = 13] = "CastVote";
    GovernanceInstruction[GovernanceInstruction["FinalizeVote"] = 14] = "FinalizeVote";
    GovernanceInstruction[GovernanceInstruction["RelinquishVote"] = 15] = "RelinquishVote";
    GovernanceInstruction[GovernanceInstruction["ExecuteInstruction"] = 16] = "ExecuteInstruction";
    GovernanceInstruction[GovernanceInstruction["CreateMintGovernance"] = 17] = "CreateMintGovernance";
    GovernanceInstruction[GovernanceInstruction["CreateTokenGovernance"] = 18] = "CreateTokenGovernance";
    GovernanceInstruction[GovernanceInstruction["SetGovernanceConfig"] = 19] = "SetGovernanceConfig";
    GovernanceInstruction[GovernanceInstruction["FlagInstructionError"] = 20] = "FlagInstructionError";
    GovernanceInstruction[GovernanceInstruction["SetRealmAuthority"] = 21] = "SetRealmAuthority";
    GovernanceInstruction[GovernanceInstruction["SetRealmConfig"] = 22] = "SetRealmConfig";
})(GovernanceInstruction = exports.GovernanceInstruction || (exports.GovernanceInstruction = {}));
class CreateRealmArgs {
    constructor(args) {
        this.instruction = GovernanceInstruction.CreateRealm;
        this.name = args.name;
        this.configArgs = args.configArgs;
    }
}
exports.CreateRealmArgs = CreateRealmArgs;
class DepositGoverningTokensArgs {
    constructor(args) {
        this.instruction = GovernanceInstruction.DepositGoverningTokens;
        this.amount = args.amount;
    }
}
exports.DepositGoverningTokensArgs = DepositGoverningTokensArgs;
class WithdrawGoverningTokensArgs {
    constructor() {
        this.instruction = GovernanceInstruction.WithdrawGoverningTokens;
    }
}
exports.WithdrawGoverningTokensArgs = WithdrawGoverningTokensArgs;
class CreateAccountGovernanceArgs {
    constructor(args) {
        this.instruction = GovernanceInstruction.CreateAccountGovernance;
        this.config = args.config;
    }
}
exports.CreateAccountGovernanceArgs = CreateAccountGovernanceArgs;
class CreateProgramGovernanceArgs {
    constructor(args) {
        this.instruction = GovernanceInstruction.CreateProgramGovernance;
        this.config = args.config;
        this.transferUpgradeAuthority = !!args.transferUpgradeAuthority;
    }
}
exports.CreateProgramGovernanceArgs = CreateProgramGovernanceArgs;
class CreateMintGovernanceArgs {
    constructor(args) {
        this.instruction = GovernanceInstruction.CreateMintGovernance;
        this.config = args.config;
        this.transferMintAuthority = !!args.transferMintAuthority;
    }
}
exports.CreateMintGovernanceArgs = CreateMintGovernanceArgs;
class CreateTokenGovernanceArgs {
    constructor(args) {
        this.instruction = GovernanceInstruction.CreateTokenGovernance;
        this.config = args.config;
        this.transferTokenOwner = !!args.transferTokenOwner;
    }
}
exports.CreateTokenGovernanceArgs = CreateTokenGovernanceArgs;
class SetGovernanceConfigArgs {
    constructor(args) {
        this.instruction = GovernanceInstruction.SetGovernanceConfig;
        this.config = args.config;
    }
}
exports.SetGovernanceConfigArgs = SetGovernanceConfigArgs;
class CreateProposalArgs {
    // --------------------------------
    constructor(args) {
        this.instruction = GovernanceInstruction.CreateProposal;
        this.name = args.name;
        this.descriptionLink = args.descriptionLink;
        this.governingTokenMint = args.governingTokenMint;
        this.voteType = args.voteType;
        this.options = args.options;
        this.useDenyOption = args.useDenyOption;
    }
}
exports.CreateProposalArgs = CreateProposalArgs;
class AddSignatoryArgs {
    constructor(args) {
        this.instruction = GovernanceInstruction.AddSignatory;
        this.signatory = args.signatory;
    }
}
exports.AddSignatoryArgs = AddSignatoryArgs;
class SignOffProposalArgs {
    constructor() {
        this.instruction = GovernanceInstruction.SignOffProposal;
    }
}
exports.SignOffProposalArgs = SignOffProposalArgs;
class CancelProposalArgs {
    constructor() {
        this.instruction = GovernanceInstruction.CancelProposal;
    }
}
exports.CancelProposalArgs = CancelProposalArgs;
var YesNoVote;
(function (YesNoVote) {
    YesNoVote[YesNoVote["Yes"] = 0] = "Yes";
    YesNoVote[YesNoVote["No"] = 1] = "No";
})(YesNoVote = exports.YesNoVote || (exports.YesNoVote = {}));
class VoteChoice {
    constructor(args) {
        this.rank = args.rank;
        this.weightPercentage = args.weightPercentage;
    }
}
exports.VoteChoice = VoteChoice;
var VoteKind;
(function (VoteKind) {
    VoteKind[VoteKind["Approve"] = 0] = "Approve";
    VoteKind[VoteKind["Deny"] = 1] = "Deny";
})(VoteKind = exports.VoteKind || (exports.VoteKind = {}));
class Vote {
    constructor(args) {
        this.voteType = args.voteType;
        this.approveChoices = args.approveChoices;
        this.deny = args.deny;
    }
    toYesNoVote() {
        switch (this.voteType) {
            case VoteKind.Deny: {
                return YesNoVote.No;
            }
            case VoteKind.Approve: {
                return YesNoVote.Yes;
            }
        }
    }
    static fromYesNoVote(yesNoVote) {
        switch (yesNoVote) {
            case YesNoVote.Yes: {
                return new Vote({
                    voteType: VoteKind.Approve,
                    approveChoices: [new VoteChoice({ rank: 0, weightPercentage: 100 })],
                    deny: undefined,
                });
            }
            case YesNoVote.No: {
                return new Vote({
                    voteType: VoteKind.Deny,
                    approveChoices: undefined,
                    deny: true,
                });
            }
        }
    }
}
exports.Vote = Vote;
class CastVoteArgs {
    constructor(args) {
        this.instruction = GovernanceInstruction.CastVote;
        this.yesNoVote = args.yesNoVote;
        this.vote = args.vote;
    }
}
exports.CastVoteArgs = CastVoteArgs;
class RelinquishVoteArgs {
    constructor() {
        this.instruction = GovernanceInstruction.RelinquishVote;
    }
}
exports.RelinquishVoteArgs = RelinquishVoteArgs;
class FinalizeVoteArgs {
    constructor() {
        this.instruction = GovernanceInstruction.FinalizeVote;
    }
}
exports.FinalizeVoteArgs = FinalizeVoteArgs;
class InsertInstructionArgs {
    constructor(args) {
        this.instruction = GovernanceInstruction.InsertInstruction;
        this.index = args.index;
        this.optionIndex = args.optionIndex;
        this.holdUpTime = args.holdUpTime;
        this.instructionData = args.instructionData;
    }
}
exports.InsertInstructionArgs = InsertInstructionArgs;
class RemoveInstructionArgs {
    constructor() {
        this.instruction = GovernanceInstruction.RemoveInstruction;
    }
}
exports.RemoveInstructionArgs = RemoveInstructionArgs;
class ExecuteInstructionArgs {
    constructor() {
        this.instruction = GovernanceInstruction.ExecuteInstruction;
    }
}
exports.ExecuteInstructionArgs = ExecuteInstructionArgs;
class FlagInstructionErrorArgs {
    constructor() {
        this.instruction = GovernanceInstruction.FlagInstructionError;
    }
}
exports.FlagInstructionErrorArgs = FlagInstructionErrorArgs;
class SetRealmAuthorityArgs {
    constructor(args) {
        this.instruction = GovernanceInstruction.SetRealmAuthority;
        this.newRealmAuthority = args.newRealmAuthority;
    }
}
exports.SetRealmAuthorityArgs = SetRealmAuthorityArgs;
class SetRealmConfigArgs {
    constructor(args) {
        this.instruction = GovernanceInstruction.SetRealmConfig;
        this.configArgs = args.configArgs;
    }
}
exports.SetRealmConfigArgs = SetRealmConfigArgs;
//# sourceMappingURL=instructions.js.map