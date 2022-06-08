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

async function getMessages(
  chatSdk?: ChatSdk,
  txs?: {
    meta?: ConfirmedTransactionMeta | null;
    transaction: { message: Message; signatures: string[] };
    signature: string;
    pending?: boolean;
    blockTime: number | null;
  }[],
  prevMessages?: IMessageWithPending[]
): Promise<IMessageWithPending[]> {
  if (chatSdk && txs) {
    const completedMessages = (prevMessages || []).filter(msg => !msg.pending);
    const completedTxs = new Set(
      Array.from((completedMessages || []).map((msg) => msg.txids).flat())
    );
    const newTxs = txs.filter((tx) => !completedTxs.has(tx.signature));
    if (newTxs.length > 0) {
      const newParts = (
        await Promise.all(
          newTxs.map(
            async ({
              signature: sig,
              transaction,
              pending,
              meta,
              blockTime,
            }) => {
              const found = (
                await chatSdk.getMessagePartsFromInflatedTx({
                  transaction,
                  txid: sig,
                  meta,
                  blockTime,
                })
              ).map((f) => ({ ...f, pending }));

              return found;
            }
          )
        )
      ).flat();
      return [
        ...(completedMessages || []),
        ...(await chatSdk.getDecodedMessagesFromParts(newParts)),
      ]
        .sort((a, b) => a.startBlockTime - b.startBlockTime)
        .map(({ parts, ...rest }) => ({
          ...rest,
          parts,
          // @ts-ignore
          pending: parts.some((p) => p.pending),
        }));
    } else {
      return prevMessages || [];
    }
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
  const { result: messages, loading, error } = useAsync(getMessages, [chatSdk, transactions, messagesStable]);
  useEffect(() => {
    if (messages && messagesStable != messages) {
      setMessagesStable(messages)
    }
  }, [messages])
  return {
    ...rest,
    loadingInitial: rest.loadingInitial || loading,
    error: rest.error || error,
    messages: messagesStable,
  };
}