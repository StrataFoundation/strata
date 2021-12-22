/// <reference types="node" />
import { TransactionInstruction } from '@solana/web3.js';
import { InstructionData, GovernanceAccountClass, GovernanceAccountType } from './accounts';
export declare const PROGRAM_VERSION_V1 = 1;
export declare const PROGRAM_VERSION_V2 = 2;
export declare const serializeInstructionToBase64: (instruction: TransactionInstruction) => string;
export declare const GOVERNANCE_SCHEMA_V1: Map<Function, any>;
export declare const GOVERNANCE_SCHEMA: Map<Function, any>;
export declare function getGovernanceSchema(programVersion: number): Map<Function, any>;
export declare function getGovernanceSchemaForAccount(accountType: GovernanceAccountType): Map<Function, any>;
export declare const GovernanceAccountParser: (classType: GovernanceAccountClass) => (pubKey: import("@solana/web3.js").PublicKey, info: import("@solana/web3.js").AccountInfo<Buffer>) => import("./core/serialisation").ParsedAccountBase;
export declare function getInstructionDataFromBase64(instructionDataBase64: string): InstructionData;
//# sourceMappingURL=serialisation.d.ts.map