import { PublicKey } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useAsync } from "react-async-hook";

export function useSettingsKey(wallet?: PublicKey): {
  loading: boolean;
  key: PublicKey | undefined;
} {
  const { result, loading } = useAsync(
    async (wallet?: string) =>
      wallet ? ChatSdk.settingsKey(new PublicKey(wallet)) : undefined,
    [wallet?.toBase58()]
  );

  return {
    loading: loading,
    key: result ? result[0] : undefined,
  };
}
