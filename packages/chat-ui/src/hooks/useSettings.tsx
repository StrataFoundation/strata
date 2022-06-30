import { PublicKey } from "@solana/web3.js";
import { ISettings } from "@strata-foundation/chat";
import { useAccount, UseAccountState } from "@strata-foundation/react";
import { useChatSdk } from "../contexts/chatSdk";

export const useSettings = (
  settings: PublicKey | undefined | null
): UseAccountState<ISettings> => {
  const { chatSdk } = useChatSdk();

  return useAccount(settings, chatSdk?.settingsDecoder);
};

