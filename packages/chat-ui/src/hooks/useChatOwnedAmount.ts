import { PublicKey } from "@solana/web3.js";
import { useCollectionOwnedAmount, useUserOwnedAmount } from "@strata-foundation/react";
import { useChatPermissionsFromChat } from "./useChatPermissionsFromChat";

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

export function useChatOwnedAmount(wallet: PublicKey | undefined, chatKey?: PublicKey | undefined): { loading: boolean; amount?: number } {
  const { info: chatPermissions } = useChatPermissionsFromChat(chatKey);
  const { amount: ownedAmountNft, loading } = useCollectionOwnedAmount(
    chatPermissions?.postPermissionKey
  );
  const ownedAmountToken = useUserOwnedAmount(wallet, chatPermissions?.postPermissionKey);

  return {
    amount:
      Object.keys(chatPermissions?.readPermissionType || {})[0] == "nft"
        ? ownedAmountNft
        : ownedAmountToken,
    loading: loading,
  };
}
