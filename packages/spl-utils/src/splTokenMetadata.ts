import { CreateMetadataV2, Creator, DataV2, Edition, EditionData, MasterEdition, MasterEditionData, Metadata, MetadataData, MetadataKey, UpdateMetadataV2 } from "@metaplex-foundation/mpl-token-metadata";
import { Provider } from "@project-serum/anchor";
import { AccountInfo as TokenAccountInfo, MintInfo } from "@solana/spl-token";
import { PublicKey, Signer, TransactionInstruction } from "@solana/web3.js";
import {
  getMintInfo,
  InstructionResult,
  sendInstructions,
} from ".";
import {
  ARWEAVE_UPLOAD_URL,
  getFilesWithMetadata,
  prePayForFilesInstructions,
  uploadToArweave,
  ArweaveEnv,
} from "./arweave";
// @ts-ignore
import localStorageMemory from "localstorage-memory";

export interface ICreateArweaveUrlArgs {
  payer?: PublicKey;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  creators?: Creator[];
  files?: File[];
  existingFiles?: FileOrString[]
  attributes?: Attribute[];
  animationUrl?: string;
  externalUrl?: string;
  extraMetadata?: any;
}

export type Attribute = {
  trait_type?: string;
  display_type?: string;
  value: string | number;
};

export type MetadataFile = {
  uri: string;
  type: string;
};

export type FileOrString = MetadataFile | string;

export interface IMetadataExtension {
  name: string;
  symbol: string;

  creators: Creator[] | null;
  description: string;
  // preview image absolute URI
  image: string;
  animation_url?: string;

  attributes?: Attribute[];

  // stores link to item on meta
  external_url: string;

  seller_fee_basis_points: number;

  properties: {
    files?: FileOrString[];
    category: MetadataCategory;
    maxSupply?: number;
    creators?: {
      address: string;
      shares: number;
    }[];
  };
}

export interface ICreateMetadataInstructionsArgs {
  data: DataV2;
  authority?: PublicKey;
  mintAuthority?: PublicKey;
  mint: PublicKey;
  payer?: PublicKey;
}

export interface IUpdateMetadataInstructionsArgs {
  data?: DataV2 | null;
  newAuthority?: PublicKey | null;
  metadata: PublicKey;
  payer?: PublicKey;
  /** The update authority to use when updating the metadata. **Default:** Pulled from the metadata object. This can be useful if you're chaining transactions */
  updateAuthority?: PublicKey;
}

export enum MetadataCategory {
  Audio = 'audio',
  Video = 'video',
  Image = 'image',
  VR = 'vr',
}

export interface ITokenWithMeta {
  displayName?: string;
  metadataKey?: PublicKey;
  metadata?: MetadataData;
  mint?: MintInfo;
  edition?: EditionData;
  masterEdition?: MasterEditionData;
  data?: IMetadataExtension;
  image?: string;
  description?: string;
}

const USE_CDN = false; // copied from metaplex. Guess support isn't there yet?
const routeCDN = (uri: string) => {
  let result = uri;
  if (USE_CDN) {
    result = uri.replace(
      "https://arweave.net/",
      "https://coldcdn.com/api/cdn/bronil/"
    );
  }

  return result;
};

export function getImageFromMeta(meta?: any): string | undefined {
  if (meta?.image) {
    return meta?.image;
  } else {
    const found = (meta?.properties?.files || []).find(
      (f: any) => typeof f !== "string" && f.type === "Ima"
    )?.uri;
    return found;
  }
}

const imageFromJson = (newUri: string, extended: any) => {
  const image = getImageFromMeta(extended);
  if (image) {
    const file = image.startsWith("http")
      ? extended.image
      : `${newUri}/${extended.image}`;
    return routeCDN(file);
  }
};

const localStorage = global.localStorage || localStorageMemory

export class SplTokenMetadata {
  provider: Provider;

  static async init(provider: Provider): Promise<SplTokenMetadata> {
    return new this({
      provider,
    });
  }

  constructor(opts: { provider: Provider }) {
    this.provider = opts.provider;
  }

  static attributesToRecord(attributes: Attribute[] | undefined): Record<string, string | number> | undefined {
    if (!attributes) {
      return undefined;
    }
    
    return attributes?.reduce((acc, att) => {
      if (att.trait_type) acc[att.trait_type] = att.value;
      return acc;
    }, {} as Record<string, string | number>);
  }

