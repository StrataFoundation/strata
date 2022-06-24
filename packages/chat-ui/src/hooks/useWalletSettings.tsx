import { useWallet } from "@solana/wallet-adapter-react";
import { useSettingsKey } from "./useSettings";
import { useSettings } from "./useSettingsKey";

export function useWalletSettings() {
  const { publicKey } = useWallet();
  const { key } = useSettingsKey(publicKey || undefined);

  return useSettings(key)
}
