/// <reference types="node" />
import * as anchor from "@project-serum/anchor";
import { Program, Provider } from "@project-serum/anchor";
import { Commitment, PublicKey } from "@solana/web3.js";
import { AnchorSdk, InstructionResult, TypedAccountParser } from "@strata-foundation/spl-utils";
import { FungibleEntanglerIDL, FungibleEntanglerV0, FungibleChildEntanglerV0 } from "./generated/fungible-entangler";
export * from "./generated/fungible-entangler";
/**
 * Unified fungible entangler interface wrapping the raw FungibleEntanglerV0
 */
export interface IFungibleEntangler extends FungibleEntanglerV0 {
    publicKey: PublicKey;
}
/**
 * Unified fungible child entangler interface wrapping the raw FungibleChildEntanglerV0*
 */
export interface IFungibleChildEntangler extends FungibleChildEntanglerV0 {
    publicKey: PublicKey;
}
interface ICreateFungibleParentEntanglerArgs {
    payer?: PublicKey;
    /** The source for the set supply (**Default:** ata of provider wallet) */
    source?: PublicKey;
    /**  The mint we will be creating an entangler for */
    mint: PublicKey;
    /** dynamicSeed used for created PDA of entangler */
    dynamicSeed: Buffer;
    /** The amount of the mint we will be entangling */
    amount: number;
    /**
     * General authority to change things like freeze swap.
     * **Default:** Wallet public key. Pass null to explicitly not set this authority.
     */
    authority?: PublicKey | null;
    /** The date this entangler will go live. Before this date, {@link FungibleEntangler.swap} is disabled. **Default:** 1 second ago */
    goLiveDate?: Date;
    /** The date this entangler will shut down. After this date, {@link FungibleEntangler.swap} is disabled. **Default:** null */
    freezeSwapDate?: Date;
}
export interface ICreateFungibleParentEntanglerOutput {
    entangler: PublicKey;
    storage: PublicKey;
    mint: PublicKey;
}
interface ICreateFungibleChildEntanglerArgs {
    payer?: PublicKey;
    /** The parent entangler this child will be associated to */
    parentEntangler: PublicKey;
    /** The mint we will be creating an entangler for */
    mint: PublicKey;
    /**
     * General authority to change things like freeze swap.
     * **Default:** Wallet public key. Pass null to explicitly not set this authority.
     */
    authority?: PublicKey | null;
    /** The date this entangler will go live. Before this date, {@link FungibleEntangler.swap} is disabled. **Default:** 1 second ago */
    goLiveDate?: Date;
}
export interface ICreateFungibleChildEntanglerOutput {
    entangler: PublicKey;
    storage: PublicKey;
    mint: PublicKey;
}
export declare class FungibleEntangler extends AnchorSdk<any> {
    static ID: anchor.web3.PublicKey;
    static init(provider: Provider, fungibleEntanglerProgramId?: PublicKey): Promise<FungibleEntangler>;
    constructor(provider: Provider, program: Program<FungibleEntanglerIDL>);
    /**
     * General utility function to check if an account exists
     * @param account
     * @returns
     */
    accountExists(account: anchor.web3.PublicKey): Promise<boolean>;
    /**
     * Get the PDA key of a Entangler given the mint and dynamicSeed
     *
     *
     * @param mint
     * @param dynamicSeed
     * @returns
     */
    static fungibleEntanglerKey(mint: PublicKey, dynamicSeed: Buffer, programId?: PublicKey): Promise<[PublicKey, number]>;
    entanglerDecoder: TypedAccountParser<IFungibleEntangler>;
    getEntangler(entanglerKey: PublicKey): Promise<IFungibleEntangler | null>;
    createFungibleParentEntanglerInstructions({ authority, payer, source, mint, dynamicSeed, amount, goLiveDate, // 10 secs ago
    freezeSwapDate, }: ICreateFungibleParentEntanglerArgs): Promise<InstructionResult<ICreateFungibleParentEntanglerOutput>>;
    createFungibleParentEntangler(args: ICreateFungibleParentEntanglerArgs, commitment?: Commitment): Promise<ICreateFungibleParentEntanglerOutput>;
    createFungibleChildEntanglerInstructions({}: ICreateFungibleChildEntanglerArgs): Promise<InstructionResult<{}>>;
}
//# sourceMappingURL=index.d.ts.map