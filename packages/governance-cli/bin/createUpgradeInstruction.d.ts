import { PublicKey, TransactionInstruction } from '@solana/web3.js';
export declare let BPF_UPGRADE_LOADER_ID: PublicKey;
export declare function createUpgradeInstruction(programId: PublicKey, bufferAddress: PublicKey, upgradeAuthority: PublicKey, spillAddress: PublicKey): Promise<TransactionInstruction>;
//# sourceMappingURL=createUpgradeInstruction.d.ts.map