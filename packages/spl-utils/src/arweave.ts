import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import crypto from "crypto";
import { Creator } from ".";

export const AR_SOL_HOLDER_ID = new PublicKey(
  "HvwC9QSAzvGXhhVrgPmauVwFWcYZhne3hVot9EbHuFTm"
);
export const ARWEAVE_UPLOAD_URL = process.env.REACT_APP_ARWEAVE_UPLOAD_URL || "https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFileProd2";
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

export const LAMPORT_MULTIPLIER = 10 ** 9;
const WINSTON_MULTIPLIER = 10 ** 12;

async function getAssetCostToStore(files: File[]) {
  const totalBytes = files.reduce((sum, f) => (sum += f.size), 0);
  console.log("Total bytes", totalBytes);
  const txnFeeInWinstons = parseInt(
    await (await fetch("https://arweave.net/price/0")).text()
  );
  console.log("txn fee", txnFeeInWinstons);
  const byteCostInWinstons = parseInt(
    await (
      await fetch("https://arweave.net/price/" + totalBytes.toString())
    ).text()
  );
  console.log("byte cost", byteCostInWinstons);
  const totalArCost =
    (txnFeeInWinstons * files.length + byteCostInWinstons) / WINSTON_MULTIPLIER;

  console.log("total ar", totalArCost);

  let conversionRates = JSON.parse(
    localStorage.getItem("conversionRates") || "{}"
  );

  if (
    !conversionRates ||
    !conversionRates.expiry ||
    conversionRates.expiry < Date.now()
  ) {
    console.log("Calling conversion rate");
    conversionRates = {
      value: JSON.parse(
        await (
          await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=solana,arweave&vs_currencies=usd"
          )
        ).text()
      ),
      expiry: Date.now() + 5 * 60 * 1000,
    };

    if (conversionRates.value.solana)
      localStorage.setItem("conversionRates", JSON.stringify(conversionRates));
  }

  // To figure out how many lamports are required, multiply ar byte cost by this number
  const arMultiplier =
    conversionRates.value.arweave.usd / conversionRates.value.solana.usd;
  console.log("Ar mult", arMultiplier);
  // We also always make a manifest file, which, though tiny, needs payment.
  return LAMPORT_MULTIPLIER * totalArCost * arMultiplier * 1.1;
}

export async function uploadToArweave(
  txid: string,
  mintKey: PublicKey,
  files: File[],
  uploadUrl: string = ARWEAVE_UPLOAD_URL
): Promise<IArweaveResult> {
  // Ship it off to ARWeave!
  const data = new FormData();

  const tags = files.reduce(
    (acc: Record<string, Array<{ name: string; value: string }>>, f) => {
      acc[f.name] = [{ name: "mint", value: mintKey.toBase58() }];
      return acc;
    },
    {}
  );

  data.append("tags", JSON.stringify(tags));
  data.append("transaction", txid);
  // data.append("env", IS_DEV ? "devnet" : "mainnet-beta");
  files.map((f) => data.append("file[]", f));

  // TODO: convert to absolute file name for image
  try {
    const result: IArweaveResult = await (
      await fetch(
        // TODO: add CNAME
        uploadUrl,
        {
          method: "POST",
          body: data,
        }
      )
    ).json();

    return result;
  } catch (e: any) {
    if (e.response?.data?.message) {
      throw new Error(e.response.data.message);
    }
    throw e;
  }
}

export const prepPayForFilesInstructions = async (
  payer: PublicKey,
  files: File[]
): Promise<TransactionInstruction[]> => {
  const memo = MEMO_ID;

  const instructions: TransactionInstruction[] = [];

  instructions.push(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: AR_SOL_HOLDER_ID,
      lamports: await getAssetCostToStore(files),
    })
  );

  for (let i = 0; i < files.length; i++) {
    const hashSum = crypto.createHash("sha256");
    hashSum.update(await files[i].text());
    const hex = hashSum.digest("hex");
    instructions.push(
      new TransactionInstruction({
        keys: [],
        programId: memo,
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
    animation_url: string | undefined;
    external_url: string;
    properties: any;
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

  return [
    ...files,
    new File([JSON.stringify(metadataContent)], "metadata.json"),
  ];
}
