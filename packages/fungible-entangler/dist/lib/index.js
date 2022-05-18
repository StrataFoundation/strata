"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FungibleEntangler = void 0;
const anchor = __importStar(require("@project-serum/anchor"));
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const spl_utils_1 = require("@strata-foundation/spl-utils");
const bn_js_1 = __importDefault(require("bn.js"));
__exportStar(require("./generated/fungible-entangler"), exports);
const truthy = (value) => !!value;
class FungibleEntangler extends spl_utils_1.AnchorSdk {
    constructor(provider, program) {
        super({ provider, program });
        this.entanglerDecoder = (pubkey, account) => {
            const coded = this.program.coder.accounts.decode("FungibleEntanglerV0", account.data);
            return Object.assign(Object.assign({}, coded), { publicKey: pubkey });
        };
    }
    static init(provider, fungibleEntanglerProgramId = FungibleEntangler.ID) {
        return __awaiter(this, void 0, void 0, function* () {
            const FungibleEntanglerIDLJson = yield anchor.Program.fetchIdl(fungibleEntanglerProgramId, provider);
            const fungibleEntangler = new anchor.Program(FungibleEntanglerIDLJson, fungibleEntanglerProgramId, provider);
            return new this(provider, fungibleEntangler);
        });
    }
    /**
     * General utility function to check if an account exists
     * @param account
     * @returns
     */
    accountExists(account) {
        return __awaiter(this, void 0, void 0, function* () {
            return Boolean(yield this.provider.connection.getAccountInfo(account));
        });
    }
    /**
     * Get the PDA key of a Entangler given the mint and dynamicSeed
     *
     *
     * @param mint
     * @param dynamicSeed
     * @returns
     */
    static fungibleEntanglerKey(mint, dynamicSeed, programId = FungibleEntangler.ID) {
        return __awaiter(this, void 0, void 0, function* () {
            return web3_js_1.PublicKey.findProgramAddress([Buffer.from("entangler", "utf-8"), mint.toBuffer(), dynamicSeed], programId);
        });
    }
    getEntangler(entanglerKey) {
        return this.getAccount(entanglerKey, this.entanglerDecoder);
    }
    createFungibleParentEntanglerInstructions({ authority = this.provider.wallet.publicKey, payer = this.provider.wallet.publicKey, source = this.provider.wallet.publicKey, mint, dynamicSeed, amount, goLiveDate = new Date(new Date().valueOf() - 10000), // 10 secs ago
    freezeSwapDate, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const provider = this.provider;
            const instructions = [];
            const signers = [];
            const mintAcct = yield (0, spl_utils_1.getMintInfo)(this.provider, mint);
            const sourceAcct = yield this.provider.connection.getAccountInfo(source);
            // Source is a wallet, need to get the ATA
            if (!sourceAcct || sourceAcct.owner.equals(web3_js_1.SystemProgram.programId)) {
                const ataSource = yield spl_token_1.Token.getAssociatedTokenAddress(spl_token_1.ASSOCIATED_TOKEN_PROGRAM_ID, spl_token_1.TOKEN_PROGRAM_ID, mint, payer, true);
                if (!(yield this.accountExists(ataSource))) {
                    throw new Error(`Owner of ${payer === null || payer === void 0 ? void 0 : payer.toBase58()} does not hold any ${mint.toBase58()} tokens`);
                }
                source = ataSource;
            }
            const sourceAcctAta = yield (0, spl_utils_1.getTokenAccount)(this.provider, source);
            const [entangler, bumpSeed] = yield FungibleEntangler.fungibleEntanglerKey(mint, dynamicSeed);
            const storageKeypair = anchor.web3.Keypair.generate();
            signers.push(storageKeypair);
            const storage = storageKeypair.publicKey;
            console.log(amount);
            console.log(sourceAcctAta.amount.toNumber());
            instructions.push(web3_js_1.SystemProgram.createAccount({
                fromPubkey: payer,
                newAccountPubkey: storage,
                space: spl_token_1.AccountLayout.span,
                programId: spl_token_1.TOKEN_PROGRAM_ID,
                lamports: yield provider.connection.getMinimumBalanceForRentExemption(spl_token_1.AccountLayout.span),
            }), spl_token_1.Token.createInitAccountInstruction(spl_token_1.TOKEN_PROGRAM_ID, mint, storage, entangler), spl_token_1.Token.createTransferInstruction(spl_token_1.TOKEN_PROGRAM_ID, source, storage, sourceAcctAta.owner, [], new spl_token_1.u64((amount * Math.pow(10, mintAcct.decimals)).toLocaleString("fullwide", {
                useGrouping: false,
            }))), yield this.instruction.initializeFungibleEntanglerV0({
                authority,
                entanglerSeed: dynamicSeed,
                goLiveUnixTime: new bn_js_1.default(Math.floor(goLiveDate.valueOf() / 1000)),
                freezeSwapUnixTime: freezeSwapDate
                    ? new bn_js_1.default(Math.floor(freezeSwapDate.valueOf() / 1000))
                    : null,
            }, {
                accounts: {
                    payer,
                    entangler,
                    storage,
                    mint,
                    tokenProgram: spl_token_1.TOKEN_PROGRAM_ID,
                    systemProgram: web3_js_1.SystemProgram.programId,
                    rent: web3_js_1.SYSVAR_RENT_PUBKEY,
                    clock: web3_js_1.SYSVAR_CLOCK_PUBKEY,
                },
            }));
            return {
                instructions,
                signers,
                output: {
                    entangler,
                    storage,
                    mint,
                },
            };
        });
    }
    createFungibleParentEntangler(args, commitment = "confirmed") {
        return __awaiter(this, void 0, void 0, function* () {
            return this.execute(this.createFungibleParentEntanglerInstructions(args), args.payer, commitment);
        });
    }
    createFungibleChildEntanglerInstructions({}) {
        return __awaiter(this, void 0, void 0, function* () {
            const publicKey = this.provider.wallet.publicKey;
            const instructions = [];
            // TODO: implement
            return { instructions, signers: [], output: {} };
        });
    }
}
exports.FungibleEntangler = FungibleEntangler;
FungibleEntangler.ID = new web3_js_1.PublicKey("Ae6wbxtjpoKGCuSdHGQXRudmdpSfGpu6KHtjDcWEDjP8");
//# sourceMappingURL=index.js.map