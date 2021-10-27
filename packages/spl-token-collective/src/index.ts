import * as anchor from "@wum.bo/anchor";
import BN from "bn.js";
import { IdlTypes, Program, Provider } from "@wum.bo/anchor";
import { createMetadata, Data, decodeMetadata, METADATA_PROGRAM_ID, extendBorsh, InstructionResult, BigInstructionResult, sendInstructions, sendMultipleInstructions, getMetadata, updateMetadata } from "@wum.bo/spl-utils";
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
import { SplTokenBonding } from "@wum.bo/spl-token-bonding";

export * from "./generated/spl-token-collective";

extendBorsh();

interface CreateCollectiveArgs {
  payer?: PublicKey;
  mint: PublicKey;
  mintAuthority?: PublicKey;
  authority?: PublicKey;
  config: ICollectiveConfig,
}

interface CreateSocialTokenArgs {
  payer?: PublicKey;
  collective: PublicKey;
  name?: PublicKey; // Either these or owner needs to be provided
  nameClass?: PublicKey; // Either these or owner needs to be provided
  nameParent?: PublicKey; // Either these or owner needs to be provided
  tokenName: string; // For the token metadata name
  owner?: PublicKey;
  curve: PublicKey; // The curve to create this social token on
  // Taken from token bonding initialize
  tokenBondingParams: {
    buyBaseRoyaltyPercentage: number;
    buyTargetRoyaltyPercentage: number;
    sellBaseRoyaltyPercentage: number;
    sellTargetRoyaltyPercentage: number;

    buyBaseRoyalties?: PublicKey; // If not provided, create an Associated Token Account with baseRoyaltiesOwner
    buyBaseRoyaltiesOwner?: PublicKey; // If base royalties not provided, will create it with this owner. Otherwise, will use wallet.publicKey
    buyTargetRoyalties?: PublicKey; // If not provided, create an Associated Token Account with targetRoyaltiesOwner
    buyTargetRoyaltiesOwner?: PublicKey; // If target royalties not provided, will create it with this owner. Otherwise, will use wallet.publicKey
    sellBaseRoyalties?: PublicKey; // If not provided, create an Associated Token Account with baseRoyaltiesOwner
    sellBaseRoyaltiesOwner?: PublicKey; // If base royalties not provided, will create it with this owner. Otherwise, will use wallet.publicKey
    sellTargetRoyalties?: PublicKey; // If not provided, create an Associated Token Account with targetRoyaltiesOwner
    sellTargetRoyaltiesOwner?: PublicKey; // If target royalties not provided, will create it with this owner. Otherwise, will use wallet.publicKey
  }
}

interface ClaimSocialTokenArgs {
  payer?: PublicKey;
  owner: PublicKey;
  tokenRef: PublicKey;
  symbol?: string;
  buyBaseRoyalties?: PublicKey; // Defaults to ATA fo the owner
  buyTargetRoyalties?: PublicKey; // Defaults to ATA fo the owner
  sellBaseRoyalties?: PublicKey; // Defaults to ATA fo the owner
  sellTargetRoyalties?: PublicKey; // Defaults to ATA fo the owner
}

interface IRoyaltySetting {
  ownedByName?: boolean,
  address?: number
}

