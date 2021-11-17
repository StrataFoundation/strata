import { ArweaveStorage, Coingecko, ConversionRatePair, Currency } from "@metaplex/js";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import crypto from "crypto";
import { Creator } from ".";
import { calculate } from '@metaplex/arweave-cost';

export const AR_SOL_HOLDER_ID = new PublicKey(
  "6FKvsq4ydWFci6nGq9ckbjYMtnmaqAoatz5c9XWjiDuS"
);
export const ARWEAVE_UPLOAD_URL = process.env.REACT_APP_ARWEAVE_UPLOAD_URL || "https://us-central1-metaplex-studios.cloudfunctions.net/uploadFile";
export const MEMO_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

type ArweaveFile = {
  filename: string;
  status: "success" | "fail";
  transactionId?: string;
  error?: string;
};
interface IArweaveResult {
  error?: string;
  messages?: Array<ArweaveFile>;
}

export type ArweaveEnv = 'mainnet-beta' | 'testnet' | 'devnet';

export async function uploadToArweave(
  txid: string,
  mintKey: PublicKey,
  files: Map<string, Buffer>,
  uploadUrl: string = ARWEAVE_UPLOAD_URL,
  env: ArweaveEnv = "mainnet-beta"
): Promise<IArweaveResult> {
  console.log(env);
  return new ArweaveStorage({ endpoint: uploadUrl, env }).upload(
    // @ts-ignore
    new Map([...files.entries()].map(([name, file]) => [name, new File([file], name)])),
    mintKey.toBase58(), 
    txid
  )
}

export const prepPayForFilesInstructions = async (
  payer: PublicKey,
  files: Map<string, Buffer>,
  uploadUrl: string = ARWEAVE_UPLOAD_URL,
  env: ArweaveEnv = "mainnet-beta"
): Promise<TransactionInstruction[]> => {
  const instructions: TransactionInstruction[] = [];

  const sizes = [...files.entries()].map(([_, f]) => f.length);
  const lamports = await calculate(sizes);

  debugger;
  instructions.push(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: AR_SOL_HOLDER_ID,
      lamports: LAMPORTS_PER_SOL * lamports.solana
    })
  );

  const fileEntries = [...files.entries()];
  for (let i = 0; i < fileEntries.length; i++) {
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileEntries[i][1]);
    const hex = hashSum.digest('hex');
    instructions.push(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_ID,
        data: Buffer.from(hex),
      }),
    );
  }

  return instructions;
};


export function getFilesWithMetadata(
  files: Map<string, Buffer>,
  metadata: {
    name: string;
    symbol: string;
    description: string;
    image: string | undefined;
    animation_url: string | undefined;
    external_url: string;
    properties: any;
    creators: Creator[] | null;
    sellerFeeBasisPoints: number;
  }
): Map<string, Buffer> {
  const metadataContent = {
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description,
    seller_fee_basis_points: metadata.sellerFeeBasisPoints,
    image: metadata.image,
    animation_url: metadata.animation_url,
    external_url: metadata.external_url,
    properties: {
      ...metadata.properties,
      creators: metadata.creators?.map((creator) => {
        return {
          address: creator.address,
          share: creator.share,
        };
      }),
    },
  };

  files.set("metadata.json", Buffer.from(JSON.stringify(metadataContent), "utf-8"))
  
  return files;
}
