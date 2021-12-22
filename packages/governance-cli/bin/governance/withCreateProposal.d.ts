import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { VoteType } from './accounts';
export declare const withCreateProposal: (instructions: TransactionInstruction[], programId: PublicKey, programVersion: number, realm: PublicKey, governance: PublicKey, tokenOwnerRecord: PublicKey, name: string, descriptionLink: string, governingTokenMint: PublicKey, governanceAuthority: PublicKey, proposalIndex: number, voteType: VoteType, options: string[], useDenyOption: boolean, payer: PublicKey) => Promise<PublicKey>;
//# sourceMappingURL=withCreateProposal.d.ts.map