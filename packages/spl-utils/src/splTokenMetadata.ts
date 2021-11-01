import { Provider } from "@wum.bo/anchor";
import { ARWEAVE_UPLOAD_URL, getFilesWithMetadata, prepPayForFilesInstructions, uploadToArweave } from "./arweave";
import { createMetadata, Creator, Data, MetadataCategory } from "./metadata";
import { PublicKey, Connection, TransactionInstruction, Signer, Transaction, Account } from "@solana/web3.js";
import { InstructionResult, sendInstructions } from ".";

export interface ICreateArweaveUrlArgs {
  payer?: PublicKey;
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  creators: Creator[],
  files?: File[]
}

export interface ICreateMetadataInstructionsArgs {
  data: Data;
  authority?: PublicKey;
  mint: PublicKey;
  payer?: PublicKey;
}

export class SplTokenMetadata {
  provider: Provider;

  static async init(provider: Provider): Promise<SplTokenMetadata> {
    return new this({
      provider
    });
  }

  constructor(opts: {
    provider: Provider;
  }) {
    this.provider = opts.provider;
  }


  sendInstructions(instructions: TransactionInstruction[], signers: Signer[], payer?: PublicKey): Promise<string> {
    return sendInstructions(new Map<number, string>(), this.provider, instructions, signers, payer)
  }


  async presignCreateArweaveUrlInstructions({
    name,
    symbol,
    description = "",
    image,
    creators,
    files = [],
    payer = this.provider.wallet.publicKey
  }: ICreateArweaveUrlArgs): Promise<InstructionResult<{ files: File[] }>> {
    const metadata = {
      name,
      symbol,
      description,
      image,
      external_url: "",
      animation_url: undefined,
      properties: {
        category: MetadataCategory.Image,
        files,
      },
      creators: creators,
      sellerFeeBasisPoints: 0,
    };
    const realFiles = getFilesWithMetadata(files, metadata);
    const prepayTxnInstructions = await prepPayForFilesInstructions(
      payer,
      realFiles
    );

    return {
      instructions: prepayTxnInstructions,
      signers: [],
      output: {
        files: realFiles
      }
    }
  }

  async presignCreateArweaveUrl(args: ICreateArweaveUrlArgs): Promise<{ files: File[], txid: string }> {
    const {
      output: { files },
      instructions,
      signers,
    } = await this.presignCreateArweaveUrlInstructions(args);
    const txid = await this.sendInstructions(instructions, signers);

    return {
      files,
      txid
    };
  }

  async getArweaveUrl({
    txid,
    mint,
    files = [],
    uploadUrl = ARWEAVE_UPLOAD_URL
  }: { uploadUrl?: string, txid: string, mint: PublicKey, files?: File[] }): Promise<string> {
    const result = await uploadToArweave(
      txid,
      mint,
      files,
      uploadUrl
    );

    const metadataFile = result.messages?.find(
      (m) => m.filename === "manifest.json"
    );
    console.log(JSON.stringify(metadataFile, null, 2));

    if (!metadataFile) {
      throw new Error("Metdata file not found");
    }

    // Use the uploaded arweave files in token metadata
    return`https://arweave.net/${metadataFile.transactionId}`;
  }

  async createMetadataInstructions({
    data,
    authority = this.provider.wallet.publicKey,
    mint,
    payer = this.provider.wallet.publicKey
  }: ICreateMetadataInstructionsArgs): Promise<InstructionResult<{ metadata: PublicKey }>> {
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
        metadata: new PublicKey(metadata)
      }
    }
  }
}