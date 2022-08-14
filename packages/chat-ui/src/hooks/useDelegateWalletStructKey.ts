import { PublicKey } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useAsync } from "react-async-hook";

export function useDelegateWalletStructKey(delegateWallet?: PublicKey): {
  loading: boolean;
  key: PublicKey | undefined;
} {
  const { result, loading } = useAsync(
    async (delegateWallet?: string) =>
      delegateWallet
        ? ChatSdk.delegateWalletKey(new PublicKey(delegateWallet))
        : undefined,
    [delegateWallet?.toBase58()]
  );

  return {
    loading: loading,
    key: result ? result[0] : undefined,
  };
}
