import { PublicKey } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useAsync } from "react-async-hook";

export function useChatPermissionsKey(chat?: PublicKey): {
  loading: boolean;
  key: PublicKey | undefined;
} {
  const { result, loading } = useAsync(
    async (chat?: string) =>
      chat ? ChatSdk.chatPermissionsKey(new PublicKey(chat)) : undefined,
    [chat?.toBase58()]
  );

  return {
    loading: loading,
    key: result ? result[0] : undefined,
  };
}
