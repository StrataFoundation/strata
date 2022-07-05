import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useMemo } from "react";
import { useProfile } from "./useProfile";
import { useProfileKey } from "./useProfileKey";

export function useWalletProfile(wallet: PublicKey | undefined) {
  const { key: profileKey, loading } = useProfileKey(wallet || undefined);

  const profile = useProfile(profileKey);
  return {
    ...profile,
    loading: useMemo(() => profile.loading || loading, [profile.loading, loading])
  }
}
