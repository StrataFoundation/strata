import { PublicKey } from "@solana/web3.js";
import { useChatPermissions } from "./useChatPermissions";
import { useChatPermissionsKey } from "./useChatPermissionsKey";

export function useChatPermissionsFromChat(chat: PublicKey | undefined) {
  const { key: chatPermissionsKey, loading } = useChatPermissionsKey(chat);
  const ret = useChatPermissions(chatPermissionsKey);

  return {
    ...ret,
    loading: loading || ret.loading
  }
}
