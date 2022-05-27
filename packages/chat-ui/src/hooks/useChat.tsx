import { PublicKey } from "@solana/web3.js";
import { IChat } from "@strata-foundation/chat";
import { useAccount, UseAccountState } from "@strata-foundation/react";
import { useChatSdk } from "../contexts/chatSdk";

export const useChat = (
  profile: PublicKey | undefined | null
): UseAccountState<IChat> => {
  const { chatSdk } = useChatSdk();

  return useAccount(profile, chatSdk?.chatDecoder);
};
