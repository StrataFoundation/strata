import { PublicKey } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useAsync } from "react-async-hook";

export function useChatKey(identifer: string | undefined): PublicKey | undefined {
  const { result } = useAsync(
    async (id: string | undefined) => id && ChatSdk.chatKey(id),
    [identifer]
  );

  return result ? result[0] : undefined;
}
