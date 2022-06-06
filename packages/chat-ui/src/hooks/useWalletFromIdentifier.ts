import { ENTRY_SEED, NAMESPACES_PROGRAM_ID } from "@cardinal/namespaces";
import { utils } from "@project-serum/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useAccount, useTokenAccount } from "@strata-foundation/react";
import { useAsync } from "react-async-hook";
import { useChatSdk } from "../contexts";
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
    result: entryKey,
    loading: loading2,
    error: error2,
  } = useAsync(
    async (identifier: string | undefined, userNamespace: string | undefined) =>
      identifier && userNamespace
        ? PublicKey.findProgramAddress(
            [
              utils.bytes.utf8.encode(ENTRY_SEED),
              new PublicKey(userNamespace).toBytes(),
              utils.bytes.utf8.encode(identifier),
            ],
            NAMESPACES_PROGRAM_ID
          )
        : undefined,
    [identifier, namespaces?.userNamespace.toBase58()]
  );

  const { info: entry, loading: loading3 } = useAccount(
    entryKey ? entryKey[0] : undefined,
    chatSdk?.entryDecoder
  );
  const { connection } = useConnection();
  const { result: tokenAccountKey, loading: loading4, error: error3 } = useAsync(async (connection: Connection, mint: PublicKey | undefined) => {
    if (mint) {
      const accounts = await connection.getTokenLargestAccounts(mint);
      return accounts.value[0].address
    }
  }, [connection, entry?.mint])

  const { info: tokenAccount } = useTokenAccount(tokenAccountKey);

  return {
    loading: loading1 || loading2 || loading3 || loading4,
    wallet: tokenAccount?.owner,
    error: error || error2,
  };
}
