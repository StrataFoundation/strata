import { useWallet } from "@solana/wallet-adapter-react";
import { useProfile } from "./useProfile";
import { useProfileKey } from "./useProfileKey";

export function useWalletProfile() {
  const { publicKey } = useWallet();
  const profileKey = useProfileKey({ wallet: publicKey || undefined });

  return useProfile(profileKey);
}
