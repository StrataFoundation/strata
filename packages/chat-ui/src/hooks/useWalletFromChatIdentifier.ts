import { useMemo } from "react";
import { useAsync } from "react-async-hook";
import { useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useTokenAccount } from "@strata-foundation/react";
import { useChatSdk } from "../contexts/chatSdk";
import { useCaseInsensitiveMarker } from "./useCaseInsensitiveMarker";

export const useWalletFromChatIdentifier = (
  identifier?: string
): {
  loading: boolean;
  wallet: PublicKey | undefined;
  error?: Error;
} => {
  const { connection } = useConnection();
  const { chatSdk } = useChatSdk();
  const {
    result: namespaces,
    loading: loading1,
    error: error1,
  } = useAsync(
    async (chatSdk: ChatSdk | undefined) =>
      chatSdk ? chatSdk.getNamespaces() : undefined,
    [chatSdk]
  );

  const {
    result: markerKey,
    loading: loading2,
    error: error2,
  } = useAsync(
    async (identifier: string | undefined, chatNamespace: string | undefined) =>
      identifier && chatNamespace
        ? ChatSdk.caseInsensitiveMarkerKey(
            new PublicKey(chatNamespace),
            identifier
          )
        : undefined,
    [identifier, namespaces?.chatNamespace.toBase58()]
  );

  const { info: marker, loading: loading3 } = useCaseInsensitiveMarker(
    markerKey && markerKey[0]
  );

  const {
    result: tokenAccountKey,
    loading: loading4,
    error: error3,
  } = useAsync(
    async (connection: Connection, mint: PublicKey | undefined) => {
      if (mint) {
        const accounts = await connection.getTokenLargestAccounts(mint);
        return accounts.value[0].address;
      }
    },
    [connection, marker?.certificateMint]
  );

  const { info: tokenAccount } = useTokenAccount(tokenAccountKey);

  const wallet = useMemo(() => {
    if (
      tokenAccount &&
      namespaces &&
      !tokenAccount.owner.equals(namespaces.chatNamespace)
    ) {
      return tokenAccount?.owner;
    }
  }, [namespaces, tokenAccount]);

  return {
    loading: loading1 || loading2 || loading3 || loading4,
    wallet,
    error: error1 || error2 || error3,
  };
};
