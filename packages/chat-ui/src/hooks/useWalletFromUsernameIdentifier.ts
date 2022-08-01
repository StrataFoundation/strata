import { useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useTokenAccount } from "@strata-foundation/react";
import { useMemo } from "react";
import { useAsync } from "react-async-hook";
import { useChatSdk } from "../contexts/chatSdk";
import { useCaseInsensitiveMarker } from "./useCaseInsensitiveMarker";

export function useWalletFromUsernameIdentifier(identifier?: string): {
  loading: boolean;
  wallet: PublicKey | undefined;
  error?: Error;
} {
  const { chatSdk } = useChatSdk();
  const {
    result: namespaces,
    loading: loading1,
    error,
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
    async (identifier: string | undefined, userNamespace: string | undefined) =>
      identifier && userNamespace
        ? ChatSdk.caseInsensitiveMarkerKey(
            new PublicKey(userNamespace),
            identifier
          )
        : undefined,
    [identifier, namespaces?.userNamespace.toBase58()]
  );

  const { info: marker, loading: loading3 } = useCaseInsensitiveMarker(
    markerKey && markerKey[0]
  );
  const { connection } = useConnection();
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
      !tokenAccount.owner.equals(namespaces.userNamespace)
    ) {
      return tokenAccount?.owner;
    }
  }, [namespaces, tokenAccount]);

  return {
    loading: loading1 || loading2 || loading3 || loading4,
    wallet,
    error: error || error2 || error3,
  };
}
