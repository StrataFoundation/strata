import { PublicKey } from "@solana/web3.js";
import { IDelegateWallet } from "@strata-foundation/chat";
import { useAccount, UseAccountState } from "@strata-foundation/react";
import { useChatSdk } from "../contexts/chatSdk";

export const useDelegateWalletStruct = (
  key: PublicKey | undefined | null
): UseAccountState<IDelegateWallet> => {
  const { chatSdk } = useChatSdk();

  return useAccount(key, chatSdk?.delegateWalletDecoder);
};
