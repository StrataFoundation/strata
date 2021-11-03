import * as anchor from "@project-serum/anchor";
import BN from "bn.js";
import { IdlTypes, Program, Provider } from "@project-serum/anchor";
import { createMetadata, Data, SplTokenMetadata, decodeMetadata, METADATA_PROGRAM_ID, extendBorsh, InstructionResult, BigInstructionResult, sendInstructions, sendMultipleInstructions, ICreateArweaveUrlArgs, updateMetadata, percent } from "@strata-foundation/spl-utils";
import { createMintInstructions } from "@project-serum/common";
import { ASSOCIATED_TOKEN_PROGRAM_ID, MintLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import { SplTokenCollectiveIDL, } from "./generated/spl-token-collective";
import { SplTokenBonding, CreateTokenBondingArgs } from "@strata-foundation/spl-token-bonding";

export * from "./generated/spl-token-collective";

extendBorsh();

export interface CreateCollectiveArgs {
  payer?: PublicKey;
  // Optional token metadata, if provided will create token metadata for this collective
  metadata?: ICreateArweaveUrlArgs & {
    uploadUrl?: string
  }, // Optional, will add token metadata to the mint before creating
  bonding?: CreateTokenBondingArgs, // Optional, needed if `mint` not provided to create a bonding curve
  mint?: PublicKey; // If not provided, will create a bonding curve around the `bonding` params
  mintAuthority?: PublicKey; // If not provided, will attempt to fetch it from mint. Must be a signer on the txn
  authority?: PublicKey;
  config: ICollectiveConfig,
}

// Taken from token bonding initialize
export interface TokenBondingParams {
  buyBaseRoyaltyPercentage: number;
  buyTargetRoyaltyPercentage: number;
  sellBaseRoyaltyPercentage: number;
  sellTargetRoyaltyPercentage: number;

  targetMintDecimals?: number; // Defaults to 9, or uses ffrom config
  buyBaseRoyalties?: PublicKey; // If not provided, create an Associated Token Account with baseRoyaltiesOwner
  buyBaseRoyaltiesOwner?: PublicKey; // If base royalties not provided, will create it with this owner. Otherwise, will use wallet.publicKey
  buyTargetRoyalties?: PublicKey; // If not provided, create an Associated Token Account with targetRoyaltiesOwner
  buyTargetRoyaltiesOwner?: PublicKey; // If target royalties not provided, will create it with this owner. Otherwise, will use wallet.publicKey
  sellBaseRoyalties?: PublicKey; // If not provided, create an Associated Token Account with baseRoyaltiesOwner
  sellBaseRoyaltiesOwner?: PublicKey; // If base royalties not provided, will create it with this owner. Otherwise, will use wallet.publicKey
  sellTargetRoyalties?: PublicKey; // If not provided, create an Associated Token Account with targetRoyaltiesOwner
  sellTargetRoyaltiesOwner?: PublicKey; // If target royalties not provided, will create it with this owner. Otherwise, will use wallet.publicKey
}

export interface CreateSocialTokenArgs {
  isPrimary?: boolean; // Is this the primary social token for this wallet? Defaults to true
  ignoreIfExists?: boolean; // If this social token already exists, don't throw an error
  payer?: PublicKey;
  collective?: PublicKey; // Defaults to open collective
  name?: PublicKey; // Either these or owner needs to be provided
  nameClass?: PublicKey; // Either these or owner needs to be provided
  nameParent?: PublicKey; // Either these or owner needs to be provided
  tokenName: string; // For the token metadata name
  symbol?: string; // Symbol for the token
  owner?: PublicKey; // If name is no provided, defaults to provider's wallet
  curve?: PublicKey; // The curve to create this social token on. If not provided, will use the collective's curve
  // Taken from token bonding initialize
  tokenBondingParams: TokenBondingParams
}

export interface ClaimSocialTokenArgs {
  isPrimary?: boolean; // Is this the primary social token for this wallet?
  payer?: PublicKey;
  owner: PublicKey;
  tokenRef: PublicKey;
  symbol?: string;
  buyBaseRoyalties?: PublicKey; // Defaults to ATA fo the owner
  buyTargetRoyalties?: PublicKey; // Defaults to ATA fo the owner
  sellBaseRoyalties?: PublicKey; // Defaults to ATA fo the owner
  sellTargetRoyalties?: PublicKey; // Defaults to ATA fo the owner
  ignoreMissingName?: boolean; // Ignore missing name account, useful if you're creating the name in the same txn
}

export interface IRoyaltySetting {
  ownedByName?: boolean,
  address?: number
}

export interface ITokenBondingSettings {
  curve?: PublicKey;
  minSellBaseRoyaltyPercentage?: number,
  minSellTargetRoyaltyPercentage?: number,
  maxSellBaseRoyaltyPercentage?: number,
  maxSellTargetRoyaltyPercentage?: number,
  minBuyBaseRoyaltyPercentage?: number,
  minBuyTargetRoyaltyPercentage?: number,
  maxBuyBaseRoyaltyPercentage?: number,
  maxBuyTargetRoyaltyPercentage?: number,
  targetMintDecimals?: number,
  buyBaseRoyalties?: IRoyaltySetting,
  sellBaseRoyalties?: IRoyaltySetting,
  buyTargetRoyalties?: IRoyaltySetting,
  sellTargetRoyalties?: IRoyaltySetting,
  minPurchaseCap?: number,
  maxPurchaseCap?: number,
  minMintCap?: number,
  maxMintCap?: number,
}

export interface ITokenMetadataSettings {
  symbol?: string;
  uri?: string;
  nameIsNameServiceName?: boolean;
}

export interface ICollectiveConfig {
  isOpen: boolean;
  unclaimedTokenBondingSettings?: ITokenBondingSettings;
  claimedTokenBondingSettings?: ITokenBondingSettings;
  unclaimedTokenMetadataSettings?: ITokenMetadataSettings;
}

type CollectiveConfigV0 = IdlTypes<SplTokenCollectiveIDL>["CollectiveConfigV0"];
type TokenBondingSettingsV0 = IdlTypes<SplTokenCollectiveIDL>["TokenBondingSettingsV0"];
type RoyaltySettingV0 = IdlTypes<SplTokenCollectiveIDL>["RoyaltySettingV0"];
type TokenMetadataSettingsV0 = IdlTypes<SplTokenCollectiveIDL>["TokenMetadataSettingsV0"];
function undefinedToNull(obj: any | undefined): any | null {
  if (typeof obj === "undefined") {
    return null;
  }

  return obj;
}

function toIdlTokenMetdataSettings(settings: ITokenMetadataSettings | undefined): TokenMetadataSettingsV0 {
  return {
    symbol: undefinedToNull(settings?.symbol),
    uri: undefinedToNull(settings?.uri),
    nameIsNameServiceName: !!settings?.nameIsNameServiceName
  };
}

function toIdlRoyaltySettings(settings: IRoyaltySetting | undefined): RoyaltySettingV0 {
  return {
    ownedByName: !!settings?.ownedByName,
    address: undefinedToNull(settings?.address)
  }
}

function toIdlTokenBondingSettings(settings: ITokenBondingSettings | undefined): TokenBondingSettingsV0 {
  return {
    curve: undefinedToNull(settings?.curve),
    minSellBaseRoyaltyPercentage: undefinedToNull(percent(settings?.minSellBaseRoyaltyPercentage)),
    minSellTargetRoyaltyPercentage: undefinedToNull(percent(settings?.minSellTargetRoyaltyPercentage)),
    maxSellBaseRoyaltyPercentage: undefinedToNull(percent(settings?.maxSellBaseRoyaltyPercentage)),
    maxSellTargetRoyaltyPercentage: undefinedToNull(percent(settings?.maxSellTargetRoyaltyPercentage)),
    minBuyBaseRoyaltyPercentage: undefinedToNull(percent(settings?.minBuyBaseRoyaltyPercentage)),
    minBuyTargetRoyaltyPercentage: undefinedToNull(percent(settings?.minBuyTargetRoyaltyPercentage)),
    maxBuyBaseRoyaltyPercentage: undefinedToNull(percent(settings?.maxBuyBaseRoyaltyPercentage)),
    maxBuyTargetRoyaltyPercentage: undefinedToNull(percent(settings?.maxBuyTargetRoyaltyPercentage)),
    targetMintDecimals: undefinedToNull(settings?.targetMintDecimals),
    // @ts-ignore
    buyBaseRoyalties: toIdlRoyaltySettings(settings?.buyBaseRoyalties),
    // @ts-ignore
    sellBaseRoyalties: toIdlRoyaltySettings(settings?.sellBaseRoyalties),
    // @ts-ignore
    buyTargetRoyalties: toIdlRoyaltySettings(settings?.buyTargetRoyalties),
    // @ts-ignore
    sellTargetRoyalties: toIdlRoyaltySettings(settings?.sellTargetRoyalties),
    minPurchaseCap: undefinedToNull(settings?.minPurchaseCap),
    maxPurchaseCap: undefinedToNull(settings?.maxPurchaseCap),
    minMintCap: undefinedToNull(settings?.minMintCap),
    maxMintCap: undefinedToNull(settings?.maxMintCap),
  } as TokenBondingSettingsV0;
}

function toIdlConfig(config: ICollectiveConfig): CollectiveConfigV0 {
  return {
    isOpen: config.isOpen,
    // @ts-ignore
    unclaimedTokenBondingSettings: toIdlTokenBondingSettings(config.unclaimedTokenBondingSettings),
    // @ts-ignore
    claimedTokenBondingSettings: toIdlTokenBondingSettings(config.claimedTokenBondingSettings),
    // @ts-ignore
    unclaimedTokenMetadataSettings: toIdlTokenMetdataSettings(config.unclaimedTokenMetadataSettings)
  }
}


export class SplTokenCollective {
  program: Program<SplTokenCollectiveIDL>;
  splTokenBondingProgram: SplTokenBonding;
  splTokenMetadata: SplTokenMetadata;
  provider: Provider;

  static ID = new PublicKey("WumbodN8t7wcDPCY2nGszs4x6HRtL5mJcTR519Qr6m7");
  static OPEN_COLLECTIVE_ID = new PublicKey("AHzARGg7AqQ37YQzZmXJjzfj5N9cA9rAi9ZWrcJsHBD6");
  static OPEN_COLLECTIVE_BONDING_ID = new PublicKey("6UuF2yvHg8Xpj36uydNMiZCNtj2XcTMuY2gMggRzmRPq");
  static OPEN_COLLECTIVE_MINT_ID = new PublicKey("8K1Z1yG1iP2CJz8ZinXLBbbACuZoR1Euc1M33oiKYMPJ");

  static async init(provider: Provider, splCollectiveProgramId: PublicKey = SplTokenCollective.ID, splTokenBondingProgramId: PublicKey = SplTokenBonding.ID): Promise<SplTokenCollective> {
    const SplCollectiveIDLJson = await anchor.Program.fetchIdl(splCollectiveProgramId, provider);
    const splCollective = new anchor.Program(SplCollectiveIDLJson!, splCollectiveProgramId, provider) as anchor.Program<SplTokenCollectiveIDL>;
    const splTokenBondingProgram = await SplTokenBonding.init(provider, splTokenBondingProgramId);
    const splTokenMetadata = await SplTokenMetadata.init(provider);

    return new this({
      provider,
      program: splCollective,
      splTokenBondingProgram,
      splTokenMetadata
    });
  }

  constructor(opts: {
    provider: Provider;
    program: Program<SplTokenCollectiveIDL>;
    splTokenBondingProgram: SplTokenBonding;
    splTokenMetadata: SplTokenMetadata;
  }) {
    this.provider = opts.provider;
    this.program = opts.program;
    this.splTokenBondingProgram = opts.splTokenBondingProgram;
    this.splTokenMetadata = opts.splTokenMetadata;
  }

  get programId() {
    return this.program.programId;
  }

  get rpc() {
    return this.program.rpc;
  }

  get instruction() {
    return this.program.instruction;
  }

  get wallet() {
    return this.provider.wallet;
  }

  get account() {
    return this.program.account;
  }

  get errors() {
    return this.program.idl.errors.reduce((acc, err) => {
      acc.set(err.code, `${err.name}: ${err.msg}`);
      return acc;
    }, new Map<number, string>())
  }

  sendInstructions(instructions: TransactionInstruction[], signers: Signer[], payer?: PublicKey): Promise<string> {
    return sendInstructions(this.errors, this.provider, instructions, signers, payer)
  }

  async createCollectiveInstructions({
    payer = this.wallet.publicKey,
    mint,
    authority,
    mintAuthority,
    config,
    bonding,
    metadata
  }: CreateCollectiveArgs): Promise<BigInstructionResult<{ collective: PublicKey, tokenBonding?: PublicKey }>> {
    const programId = this.programId;
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];

    let metadataAdded = false;
    const addMetadata = async () => {
      if (metadata && !metadataAdded) {
        const { files, txid } = await this.splTokenMetadata.presignCreateArweaveUrl(metadata);
        const uri = await this.splTokenMetadata.getArweaveUrl({
          txid,
          files,
          mint: mint!,
          uploadUrl: metadata.uploadUrl
        })
        
        const { instructions: metadataInstructions, signers: metadataSigners } = await this.splTokenMetadata.createMetadataInstructions({
          mint: mint!,
          authority: mintAuthority,
          data: new Data({
            name: metadata.name,
            symbol: metadata.symbol,
            uri,
            creators: metadata.creators,
            sellerFeeBasisPoints: 0
          })
        })
        instructions.push(...metadataInstructions)
        signers.push(...metadataSigners)
      }

      metadataAdded = true;
    }

    if (!mint) {
      const targetMintKeypair = anchor.web3.Keypair.generate();
      signers.push(targetMintKeypair);
      mint = targetMintKeypair.publicKey;
      instructions.push(...(await createMintInstructions(this.provider, payer, mint, bonding?.targetMintDecimals || 9)));
      mintAuthority = payer;

      await addMetadata();
    }

    if (!mintAuthority) {
      const mintAcct = await this.provider.connection.getAccountInfo(mint!);
      const data = Buffer.from(mintAcct!.data);
      const mintInfo = MintLayout.decode(data);
      if (mintInfo.mintAuthorityOption === 0) {
        throw new Error("Must have mint authority to create a collective");
      } else {
        mintAuthority = new PublicKey(mintInfo.mintAuthority);
      }
      await addMetadata();
    }
    
    const [collective, collectiveBump] = await PublicKey.findProgramAddress(
      [Buffer.from("collective", "utf-8"), mint!.toBuffer()],
      programId
    );

    instructions.push(
      await this.instruction.initializeCollectiveV0(
        // @ts-ignore
        {
          authority: authority ? authority : null,
          bumpSeed: collectiveBump,
          config: toIdlConfig(config)
        },
        {
          accounts: {
            collective,
            mint: mint!,
            mintAuthority: mintAuthority!,
            payer,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    );

    const instructions2 = [];
    const signers2 = [];
    let tokenBonding: PublicKey | undefined;
    if (bonding) {
      // Set back to token bonding's authority
      const [targetMintAuthority] = await PublicKey.findProgramAddress(
        [Buffer.from("target-authority", "utf-8"), mint.toBuffer()],
        this.splTokenBondingProgram.programId
      );
      instructions2.push(Token.createSetAuthorityInstruction(
        TOKEN_PROGRAM_ID,
        mint,
        targetMintAuthority,
        "MintTokens",
        mintAuthority,
        []
      ))
      mintAuthority = targetMintAuthority;

      var {
        instructions: tokenBondingInstructions,
        signers: tokenBondingSigners,
        output: { tokenBonding: outputTokenBonding }
      } = await this.splTokenBondingProgram.createTokenBondingInstructions({
        ...bonding,
        targetMint: mint
      });
      tokenBonding = outputTokenBonding;

      instructions2.push(...tokenBondingInstructions);
      signers2.push(...tokenBondingSigners);
    }

    return {
      output: { collective, tokenBonding },
      instructions: [instructions, instructions2],
      signers: [signers, signers2],
    };
  }

  async createCollective(args: CreateCollectiveArgs): Promise<{ collective: PublicKey, tokenBonding?: PublicKey }> {
    const {
      output,
      instructions,
      signers,
    } = await this.createCollectiveInstructions(args);
    await sendMultipleInstructions(this.errors, this.provider, instructions, signers, args.payer);

    return output;
  }

  async claimSocialTokenInstructions({
    payer = this.wallet.publicKey,
    owner = this.wallet.publicKey,
    tokenRef,
    symbol,
    buyBaseRoyalties,
    buyTargetRoyalties,
    sellBaseRoyalties,
    sellTargetRoyalties,
    ignoreMissingName,
    isPrimary = true
  }: ClaimSocialTokenArgs): Promise<InstructionResult<null>> {
    const tokenRefAcct = await this.account.tokenRefV0.fetch(tokenRef);
    const tokenBondingAcct = await this.splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRefAcct.tokenBonding);
    const name = tokenRefAcct.name! as PublicKey;
    const instructions = [];

    if (!ignoreMissingName && !(await this.splTokenBondingProgram.accountExists(name))) {
      throw new Error("Name account does not exist");
    }

    const defaultBaseRoyalties = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenBondingAcct.baseMint,
      owner,
      true
    );
    const defaultTargetRoyalties = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      tokenBondingAcct.targetMint,
      owner,
      true
    );

    if ((!buyTargetRoyalties || !sellTargetRoyalties) && !(await this.splTokenBondingProgram.accountExists(defaultTargetRoyalties))) {
      console.log(`Creating target royalties ${defaultTargetRoyalties}...`);
      instructions.push(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenBondingAcct.targetMint,
          defaultTargetRoyalties,
          owner,
          payer
        )
      );
    }


    if ((!buyBaseRoyalties || !sellBaseRoyalties) && !(await this.splTokenBondingProgram.accountExists(defaultBaseRoyalties))) {
      console.log(`Creating base royalties ${defaultBaseRoyalties}...`);
      instructions.push(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          tokenBondingAcct.baseMint,
          defaultBaseRoyalties,
          owner,
          payer
        )
      );
    }

    if (!buyBaseRoyalties) {
      buyBaseRoyalties = defaultBaseRoyalties;
    }
    if (!sellBaseRoyalties) {
      sellBaseRoyalties = defaultBaseRoyalties;
    }
    if (!buyTargetRoyalties) {
      buyTargetRoyalties = defaultTargetRoyalties;
    }
    if (!sellTargetRoyalties) {
      sellTargetRoyalties = defaultTargetRoyalties;
    }

    const [reverseTokenRef] = await PublicKey.findProgramAddress(
      [Buffer.from("reverse-token-ref", "utf-8"), tokenRefAcct.collective.toBuffer(), tokenBondingAcct.targetMint.toBuffer()],
      this.programId
    );

    const tokenBondingAuthority =
      await PublicKey.createProgramAddress(
        [Buffer.from("token-bonding-authority", "utf-8"), reverseTokenRef.toBuffer(), new BN(tokenRefAcct.tokenBondingAuthorityBumpSeed).toBuffer()],
        this.programId
      );

    const [newTokenRef, tokenRefBumpSeed] = await PublicKey.findProgramAddress(
      this.tokenRefSeeds({ isPrimary, collective: tokenRefAcct.collective, owner }),
      this.programId
    );

    const metadataUpdateAuthority =
      await PublicKey.createProgramAddress(
        [Buffer.from("token-metadata-authority", "utf-8"), reverseTokenRef.toBuffer(), new BN(tokenRefAcct.tokenMetadataUpdateAuthorityBumpSeed).toBuffer()],
        this.programId
      );

    const [royaltiesOwner] =
      await PublicKey.findProgramAddress(
        [Buffer.from("standin-royalties-owner", "utf-8"), reverseTokenRef.toBuffer()],
        this.programId
      );

    instructions.push(await this.instruction.claimSocialTokenV0({
      tokenRefBumpSeed,
      isPrimary
    }, {
      accounts: {
        payer,
        collective: tokenRefAcct.collective,
        tokenRef: tokenRef,
        newTokenRef,
        reverseTokenRef,
        tokenBonding: tokenRefAcct.tokenBonding,
        tokenMetadata: tokenRefAcct.tokenMetadata,
        tokenBondingAuthority,
        metadataUpdateAuthority,
        name,
        owner,
        baseMint: tokenBondingAcct.baseMint,
        targetMint: tokenBondingAcct.targetMint,
        buyBaseRoyalties: tokenBondingAcct.buyBaseRoyalties,
        buyTargetRoyalties: tokenBondingAcct.buyTargetRoyalties,
        sellBaseRoyalties: tokenBondingAcct.sellBaseRoyalties,
        sellTargetRoyalties: tokenBondingAcct.sellTargetRoyalties,
        newBuyBaseRoyalties: buyBaseRoyalties,
        newBuyTargetRoyalties: buyTargetRoyalties,
        newSellBaseRoyalties: sellBaseRoyalties,
        newSellTargetRoyalties: sellTargetRoyalties,
        royaltiesOwner,
        tokenProgram: TOKEN_PROGRAM_ID,
        tokenBondingProgram: this.splTokenBondingProgram.programId,
        tokenMetadataProgram: METADATA_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      }
    }))

    if (symbol) {
      const tokenMetadataRaw = await this.provider.connection.getAccountInfo(tokenRefAcct.tokenMetadata);
      const tokenMetadata = decodeMetadata(tokenMetadataRaw!.data);

      updateMetadata(
        new Data({
          name: tokenMetadata.data.name,
          symbol: symbol || tokenMetadata.data.symbol,
          uri: tokenMetadata.data.uri,
          sellerFeeBasisPoints: 0,
          creators: null
        }),
        undefined,
        undefined,
        tokenBondingAcct.targetMint.toBase58(),
        owner.toBase58(),
        instructions,
        tokenRefAcct.tokenMetadata.toBase58()
      )
    }

    return {
      signers: [],
      instructions,
      output: null
    }
  }

  async claimSocialToken(args: ClaimSocialTokenArgs): Promise<void> {
    const {
      instructions,
      signers,
    } = await this.claimSocialTokenInstructions(args);
    await this.sendInstructions(instructions, signers);
  }

  tokenRefSeeds({ isPrimary, owner, name, collective }: { isPrimary: boolean, owner?: PublicKey, name?: PublicKey, collective?: PublicKey }): Buffer[] {
    const str = Buffer.from("token-ref", "utf-8");
    if (isPrimary || !collective) {
      if (!owner) {
        throw new Error("Owner is required for a primary token refs");
      }

      return [str, owner!.toBuffer(), PublicKey.default.toBuffer()]
    } else {
      if (!collective) {
        throw new Error("Collective is required for non-primary token refs");
      }

      return [str, (name || owner)!.toBuffer(), collective.toBuffer()]
    }
  }

  async createSocialTokenInstructions({
    ignoreIfExists = false,
    payer = this.wallet.publicKey,
    collective = SplTokenCollective.OPEN_COLLECTIVE_ID,
    name,
    owner,
    tokenName,
    symbol,
    nameClass,
    nameParent,
    curve,
    tokenBondingParams,
    isPrimary = name ? false : true
  }: CreateSocialTokenArgs): Promise<
    BigInstructionResult<{
      tokenRef: PublicKey;
      reverseTokenRef: PublicKey;
      tokenBonding: PublicKey;
    }>
  > {
    if (!owner && !name) {
      owner = this.wallet.publicKey;
    }

    const programId = this.programId;
    const provider = this.provider;
    const instructions1: TransactionInstruction[] = [];
    const signers1: Signer[] = [];

    const collectiveAcct = await this.program.account.collectiveV0.fetch(collective);
    const config = collectiveAcct.config;

    // Token refs
    const [tokenRef, tokenRefBumpSeed] = await PublicKey.findProgramAddress(
      this.tokenRefSeeds({ isPrimary, collective, owner, name }),
      programId
    );

    // create mint with payer as auth
    console.log("Creating social token mint...");
    const targetMintKeypair = anchor.web3.Keypair.generate();
    signers1.push(targetMintKeypair);
    const targetMint = targetMintKeypair.publicKey;

    // @ts-ignore
    instructions1.push(...(await createMintInstructions(provider, payer, targetMint, tokenBondingParams.targetMintDecimals || config.unclaimedTokenBondingSettings?.targetMintDecimals || 9)));

    const [reverseTokenRef, reverseTokenRefBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("reverse-token-ref", "utf-8"), collective.toBuffer(), targetMint.toBuffer()],
        programId
      );

      console.log(tokenRef);
    const existing = await this.account.tokenRefV0.fetchNullable(tokenRef)
    if (existing) {
      if (ignoreIfExists) {
        return {
          instructions: [],
          signers: [],
          output: {
            tokenRef,
            reverseTokenRef,
            tokenBonding: existing.tokenBonding
          }
        }
      }
      throw new Error("Social token already exists for this wallet or name");
    }
    
    // create metadata with payer as temporary authority
    console.log("Creating social token metadata...");
    const [tokenMetadataUpdateAuthority, tokenMetadataUpdateAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("token-metadata-authority", "utf-8"), reverseTokenRef.toBuffer()],
        programId
      );
    const tokenMetadata = await createMetadata(
      new Data({
        name: tokenName,
        symbol: owner ? (symbol || tokenName.slice(0,10)) : "UNCLAIMED",
        uri: "https://wumbo-token-metadata.s3.us-east-2.amazonaws.com/unclaimed.json",
        sellerFeeBasisPoints: 0,
        // @ts-ignore
        creators: null,
      }),
      owner ? owner.toBase58() : tokenMetadataUpdateAuthority.toBase58(),
      targetMint.toBase58(),
      payer.toBase58(),
      instructions1,
      payer.toBase58()
    );

    // Set mint authority to token bondings authority
    const [targetMintAuthority, targetMintAuthorityBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("target-authority", "utf-8"), targetMint.toBuffer()],
      this.splTokenBondingProgram.programId
    );
    instructions1.push(Token.createSetAuthorityInstruction(
      TOKEN_PROGRAM_ID,
      targetMint,
      targetMintAuthority,
      "MintTokens",
      payer,
      []
    ))

    const [tokenBondingAuthority, tokenBondingAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("token-bonding-authority", "utf-8"), reverseTokenRef.toBuffer()],
        programId
      );
    
    const [standinRoyaltiesOwner] =
      await PublicKey.findProgramAddress(
        [Buffer.from("standin-royalties-owner", "utf-8"), reverseTokenRef.toBuffer()],
        programId
      );

    // Create token bonding
    const instructions2: TransactionInstruction[] = [];
    const tokenBondingSettings = owner ? config.claimedTokenBondingSettings : config.unclaimedTokenBondingSettings;
    const signers2: Signer[] = [];
    // @ts-ignore
    const curveToUse = (curve || (!owner && collectiveAcct.config.unclaimedTokenBondingSettings?.curve) || (owner && collectiveAcct.config.claimedTokenBondingSettings?.curve) || collectiveAcct.config.unclaimedTokenBondingSettings?.curve || collectiveAcct.config.claimedTokenBondingSettings?.curve)!;

    if (!curveToUse) {
      throw new Error("No curve provided");
    }

    const { instructions: bondingInstructions, signers: bondingSigners, output: { tokenBonding, buyBaseRoyalties, buyTargetRoyalties, sellBaseRoyalties, sellTargetRoyalties } } = await this.splTokenBondingProgram.createTokenBondingInstructions({
      payer,
      // @ts-ignore
      curve: curveToUse,
      baseMint: collectiveAcct.mint,
      targetMint,
      authority: tokenBondingAuthority,
      // @ts-ignore
      buyBaseRoyaltiesOwner: tokenBondingSettings?.buyBaseRoyalties.ownedByName ? standinRoyaltiesOwner : undefined,
      // @ts-ignore
      sellBaseRoyaltiesOwner: tokenBondingSettings?.sellBaseRoyalties.ownedByName ? standinRoyaltiesOwner : undefined,
      // @ts-ignore
      buyTargetRoyaltiesOwner: tokenBondingSettings?.buyTargetRoyalties.ownedByName ? standinRoyaltiesOwner : undefined,
      // @ts-ignore
      sellTargetRoyaltiesOwner: tokenBondingSettings?.sellTargetRoyalties.ownedByName ? standinRoyaltiesOwner : undefined,
      // @ts-ignore
      buyBaseRoyalties: tokenBondingSettings?.buyBaseRoyalties?.address,
      // @ts-ignore
      sellBaseRoyalties: tokenBondingSettings?.sellBaseRoyalties?.address,
      // @ts-ignore
      buyTargetRoyalties: tokenBondingSettings?.buyTargetRoyalties?.address,
      // @ts-ignore
      sellTargetRoyalties: tokenBondingSettings?.sellTargetRoyalties?.address,
      ...tokenBondingParams
    });
    instructions2.push(...bondingInstructions);
    signers2.push(...bondingSigners);

    const initializeArgs = {
      isPrimary,
      collective,
      tokenMetadata: new PublicKey(tokenMetadata),
      tokenBonding,
      payer,
      baseMint: collectiveAcct.mint,
      targetMint,
      buyBaseRoyalties,
      buyTargetRoyalties,
      sellBaseRoyalties,
      sellTargetRoyalties,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
      clock: SYSVAR_CLOCK_PUBKEY
    }
    const args = {
      isPrimary,
      nameClass: nameClass || null,
      nameParent: nameParent || null,
      collectiveBumpSeed: collectiveAcct.bumpSeed,
      tokenBondingAuthorityBumpSeed,
      tokenRefBumpSeed,
      reverseTokenRefBumpSeed,
      tokenMetadataUpdateAuthorityBumpSeed,
    }

    if (owner) {
      instructions2.push(
        await this.instruction.initializeOwnedSocialTokenV0(
          args,
          {
            accounts: {
              initializeArgs,
              authority: collectiveAcct.authority as (PublicKey | undefined) || PublicKey.default,
              owner,
              payer,
              tokenRef,
              reverseTokenRef,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
          }
        )
      );
    } else {
      instructions2.push(
        await this.instruction.initializeUnclaimedSocialTokenV0(
          args,
          {
            accounts: {
              initializeArgs,
              authority: collectiveAcct.authority as (PublicKey | undefined) || PublicKey.default,
              name: name!,
              payer,
              tokenRef,
              reverseTokenRef,
              tokenMetadata,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            },
          }
        )
      ); 
    }

    return {
      output: { tokenRef, reverseTokenRef, tokenBonding },
      instructions: [instructions1, instructions2],
      signers: [signers1, signers2],
    };
  }

  async createSocialToken(args: CreateSocialTokenArgs): Promise<{
    tokenRef: PublicKey;
    reverseTokenRef: PublicKey;
    tokenBonding: PublicKey;
  }> {
    const {
      output: { tokenRef, reverseTokenRef, tokenBonding },
      instructions: instructionGroups,
      signers: signerGroups,
    } = await this.createSocialTokenInstructions(args);

    if (instructionGroups.length > 0) {
      await sendMultipleInstructions(
        this.errors,
        this.provider,
        instructionGroups,
        signerGroups,
        args.payer
      )
      
    }
    
    return { tokenRef, reverseTokenRef, tokenBonding };
  }
}
