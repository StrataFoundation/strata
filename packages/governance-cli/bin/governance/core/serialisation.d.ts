/// <reference types="node" />
import { AccountInfo, PublicKey } from '@solana/web3.js';
import { Schema } from 'borsh';
export interface ParsedAccountBase {
    pubkey: PublicKey;
    account: AccountInfo<Buffer>;
    info: any;
}
export declare function BorshAccountParser(classType: any, getSchema: (accountType: number) => Schema): (pubKey: PublicKey, info: AccountInfo<Buffer>) => ParsedAccountBase;
//# sourceMappingURL=serialisation.d.ts.map