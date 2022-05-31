import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair } from "@solana/web3.js";
import { useLocalStorage } from "@strata-foundation/react";
import { useMemo } from "react";

export function useDelegateWallet(): Keypair | undefined {
  const { publicKey } = useWallet();
  const [delegateData] = useLocalStorage("delegateWallet", undefined);
  const delegateWallet = useMemo(() => {
    if (delegateData && publicKey) {
      try {
        return JSON.parse(localStorage.delegateWallet)[publicKey?.toBase58()];
      } catch (e: any) {
        // ignore
        console.error(e)
      }
    }
  }, [delegateData, publicKey?.toBase58()]);

  const delegateWalletKeypair = useMemo(
    () => delegateWallet && Keypair.fromSecretKey(new Uint8Array(delegateWallet)),
    [delegateWallet]
  );

  return delegateWalletKeypair;
}