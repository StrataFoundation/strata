import { PublicKey } from "@solana/web3.js";
import { useCollectionOwnedAmount, useOwnedAmount } from "@strata-foundation/react";
import { useChat } from "./useChat";

function max(
  one: number | undefined,
  two: number | undefined
): number | undefined {
  const oneDefined = typeof one !== "undefined";
  const twoDefined = typeof two !== "undefined";
  if (oneDefined) {
    if (twoDefined) {
      return Math.max(one!, two!);
    } else {
      return one;
    }
  } else if (twoDefined) {
    return two;
  }
}

export function useChatOwnedAmount(chatKey?: PublicKey): { loading: boolean; amount?: number } {
  const { info: chat } = useChat(chatKey);
  const { amount: ownedAmountNft, loading } = useCollectionOwnedAmount(
    chat?.postPermissionKey
  );
  const ownedAmountToken = useOwnedAmount(chat?.postPermissionKey);

  return {
    amount:
      Object.keys(chat?.readPermissionType || {})[0] == "token"
        ? ownedAmountToken
        : ownedAmountNft,
    loading: loading,
  };
}
