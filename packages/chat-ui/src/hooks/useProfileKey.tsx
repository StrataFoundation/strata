import { PublicKey } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useAsync } from "react-async-hook";

export function useProfileKey(args: {
  wallet?: PublicKey;
  username?: string;
}): PublicKey | undefined {
  const { result } = useAsync(
    (wallet?: string, username?: string) =>
      ChatSdk.profileKey({
        wallet: wallet ? new PublicKey(wallet) : undefined,
        username,
      }),
    [args.wallet?.toBase58(), args.username]
  );

  return result ? result[0] : undefined;
}
