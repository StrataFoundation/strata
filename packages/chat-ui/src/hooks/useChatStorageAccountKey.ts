import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { useAsync } from "react-async-hook";
import { useDelegateWallet } from "./useDelegateWallet";

const PROGRAM_ID = new PublicKey(
  "2e1wdyNhUvE76y6yUCvah2KaviavMJYKoRun8acMRBZZ"
);

function getStorageAccount(
  key: PublicKey,
  accountSeed: BN
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from("storage-account"),
      key.toBytes(),
      accountSeed.toTwos(2).toArrayLike(Buffer, "le", 4),
    ],
    PROGRAM_ID
  );
}

export function useChatStorageAccountKey(): any {
  const { keypair: delegateWallet } = useDelegateWallet();
  return useAsync(
    async (wallet: string | undefined) =>
      wallet
        ? (await getStorageAccount(new PublicKey(wallet), new BN(0)))[0]
        : undefined,
    [delegateWallet?.publicKey.toBase58()]
  );
}
