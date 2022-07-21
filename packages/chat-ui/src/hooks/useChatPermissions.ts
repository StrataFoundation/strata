import { PublicKey } from "@solana/web3.js";
import { IChatPermissions } from "@strata-foundation/chat";
import { useAccount, UseAccountState } from "@strata-foundation/react";
import { useChatSdk } from "../contexts/chatSdk";

export const useChatPermissions = (
  chatPermissions: PublicKey | undefined | null
): UseAccountState<IChatPermissions> => {
  const { chatSdk } = useChatSdk();

  return useAccount(chatPermissions, chatSdk?.chatPermissionsDecoder);
};
