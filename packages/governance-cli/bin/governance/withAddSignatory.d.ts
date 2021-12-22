import { PublicKey, TransactionInstruction } from '@solana/web3.js';
export declare const withAddSignatory: (instructions: TransactionInstruction[], programId: PublicKey, proposal: PublicKey, tokenOwnerRecord: PublicKey, governanceAuthority: PublicKey, signatory: PublicKey, payer: PublicKey) => Promise<void>;
//# sourceMappingURL=withAddSignatory.d.ts.map