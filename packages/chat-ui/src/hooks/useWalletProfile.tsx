import { useWallet } from "@solana/wallet-adapter-react";
import { useProfile } from "./useProfile";
import { useProfileKey } from "./useProfileKey";

export function useWalletProfile() {
  const { publicKey } = useWallet();
  const { key: profileKey, loading } = useProfileKey({ wallet: publicKey || undefined });

  const profile = useProfile(profileKey);
  return {
    ...profile,
    loading: profile.loading || loading
  }
}
