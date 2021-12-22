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
exports.createUpgradeInstruction = exports.BPF_UPGRADE_LOADER_ID = void 0;
const web3_js_1 = require("@solana/web3.js");
exports.BPF_UPGRADE_LOADER_ID = new web3_js_1.PublicKey('BPFLoaderUpgradeab1e11111111111111111111111');
function createUpgradeInstruction(programId, bufferAddress, upgradeAuthority, spillAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        const bpfUpgradableLoaderId = exports.BPF_UPGRADE_LOADER_ID;
        const [programDataAddress] = yield web3_js_1.PublicKey.findProgramAddress([programId.toBuffer()], bpfUpgradableLoaderId);
        const keys = [
            {
                pubkey: programDataAddress,
                isWritable: true,
                isSigner: false,
            },
            {
                pubkey: programId,
                isWritable: true,
                isSigner: false,
            },
            {
                pubkey: bufferAddress,
                isWritable: true,
                isSigner: false,
            },
            {
                pubkey: spillAddress,
                isWritable: true,
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
            {
                pubkey: upgradeAuthority,
                isWritable: false,
                isSigner: true,
            },
        ];
        return new web3_js_1.TransactionInstruction({
            keys,
            programId: bpfUpgradableLoaderId,
            data: Buffer.from([3, 0, 0, 0]), // Upgrade instruction bincode
        });
    });
}
exports.createUpgradeInstruction = createUpgradeInstruction;
//# sourceMappingURL=createUpgradeInstruction.js.map