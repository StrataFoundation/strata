import { PublicKey } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useAsync } from "react-async-hook";

export function useProfileKey(args: {
  wallet?: PublicKey;
  username?: string;
}): { loading: boolean, key: PublicKey | undefined } {
  const { result, loading } = useAsync(
    (wallet?: string, username?: string) =>
      ChatSdk.profileKey({
        wallet: wallet ? new PublicKey(wallet) : undefined,
        username,
      }),
    [args.wallet?.toBase58(), args.username]
  );

  return {
    loading: loading,
    key: result ? result[0] : undefined
  }
}
