import { PublicKey } from "@solana/web3.js";
import { ChatSdk, IMessage } from "@strata-foundation/chat";
import { useTransactions } from "@strata-foundation/react";
import { useMemo } from "react";
import { useAsync } from "react-async-hook";
import { useChatSdk } from "../contexts";

interface IUseMessages {
  error: Error | undefined;
  loadingInitial: boolean;
  loadingMore: boolean;
  messages: IMessage[] | undefined;
  fetchMore(num: number): void;
  fetchNew(num: number): void;
}

const seen: Record<string, IMessage[]> = {};

async function getMessages(chatSdk?: ChatSdk, signatures?: string[]): Promise<IMessage[]> {
  if (chatSdk && signatures) {
    return (await Promise.all(signatures.map(async (sig) => {
      if (seen[sig]) {
        return seen[sig]
      }
      const found = await chatSdk.getMessagesFromTx(sig);
      seen[sig] = found;
      return found;
    }))).flat()
  }

  return []
}

export function useMessages(chat: PublicKey | undefined): IUseMessages {
  const { chatSdk } = useChatSdk();
  const { transactions, ...rest } = useTransactions({
    address: chat,
    numTransactions: 50,
    subscribe: true
  });
  const signatures = useMemo(() => transactions.map(t => t.signature), [transactions]);
  const { result: messages, loading, error } = useAsync(getMessages, [chatSdk, signatures])

  return {
    ...rest,
    loadingInitial: rest.loadingInitial || loading,
    error: rest.error || error,
    messages,
  };
}