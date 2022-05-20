/// <reference types="node" />
import * as anchor from "@project-serum/anchor";
import { Program, Provider } from "@project-serum/anchor";
import { Commitment, PublicKey } from "@solana/web3.js";
import { AnchorSdk, InstructionResult, TypedAccountParser } from "@strata-foundation/spl-utils";
import BN from "bn.js";
import { FungibleEntanglerIDL, FungibleParentEntanglerV0, FungibleChildEntanglerV0 } from "./generated/fungible-entangler";
export * from "./generated/fungible-entangler";
/**
 * Unified fungible entangler interface wrapping the raw FungibleEntanglerV0
 */
export interface IFungibleParentEntangler extends FungibleParentEntanglerV0 {
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
    /** The source for the amount (**Default:** ata of provider wallet) */
    source?: PublicKey;
    /**  The mint we will be creating an entangler for */
    mint: PublicKey;
    /** dynamicSeed used for created PDA of entangler */
    dynamicSeed: Buffer;
    /** The amount of the mint we will be entangling */
    amount: BN | number;
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
    /** The date this entangler will shut down. After this date, {@link FungibleEntangler.swap} is disabled. **Default:** null */
    freezeSwapDate?: Date;
}
export interface ICreateFungibleChildEntanglerOutput {
    entangler: PublicKey;
    storage: PublicKey;
    mint: PublicKey;
}
export interface ICreateFungibleEntanglerArgs {
    payer?: PublicKey;
    /** The source for the set supply (**Default:** ata of provider wallet) */
    source?: PublicKey;
    /** dynamicSeed used for created PDA of parentEntangler */
    dynamicSeed: Buffer;
    /** The amount of the mint we will be entangling */
    amount: number;
    /** The mint we will be creating a parentEntangler for */
    parentMint: PublicKey;
    /** The mint we will be creating a parentEntangler for */
    childMint: PublicKey;
    /**
     * General authority to change things like freeze swap.
     * **Default:** Wallet public key. Pass null to explicitly not set this authority.
     */
    authority?: PublicKey | null;
    /** The date this entangler will go live. Before this date, {@link FungibleEntangler.swap} is disabled. **Default:** 1 second ago */
    parentGoLiveDate?: Date;
    /** The date this entangler will shut down. After this date, {@link FungibleEntangler.swap} is disabled. **Default:** null */
    parentFreezeSwapDate?: Date;
    /** The date this entangler will go live. Before this date, {@link FungibleEntangler.swap} is disabled. **Default:** 1 second ago */
    childGoLiveDate?: Date;
    /** The date this entangler will shut down. After this date, {@link FungibleEntangler.swap} is disabled. **Default:** null */
    childFreezeSwapDate?: Date;
}
export interface ICreateFungibleEntanglerOutput {
    parentEntangler: PublicKey;
    parentStorage: PublicKey;
    parentMint: PublicKey;
    childEntangler: PublicKey;
    childStorage: PublicKey;
    childMint: PublicKey;
}
interface ISwapArgs {
    parentEntangler: PublicKey;
    childEntangler: PublicKey;
    payer?: PublicKey;
    /** The source for the swap (**Default:** ata of provider wallet) */
    source?: PublicKey;
    /** The wallet funding the swap. (**Default:** Provider wallet) */
    sourceAuthority?: PublicKey;
    /** The source destination to purchase to. (**Default:** ata of `sourceAuthority`) */
    destination?: PublicKey;
}
interface ISwapArgsAll extends ISwapArgs {
    all: boolean;
}
interface ISwapArgsAmount extends ISwapArgs {
    amount: BN | number;
}
declare type SwapArgs = ISwapArgsAmount | ISwapArgsAll;
export declare type ISwapParentArgs = SwapArgs & {};
export declare type ISwapChildArgs = SwapArgs & {};
interface ITopOffArgs {
    payer?: PublicKey;
    /** The source for the swap (**Default:** ata of provider wallet) */
    source?: PublicKey;
    /** The wallet funding the swap. (**Default:** Provider wallet) */
    sourceAuthority?: PublicKey;
    amount: BN | number;
}
interface ITopOffArgsParent extends ITopOffArgs {
    parentEntangler: PublicKey;
}
interface ITopOffArgsChild extends ITopOffArgs {
    childEntangler: PublicKey;
}
declare type TopOffArgs = ITopOffArgsParent | ITopOffArgsChild;
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
     * Get the PDA key of a Parent Entangler given the mint and dynamicSeed
     *
     *
     * @param mint
     * @param dynamicSeed
     * @returns
     */
    static fungibleParentEntanglerKey(mint: PublicKey, dynamicSeed: Buffer, programId?: PublicKey): Promise<[PublicKey, number]>;
    /**
     * Get the PDA key of a Child Entangler given the mint and parentEntangler
     *
     *
     * @param mint
     * @param parentEntangler
     * @returns
     */
    static fungibleChildEntanglerKey(parentEntangler: PublicKey, mint: PublicKey, programId?: PublicKey): Promise<[PublicKey, number]>;
    /**
     * Get the PDA key of a Entangler storage given the entangler
     *
     *
     * @param entangler
     * @returns
     */
    static storageKey(entangler: PublicKey, programId?: PublicKey): Promise<[PublicKey, number]>;
    parentEntanglerDecoder: TypedAccountParser<IFungibleParentEntangler>;
    getParentEntangler(entanglerKey: PublicKey): Promise<IFungibleParentEntangler | null>;
    childEntanglerDecoder: TypedAccountParser<IFungibleChildEntangler>;
    getChildEntangler(entanglerKey: PublicKey): Promise<IFungibleChildEntangler | null>;
    createFungibleParentEntanglerInstructions({ authority, payer, source, mint, dynamicSeed, amount, goLiveDate, // 10 secs ago
    freezeSwapDate, }: ICreateFungibleParentEntanglerArgs): Promise<InstructionResult<ICreateFungibleParentEntanglerOutput>>;
    createFungibleParentEntangler(args: ICreateFungibleParentEntanglerArgs, commitment?: Commitment): Promise<ICreateFungibleParentEntanglerOutput>;
    createFungibleChildEntanglerInstructions({ authority, payer, parentEntangler, mint, goLiveDate, // 10 secs ago
    freezeSwapDate, }: ICreateFungibleChildEntanglerArgs): Promise<InstructionResult<ICreateFungibleChildEntanglerOutput>>;
    createFungibleChildEntangler(args: ICreateFungibleChildEntanglerArgs, commitment?: Commitment): Promise<ICreateFungibleChildEntanglerOutput>;
    createFungibleEntanglerInstructions({ authority, payer, source, dynamicSeed, amount, parentMint, childMint, parentGoLiveDate, // 10 secs ago
    parentFreezeSwapDate, childGoLiveDate, // 10 secs ago
    childFreezeSwapDate, }: ICreateFungibleEntanglerArgs): Promise<InstructionResult<ICreateFungibleEntanglerOutput>>;
    createFungibleEntangler(args: ICreateFungibleEntanglerArgs, commitment?: Commitment): Promise<ICreateFungibleEntanglerOutput>;
    swapParentInstructions({ payer, source, sourceAuthority, parentEntangler, childEntangler, destination, ...rest }: ISwapParentArgs): Promise<InstructionResult<null>>;
    swapParent(args: ISwapParentArgs, commitment?: Commitment): Promise<void>;
    swapChildInstructions({ payer, source, sourceAuthority, parentEntangler, childEntangler, destination, ...rest }: ISwapChildArgs): Promise<InstructionResult<null>>;
    swapChild(args: ISwapChildArgs, commitment?: Commitment): Promise<void>;
    topOffInstructions({ payer, source, sourceAuthority, amount, ...rest }: TopOffArgs): Promise<InstructionResult<null>>;
    topOff(args: TopOffArgs, commitment?: Commitment): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map