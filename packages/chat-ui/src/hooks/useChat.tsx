import { PublicKey } from "@solana/web3.js";
import { IChat } from "@strata-foundation/chat";
import { useAccount, UseAccountState } from "@strata-foundation/react";
import { useChatSdk } from "../contexts/chatSdk";

export const useChat = (
  chat: PublicKey | undefined | null
): UseAccountState<IChat> => {
  const { chatSdk } = useChatSdk();

  return useAccount(chat, chatSdk?.chatDecoder);
};