  static async getArweaveMetadata(
    uri: string | undefined
  ): Promise<IMetadataExtension | undefined> {
    if (uri) {
      const newUri = routeCDN(uri);

      const cached = localStorage.getItem(newUri);
      if (cached) {
        return JSON.parse(cached);
      } else {
        try {
          // TODO: BL handle concurrent calls to avoid double query
          const result = await fetch(newUri);
          let data = await result.json();
          if (data.uri) {
            data = {
              ...data,
              ...(await SplTokenMetadata.getArweaveMetadata(data.uri)),
            };
          }
          try {
            localStorage.setItem(newUri, JSON.stringify(data));
          } catch (e) {
            // ignore
          }
          return data;
        } catch (e) {
          console.log(`Could not fetch from ${uri}`, e);
          return undefined;
        }
      }
    }
  }

  static async getImage(uri: string | undefined): Promise<string | undefined> {
    if (uri) {
      const newUri = routeCDN(uri);
      const metadata = await SplTokenMetadata.getArweaveMetadata(uri);
      // @ts-ignore
      if (metadata?.uri) {
        // @ts-ignore
        return SplTokenMetadata.getImage(metadata?.uri);
      }

      return imageFromJson(newUri, metadata);
    }
  }

  async getEditionInfo(metadata: MetadataData | undefined): Promise<{
    edition?: EditionData;
    masterEdition?: MasterEditionData;
  }> {
    if (!metadata) {
      return {};
    }

    const editionKey = await Edition.getPDA(new PublicKey(metadata.mint));

    let edition;
    let masterEdition;
    const editionOrMasterEditionAcct =
      await this.provider.connection.getAccountInfo(editionKey);
    const editionOrMasterEdition = editionOrMasterEditionAcct
      ? editionOrMasterEditionAcct?.data[0] == MetadataKey.EditionV1
        ? new Edition(editionKey, editionOrMasterEditionAcct)
        : new MasterEdition(editionKey, editionOrMasterEditionAcct)
      : null;

    if (editionOrMasterEdition instanceof Edition) {
      edition = editionOrMasterEdition;
      const masterEditionInfoAcct =
        await this.provider.connection.getAccountInfo(
          new PublicKey(editionOrMasterEdition.data.parent)
        );
      masterEdition =
        masterEditionInfoAcct &&
        new MasterEdition(new PublicKey(editionOrMasterEdition.data.parent), masterEditionInfoAcct)
    } else {
      masterEdition = editionOrMasterEdition;
    }

    return {
      edition: edition?.data,
      masterEdition: masterEdition?.data || undefined,
    };
  }

  async getTokenMetadata(metadataKey: PublicKey): Promise<ITokenWithMeta> {
    const metadataAcc = await this.provider.connection.getAccountInfo(
      metadataKey
    );
    const metadata = metadataAcc && new Metadata(metadataKey, metadataAcc).data
    const data = await SplTokenMetadata.getArweaveMetadata(metadata?.data.uri);
    const image = await SplTokenMetadata.getImage(metadata?.data.uri);
    const description = data?.description;
    const mint =
      metadata &&
      (await getMintInfo(this.provider, new PublicKey(metadata.mint)));

    const displayName =
      metadata?.data.name.length == 32
        ? data?.name
        : metadata?.data.name; 
    return {
      displayName,
      metadata: metadata || undefined,
      metadataKey,
      image,
      mint: mint || undefined,
      data,
      description,
      ...(metadata ? await this.getEditionInfo(metadata) : {}),
    };
  }

  sendInstructions(
    instructions: TransactionInstruction[],
    signers: Signer[],
    payer?: PublicKey
  ): Promise<string> {
    return sendInstructions(
      new Map<number, string>(),
      this.provider,
      instructions,
      signers,
      payer
    );
  }

  /**
   * Wrapper function that prepays for arweave metadata files in SOL, then uploads them to arweave and returns the url
   *
   * @param args
   * @returns 
   */
  async createArweaveMetadata(args: ICreateArweaveUrlArgs & {
    env?: ArweaveEnv;
    uploadUrl?: string;
    mint: PublicKey;
  }): Promise<string> {
    const { txid, files } = await this.presignCreateArweaveUrl(args);
    let env = args.env;
    if (!env) {
      // @ts-ignore
      const url: string = this.provider.connection._rpcEndpoint;
      if (url.includes("devnet")) {
        env = "devnet";
      } else {
        env = "mainnet-beta";
      }
    }

    const uri = await this.getArweaveUrl({
      txid,
      mint: args.mint,
      files,
      env,
      uploadUrl: args.uploadUrl || ARWEAVE_UPLOAD_URL
    });

    return uri;
  }

