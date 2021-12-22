import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { InstructionData } from './accounts';
export declare const withInsertInstruction: (instructions: TransactionInstruction[], programId: PublicKey, programVersion: number, governance: PublicKey, proposal: PublicKey, tokenOwnerRecord: PublicKey, governanceAuthority: PublicKey, index: number, holdUpTime: number, instructionData: InstructionData, payer: PublicKey) => Promise<PublicKey>;
//# sourceMappingURL=withInsertInstruction.d.ts.map