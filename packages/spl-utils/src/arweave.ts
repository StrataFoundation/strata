import { Creator } from "@metaplex-foundation/mpl-token-metadata";
import { calculate } from "@metaplex/arweave-cost";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction
} from "@solana/web3.js";
import crypto from "crypto";
import { Attribute } from "./splTokenMetadata";

export const AR_SOL_HOLDER_ID = new PublicKey(
  "6FKvsq4ydWFci6nGq9ckbjYMtnmaqAoatz5c9XWjiDuS"
);
export const ARWEAVE_UPLOAD_URL =
  process.env.REACT_APP_ARWEAVE_UPLOAD_URL ||
  "https://us-central1-metaplex-studios.cloudfunctions.net/uploadFile";
// export const ARWEAVE_UPLOAD_URL = process.env.REACT_APP_ARWEAVE_UPLOAD_URL || "https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFile4";

const MEMO_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

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

export type ArweaveEnv = "mainnet-beta" | "testnet" | "devnet";

export async function uploadToArweave(
  txid: string,
  mintKey: PublicKey,
  files: File[],
  uploadUrl: string = ARWEAVE_UPLOAD_URL,
  env: ArweaveEnv = "mainnet-beta"
): Promise<IArweaveResult> {
  // this means we're done getting AR txn setup. Ship it off to ARWeave!
  const data = new FormData();
  data.append("transaction", txid);
  data.append("env", env);

  const tags = files.reduce(
    (acc: Record<string, Array<{ name: string; value: string }>>, f) => {
      acc[f.name] = [{ name: "mint", value: mintKey.toBase58() }];
      return acc;
    },
    {}
  );

  data.append("tags", JSON.stringify(tags));
  files.map((f) => data.append("file[]", f));

  // TODO: convert to absolute file name for image

  const resp = await fetch(uploadUrl, {
    method: "POST",
    // @ts-ignore
    body: data,
  });

  if (!resp.ok) {
    return Promise.reject(
      new Error(
        "Unable to upload the artwork to Arweave. Please wait and then try again."
      )
    );
  }

  const result: IArweaveResult = await resp.json();

  if (result.error) {
    return Promise.reject(new Error(result.error));
  }

  return result;
}

export const prePayForFilesInstructions = async (
  payer: PublicKey,
  files: File[],
): Promise<TransactionInstruction[]> => {
  const instructions: TransactionInstruction[] = [];
  const sizes = files.map((f) => f.size);
  const result = await calculate(sizes);

  const lamports = Math.ceil(LAMPORTS_PER_SOL * result.solana);
  instructions.push(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: AR_SOL_HOLDER_ID,
      lamports,
    })
  );

  for (let i = 0; i < files.length; i++) {
    const hashSum = crypto.createHash("sha256");
    hashSum.update(await files[i].text());
    const hex = hashSum.digest("hex");
    instructions.push(
      new TransactionInstruction({
        keys: [],
        programId: MEMO_ID,
        data: Buffer.from(hex),
      })
    );
  }

  return instructions;
};

export function getFilesWithMetadata(
  files: File[],
  metadata: {
    name: string;
    symbol: string;
    description: string;
    image: string | undefined;
    animationUrl: string | undefined;
    externalUrl: string;
    properties: any;
    attributes: Attribute[] | undefined;
    creators: Creator[] | null;
    sellerFeeBasisPoints: number;
  }
): File[] {
  const metadataContent = {
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description,
    seller_fee_basis_points: metadata.sellerFeeBasisPoints,
    image: metadata.image,
    animation_url: metadata.animationUrl,
    external_url: metadata.externalUrl,
    attributes: metadata.attributes,
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

  const realFiles: File[] = [
    ...files,
    new File([JSON.stringify(metadataContent)], "metadata.json"),
  ];

  return realFiles;
}
