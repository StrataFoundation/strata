import { useWallet } from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import { useProfile } from "./useProfile";
import { useProfileKey } from "./useProfileKey";

export function useWalletProfile() {
  const { publicKey } = useWallet();
  const { key: profileKey, loading } = useProfileKey(publicKey || undefined);

  const profile = useProfile(profileKey);
  return {
    ...profile,
    loading: useMemo(() => profile.loading || loading, [profile.loading, loading])
  }
}