  async presignCreateArweaveUrlInstructions({
    name,
    symbol,
    description = "",
    image,
    creators,
    files = [],
    payer = this.provider.wallet.publicKey,
    existingFiles,
    attributes,
    externalUrl,
    animationUrl,
    extraMetadata
  }: ICreateArweaveUrlArgs): Promise<InstructionResult<{ files: File[] }>> {
    const metadata = {
      name,
      symbol,
      description,
      image,
      attributes,
      externalUrl: externalUrl || "",
      animationUrl,
      properties: {
        category: MetadataCategory.Image,
        files: [...(existingFiles || []), ...files],
      },
      creators: creators ? creators : null,
      sellerFeeBasisPoints: 0,
      ...(extraMetadata || {})
    };

    const realFiles = await getFilesWithMetadata(files, metadata);

    const prepayTxnInstructions = await prePayForFilesInstructions(
      payer,
      realFiles,
    );

    return {
      instructions: prepayTxnInstructions,
      signers: [],
      output: {
        files: realFiles,
      },
    };
  }

  async presignCreateArweaveUrl(
    args: ICreateArweaveUrlArgs
  ): Promise<{ files: File[]; txid: string }> {
    const {
      output: { files },
      instructions,
      signers,
    } = await this.presignCreateArweaveUrlInstructions(args);
    const txid = await this.sendInstructions(instructions, signers);

    return {
      files,
      txid,
    };
  }

  async getArweaveUrl({
    txid,
    mint,
    files = [],
    uploadUrl = ARWEAVE_UPLOAD_URL,
    env = "mainnet-beta",
  }: {
    env: ArweaveEnv;
    uploadUrl?: string;
    txid: string;
    mint: PublicKey;
    files?: File[];
  }): Promise<string> {
    const result = await uploadToArweave(txid, mint, files, uploadUrl, env);

    const metadataFile = result.messages?.find(
      (m) => m.filename === "manifest.json"
    );

    if (!metadataFile) {
      throw new Error("Metadata file not found");
    }

    // Use the uploaded arweave files in token metadata
    return `https://arweave.net/${metadataFile.transactionId}`;
  }

  async createMetadataInstructions({
    data,
    authority = this.provider.wallet.publicKey,
    mint,
    mintAuthority = this.provider.wallet.publicKey,
    payer = this.provider.wallet.publicKey,
  }: ICreateMetadataInstructionsArgs): Promise<
    InstructionResult<{ metadata: PublicKey }>
  > {
    const metadata = await Metadata.getPDA(mint);
    const instructions: TransactionInstruction[] = new CreateMetadataV2({
      feePayer: payer
    }, {
      metadata,
      mint,
      metadataData: new DataV2({ ...data }),
      mintAuthority,
      updateAuthority: authority
    }).instructions

    return {
      instructions,
      signers: [],
      output: {
        metadata,
      },
    };
  }

  async getMetadata(metadataKey: PublicKey): Promise<MetadataData | null> {
    const metadataAcc = await this.provider.connection.getAccountInfo(
      metadataKey
    );
    return metadataAcc && new Metadata(metadataKey, metadataAcc).data;
  }

  async createMetadata(
    args: ICreateMetadataInstructionsArgs
  ): Promise<{ metadata: PublicKey }> {
    const { instructions, signers, output } =
      await this.createMetadataInstructions(args);

    await this.sendInstructions(instructions, signers, args.payer);

    return output;
  }

  async updateMetadataInstructions({
    data,
    newAuthority,
    metadata,
    updateAuthority
  }: IUpdateMetadataInstructionsArgs): Promise<
    InstructionResult<{ metadata: PublicKey }>
  > {
    const metadataAcct = (await this.getMetadata(metadata))!;
    const instructions = new UpdateMetadataV2({}, {
      metadata,
      metadataData: data ? new DataV2({ ...data }) : new DataV2({
        ...metadataAcct.data,
        collection: metadataAcct?.collection,
        uses: metadataAcct?.uses
      }),
      updateAuthority: updateAuthority || new PublicKey(metadataAcct!.updateAuthority),
      newUpdateAuthority: typeof newAuthority == "undefined" ? new PublicKey(metadataAcct.updateAuthority) : (newAuthority || undefined),
      primarySaleHappened: null,
      isMutable: null
    }).instructions

    return {
      instructions,
      signers: [],
      output: {
        metadata,
      },
    };
  }

  async updateMetadata(
    args: IUpdateMetadataInstructionsArgs
  ): Promise<{ metadata: PublicKey }> {
    const { instructions, signers, output } =
      await this.updateMetadataInstructions(args);

    await this.sendInstructions(instructions, signers, args.payer);

    return output;
  }
}
