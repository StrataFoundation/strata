import { Provider } from "@project-serum/anchor";
import { getMintInfo } from "@project-serum/common";
import { AccountInfo as TokenAccountInfo, MintInfo } from "@solana/spl-token";
import { PublicKey, Signer, TransactionInstruction } from "@solana/web3.js";
import {
  decodeMasterEdition,
  InstructionResult,
  MetadataKey,
  METADATA_PROGRAM_ID,
  sendInstructions,
  updateMetadata,
} from ".";
import {
  ARWEAVE_UPLOAD_URL,
  getFilesWithMetadata,
  prePayForFilesInstructions,
  uploadToArweave,
  ArweaveEnv,
} from "./arweave";
import {
  createMetadata,
  Creator,
  Data,
  decodeEdition,
  decodeMetadata,
  EDITION,
  Edition,
  IMetadataExtension,
  MasterEditionV1,
  MasterEditionV2,
  Metadata,
  MetadataCategory,
  METADATA_PREFIX,
} from "./metadata";

export interface ICreateArweaveUrlArgs {
  payer?: PublicKey;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  creators?: Creator[];
  files?: File[];
  env: ArweaveEnv;
  uploadUrl: string;
}

export interface ICreateMetadataInstructionsArgs {
  data: Data;
  authority?: PublicKey;
  mint: PublicKey;
  payer?: PublicKey;
}

export interface IUpdateMetadataInstructionsArgs {
  data?: Data | null;
  authority?: PublicKey | null;
  metadata: PublicKey;
  payer?: PublicKey;
}

export interface ITokenWithMeta {
  metadataKey?: PublicKey;
  metadata?: Metadata;
  mint?: MintInfo;
  edition?: Edition;
  masterEdition?: MasterEditionV1 | MasterEditionV2;
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
      (f: any) => typeof f !== "string" && f.type === MetadataCategory.Image
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
        return getImage(metadata?.uri);
      }

      return imageFromJson(newUri, metadata);
    }
  }

  static async getEdition(tokenMint: PublicKey): Promise<PublicKey> {
    return (
      await PublicKey.findProgramAddress(
        [
          Buffer.from(METADATA_PREFIX),
          new PublicKey(METADATA_PROGRAM_ID).toBuffer(),
          tokenMint.toBuffer(),
          Buffer.from(EDITION),
        ],
        new PublicKey(METADATA_PROGRAM_ID)
      )
    )[0];
  }

  async getEditionInfo(metadata: Metadata | undefined): Promise<{
    edition?: Edition;
    masterEdition?: MasterEditionV1 | MasterEditionV2;
  }> {
    if (!metadata) {
      return {};
    }

    const editionKey = await SplTokenMetadata.getEdition(
      new PublicKey(metadata.mint)
    );

    let edition;
    let masterEdition;
    const editionOrMasterEditionAcct =
      await this.provider.connection.getAccountInfo(editionKey);
    const editionOrMasterEdition = editionOrMasterEditionAcct
      ? editionOrMasterEditionAcct?.data[0] == MetadataKey.EditionV1
        ? decodeEdition(editionOrMasterEditionAcct.data)
        : decodeMasterEdition(editionOrMasterEditionAcct.data)
      : null;

    if (editionOrMasterEdition instanceof Edition) {
      edition = editionOrMasterEdition;
      const masterEditionInfoAcct =
        await this.provider.connection.getAccountInfo(
          new PublicKey(editionOrMasterEdition.parent)
        );
      masterEdition =
        masterEditionInfoAcct &&
        decodeMasterEdition(masterEditionInfoAcct.data);
    } else {
      masterEdition = editionOrMasterEdition;
    }

    return {
      edition,
      masterEdition: masterEdition || undefined,
    };
  }

  async getMetadata(metadataKey: PublicKey): Promise<Metadata | null> {
    const metadataAcc = await this.provider.connection.getAccountInfo(
      metadataKey
    );
    return metadataAcc && decodeMetadata(metadataAcc.data);
  }

  async getTokenMetadata(metadataKey: PublicKey): Promise<ITokenWithMeta> {
    const metadataAcc = await this.provider.connection.getAccountInfo(
      metadataKey
    );
    const metadata = metadataAcc && decodeMetadata(metadataAcc.data);
    const data = await SplTokenMetadata.getArweaveMetadata(metadata?.data.uri);
    const image = await SplTokenMetadata.getImage(metadata?.data.uri);
    const description = data?.description;
    const mint =
      metadata &&
      (await getMintInfo(this.provider, new PublicKey(metadata.mint)));
    return {
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

  async presignCreateArweaveUrlInstructions({
    name,
    symbol,
    description = "",
    image,
    creators,
    files = [],
    payer = this.provider.wallet.publicKey,
    env = "mainnet-beta",
    uploadUrl = ARWEAVE_UPLOAD_URL,
  }: ICreateArweaveUrlArgs): Promise<InstructionResult<{ files: File[] }>> {
    const metadata = {
      name,
      symbol,
      description,
      image,
      externalUrl: "",
      animationUrl: undefined,
      properties: {
        category: MetadataCategory.Image,
        files,
      },
      creators: creators ? creators : null,
      sellerFeeBasisPoints: 0,
    };

    const realFiles = await getFilesWithMetadata(files, metadata);

    const prepayTxnInstructions = await prePayForFilesInstructions(
      payer,
      realFiles,
      uploadUrl,
      env
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
    payer = this.provider.wallet.publicKey,
  }: ICreateMetadataInstructionsArgs): Promise<
    InstructionResult<{ metadata: PublicKey }>
  > {
    const instructions: TransactionInstruction[] = [];
    const metadata = await createMetadata(
      data,
      authority?.toBase58(),
      mint.toBase58(),
      payer.toBase58(),
      instructions,
      payer.toBase58()
    );

    return {
      instructions,
      signers: [],
      output: {
        metadata: new PublicKey(metadata),
      },
    };
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
    authority,
    metadata,
  }: IUpdateMetadataInstructionsArgs): Promise<
    InstructionResult<{ metadata: PublicKey }>
  > {
    const instructions: TransactionInstruction[] = [];
    const metadataAcct = await this.getMetadata(metadata);
    await updateMetadata(
      data == null
        ? undefined
        : typeof data === "undefined"
        ? metadataAcct?.data
        : data,
      authority == null
        ? undefined
        : typeof authority === "undefined"
        ? metadataAcct?.updateAuthority
        : authority.toBase58(),
      undefined,
      metadataAcct!.mint,
      metadataAcct!.updateAuthority,
      instructions,
      metadata.toBase58()
    );

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
