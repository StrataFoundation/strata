import { ENTRY_SEED, NAMESPACES_PROGRAM_ID } from "@cardinal/namespaces";
import { utils } from "@project-serum/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useAccount, useTokenAccount } from "@strata-foundation/react";
import { useAsync } from "react-async-hook";
import { useChatSdk } from "../contexts";
import { useCaseInsensitiveMarker } from "./useCaseInsensitiveMarker";
import { useProfileKey } from "./useProfileKey";

export function useWalletFromIdentifier(identifier?: string): {
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
        ? ChatSdk.caseInsensitiveMarkerKey(new PublicKey(userNamespace), identifier)
        : undefined,
    [identifier, namespaces?.userNamespace.toBase58()]
  );

  const { info: marker, loading: loading3 } = useCaseInsensitiveMarker(markerKey && markerKey[0])
  const { connection } = useConnection();
  const { result: tokenAccountKey, loading: loading4, error: error3 } = useAsync(async (connection: Connection, mint: PublicKey | undefined) => {
    if (mint) {
      const accounts = await connection.getTokenLargestAccounts(mint);
      return accounts.value[0].address
    }
  }, [connection, marker?.certificateMint])

  const { info: tokenAccount } = useTokenAccount(tokenAccountKey);

  return {
    loading: loading1 || loading2 || loading3 || loading4,
    wallet: tokenAccount?.owner,
    error: error || error2,
  };
}
