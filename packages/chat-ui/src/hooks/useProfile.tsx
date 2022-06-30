import { PublicKey } from "@solana/web3.js";
import { IProfile } from "@strata-foundation/chat";
import { useAccount, UseAccountState } from "@strata-foundation/react";
import { useChatSdk } from "../contexts/chatSdk";

export const useProfile = (
  profile: PublicKey | undefined | null
): UseAccountState<IProfile> => {
  const { chatSdk } = useChatSdk();

  return useAccount(profile, chatSdk?.profileDecoder);
};