interface ITokenBondingSettings {
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

interface ITokenMetadataSettings {
  symbol?: string;
  uri?: string;
  nameIsNameServiceName?: boolean;
}

interface ICollectiveConfig {
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

function toIdlTokenMetdataSettings(settings: ITokenMetadataSettings | undefined): TokenMetadataSettingsV0 | null {
  return settings ? {
    symbol: undefinedToNull(settings.symbol),
    uri: undefinedToNull(settings.uri),
    nameIsNameServiceName: !!settings.nameIsNameServiceName
  } : null;
}

function toIdlRoyaltySettings(settings: IRoyaltySetting | undefined): RoyaltySettingV0 | null {
  return settings ? {
    ownedByName: !!settings.ownedByName,
    address: undefinedToNull(settings?.address)
  } : null
}

function toIdlTokenBondingSettings(settings: ITokenBondingSettings | undefined): TokenBondingSettingsV0 | null {
  return settings ? {
    curve: undefinedToNull(settings.curve),
    minSellBaseRoyaltyPercentage: undefinedToNull(settings.minSellBaseRoyaltyPercentage),
    minSellTargetRoyaltyPercentage: undefinedToNull(settings.minSellTargetRoyaltyPercentage),
    maxSellBaseRoyaltyPercentage: undefinedToNull(settings.maxSellBaseRoyaltyPercentage),
    maxSellTargetRoyaltyPercentage: undefinedToNull(settings.maxSellTargetRoyaltyPercentage),
    minBuyBaseRoyaltyPercentage: undefinedToNull(settings.minBuyBaseRoyaltyPercentage),
    minBuyTargetRoyaltyPercentage: undefinedToNull(settings.minBuyTargetRoyaltyPercentage),
    maxBuyBaseRoyaltyPercentage: undefinedToNull(settings.maxBuyBaseRoyaltyPercentage),
    maxBuyTargetRoyaltyPercentage: undefinedToNull(settings.maxBuyTargetRoyaltyPercentage),
    targetMintDecimals: undefinedToNull(settings.targetMintDecimals),
    // @ts-ignore
    buyBaseRoyalties: toIdlRoyaltySettings(settings.buyBaseRoyalties),
    // @ts-ignore
    sellBaseRoyalties: toIdlRoyaltySettings(settings.sellBaseRoyalties),
    // @ts-ignore
    buyTargetRoyalties: toIdlRoyaltySettings(settings.buyTargetRoyalties),
    // @ts-ignore
    sellTargetRoyalties: toIdlRoyaltySettings(settings.sellTargetRoyalties),
    minPurchaseCap: undefinedToNull(settings.minPurchaseCap),
    maxPurchaseCap: undefinedToNull(settings.maxPurchaseCap),
    minMintCap: undefinedToNull(settings.minMintCap),
    maxMintCap: undefinedToNull(settings.maxMintCap),
  } as TokenBondingSettingsV0 : null;
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
  provider: Provider;

  constructor(opts: {
    provider: Provider;
    program: Program<SplTokenCollectiveIDL>;
    splTokenBondingProgram: SplTokenBonding;
  }) {
    this.provider = opts.provider;
    this.program = opts.program;
    this.splTokenBondingProgram = opts.splTokenBondingProgram;
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
    config
  }: CreateCollectiveArgs): Promise<InstructionResult<{ collective: PublicKey }>> {
    const programId = this.programId;
    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];
    if (!mintAuthority) {
      const mintAcct = await this.provider.connection.getAccountInfo(mint);
      const data = Buffer.from(mintAcct!.data);
      const mintInfo = MintLayout.decode(data);
      if (mintInfo.mintAuthorityOption === 0) {
        throw new Error("Must have mint authority to create a collective");
      } else {
        mintAuthority = new PublicKey(mintInfo.mintAuthority);
      }
    }
    
    const [collective, collectiveBump] = await PublicKey.findProgramAddress(
      [Buffer.from("collective", "utf-8"), mint!.toBuffer()],
      programId
    );

    instructions.push(
      await this.instruction.initializeCollectiveV0(
        {
          authority: authority ? authority : null,
          bumpSeed: collectiveBump,
          config: toIdlConfig(config)
        },
        {
          accounts: {
            collective,
            mint,
            mintAuthority: mintAuthority!,
            payer,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          },
        }
      )
    );

    return {
      output: { collective },
      instructions,
      signers,
    };
  }

  async createCollective(args: CreateCollectiveArgs): Promise<PublicKey> {
    const {
      output: { collective },
      instructions,
      signers,
    } = await this.createCollectiveInstructions(args);
    await this.sendInstructions(instructions, signers);

    return collective;
  }

