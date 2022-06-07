import { ConfirmedTransactionMeta, Message, PublicKey } from "@solana/web3.js";
import { ChatSdk, IMessage } from "@strata-foundation/chat";
import { useTransactions } from "@strata-foundation/react";
import { useEffect, useMemo, useState } from "react";
import { useAsync } from "react-async-hook";
import { useChatSdk } from "../contexts";

export interface IMessageWithPending extends IMessage {
  pending?: boolean;
}

interface IUseMessages {
  error: Error | undefined;
  loadingInitial: boolean;
  loadingMore: boolean;
  messages: IMessageWithPending[] | undefined;
  fetchMore(num: number): void;
  fetchNew(num: number): void;
}

const seen: Record<string, IMessageWithPending[]> = {};

async function getMessages(
  chatSdk?: ChatSdk,
  txs?: {
    meta?: ConfirmedTransactionMeta | null;
    transaction: { message: Message; signatures: string[] };
    signature: string;
    pending?: boolean;
    blockTime: number | null;
  }[]
): Promise<IMessageWithPending[]> {
  if (chatSdk && txs) {
    return (
      await Promise.all(
        txs.map(
          async ({ signature: sig, transaction, pending, meta, blockTime }) => {
            if (seen[sig + Boolean(pending).toString()]) {
              return seen[sig + Boolean(pending).toString()];
            }
            const found = (
              await chatSdk.getMessagesFromInflatedTx({
                transaction,
                txid: sig,
                meta,
                blockTime,
              })
            ).map((f) => ({ ...f, pending }));
            seen[sig + Boolean(pending).toString()] = found;

            return found;
          }
        )
      )
    ).flat();
  }

  return [];
}

export function useMessages(chat: PublicKey | undefined, accelerated: boolean = true): IUseMessages {
  const { chatSdk } = useChatSdk();
  const { transactions, ...rest } = useTransactions({
    address: chat,
    numTransactions: 25,
    subscribe: true,
    accelerated
  });
  // For a stable messages array that doesn't go undefined when we do the next
  // useAsync fetch
  const [messagesStable, setMessagesStable] = useState<IMessageWithPending[]>();
  const { result: messages, loading, error } = useAsync(getMessages, [chatSdk, transactions]);
  useEffect(() => {
    if (messages) {
      setMessagesStable([...messages].reverse())
    }
  }, [messages])
  return {
    ...rest,
    loadingInitial: rest.loadingInitial || loading,
    error: rest.error || error,
    messages: messagesStable,
  };
}