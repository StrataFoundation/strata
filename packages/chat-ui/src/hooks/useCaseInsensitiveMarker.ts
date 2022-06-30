import { PublicKey } from "@solana/web3.js";
import { ICaseInsensitiveMarker } from "@strata-foundation/chat";
import { useAccount, UseAccountState } from "@strata-foundation/react";
import { useChatSdk } from "../contexts/chatSdk";

export const useCaseInsensitiveMarker = (
  caseInsensitiveMarker: PublicKey | undefined | null
): UseAccountState<ICaseInsensitiveMarker> => {
  const { chatSdk } = useChatSdk();

  return useAccount(caseInsensitiveMarker, chatSdk?.caseInsensitiveMarkerDecoder);
};