  async claimSocialTokenInstructions({
    payer = this.wallet.publicKey,
    owner = this.wallet.publicKey,
    tokenRef,
    symbol,
    buyBaseRoyalties,
    buyTargetRoyalties,
    sellBaseRoyalties,
    sellTargetRoyalties
  }: ClaimSocialTokenArgs): Promise<InstructionResult<null>> {
    const tokenRefAcct = await this.account.tokenRefV0.fetch(tokenRef);
    const tokenBondingAcct = await this.splTokenBondingProgram.account.tokenBondingV0.fetch(tokenRefAcct.tokenBonding);
    const name = tokenRefAcct.name! as PublicKey;
    const instructions = [];

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
      [Buffer.from("token-ref", "utf-8"), tokenRefAcct.collective.toBuffer(), owner.toBuffer()],
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
    }, {
      accounts: {
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
        buyBaseRoyalties: tokenBondingAcct.sellBaseRoyalties,
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

  async createSocialTokenInstructions({
    payer = this.wallet.publicKey,
    collective,
    name,
    owner,
    tokenName: handle,
    nameClass,
    nameParent,
    curve,
    tokenBondingParams
  }: CreateSocialTokenArgs): Promise<
    BigInstructionResult<{
      tokenRef: PublicKey;
      reverseTokenRef: PublicKey;
      tokenBonding: PublicKey;
    }>
  > {
    const programId = this.programId;
    const provider = this.provider;
    const instructions1: TransactionInstruction[] = [];
    const signers1: Signer[] = [];

    const collectiveAcct = await this.program.account.collectiveV0.fetch(collective);
    const config = collectiveAcct.config;

    // Token refs
    const [tokenRef, tokenRefBumpSeed] = await PublicKey.findProgramAddress(
      [Buffer.from("token-ref", "utf-8"), collective.toBuffer(), (name || owner)!.toBuffer()],
      programId
    );

    // create mint with payer as auth
    console.log("Creating social token mint...");
    const targetMintKeypair = anchor.web3.Keypair.generate();
    signers1.push(targetMintKeypair);
    const targetMint = targetMintKeypair.publicKey;

    instructions1.push(...(await createMintInstructions(provider, payer, targetMint, 9)));

    const [reverseTokenRef, reverseTokenRefBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("reverse-token-ref", "utf-8"), collective.toBuffer(), targetMint.toBuffer()],
        programId
      );
    // create metadata with payer as temporary authority
    console.log("Creating social token metadata...");
    const [tokenMetadataUpdateAuthority, tokenMetadataUpdateAuthorityBumpSeed] =
      await PublicKey.findProgramAddress(
        [Buffer.from("token-metadata-authority", "utf-8"), reverseTokenRef.toBuffer()],
        programId
      );
    const tokenMetadata = await createMetadata(
      new Data({
        name: handle,
        symbol: owner ? handle.slice(0,10) : "UNCLAIMED",
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
    const { instructions: bondingInstructions, signers: bondingSigners, output: { tokenBonding, buyBaseRoyalties, buyTargetRoyalties, sellBaseRoyalties, sellTargetRoyalties } } = await this.splTokenBondingProgram.createTokenBondingInstructions({
      payer,
      curve,
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
      buyBaseRoyalties: tokenBondingSettings?.buyBaseRoyalties.address,
      // @ts-ignore
      sellBaseRoyalties: tokenBondingSettings?.sellBaseRoyalties.address,
      // @ts-ignore
      buyTargetRoyalties: tokenBondingSettings?.buyTargetRoyalties.address,
      // @ts-ignore
      sellTargetRoyalties: tokenBondingSettings?.sellTargetRoyalties.address,
      ...tokenBondingParams
    });
    instructions2.push(...bondingInstructions);
    signers2.push(...bondingSigners);

    const initializeArgs = {
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

    await sendMultipleInstructions(
      this.errors,
      this.provider,
      instructionGroups,
      signerGroups,
      args.payer
    )
    
    return { tokenRef, reverseTokenRef, tokenBonding };
  }
}
