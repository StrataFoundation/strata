import { usePrevious } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { ChatSdk, IMessage, MessageType } from "@strata-foundation/chat";
import {
  TransactionResponseWithSig,
  truthy,
  useTransactions,
} from "@strata-foundation/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useChatSdk } from "../contexts";

export interface IMessageWithPending extends IMessage {
  pending?: boolean;
}

export interface IMessageWithPendingAndReacts extends IMessage {
  reacts: IMessageWithPending[];
  reply: IMessageWithPending | null;
}

export interface IUseMessages {
  error: Error | undefined;
  hasMore: boolean;
  loadingInitial: boolean;
  loadingMore: boolean;
  messages: IMessageWithPendingAndReacts[] | undefined;
  fetchMore(num: number): void;
  fetchNew(num: number): void;
}

const emptyTx = new Set<string>();

async function getMessages(
  chat: PublicKey,
  chatSdk?: ChatSdk,
  txs?: TransactionResponseWithSig[],
  prevMessages?: IMessageWithPending[]
): Promise<IMessageWithPending[]> {
  if (chatSdk && txs) {
    const completedMessages = (prevMessages || []).filter(
      (msg) => !msg.pending
    );
    const failedTx = new Set(
      Array.from(txs.filter((tx) => tx.meta?.err).map((tx) => tx.signature))
    );
    const completedTxs = new Set([
      ...Array.from((completedMessages || []).map((msg) => msg.txids).flat()),
      ...emptyTx,
    ]);
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
              let found;
              try {
                found = (
                  await chatSdk.getMessagePartsFromInflatedTx({
                    transaction: transaction!,
                    txid: sig,
                    meta,
                    blockTime,
                    chat,
                  })
                ).map((f) => ({ ...f, pending }));
              } catch (e: any) {
                console.warn("Failed to decode message", e);
              }

              if (!found || (found && found.length == 0)) {
                emptyTx.add(sig);
              }

              return found;
            }
          )
        )
      )
        .flat()
        .filter(truthy);
      return [
        ...(completedMessages || []),
        ...(await chatSdk.getMessagesFromParts(newParts)),
      ]
        .filter((msg) => msg.txids.every((txid) => !failedTx.has(txid)))
        .sort((a, b) => b.startBlockTime - a.startBlockTime)
        .map((message) => {
          // @ts-ignore
          message.pending = message.parts.some((p) => p.pending);
          return message;
        });
    } else {
      return prevMessages || [];
    }
  }

  return [];
}

// Only change the identity of message.reacts if the number of reacts has increased on a message
// chat -> message id -> number of reacts
let cachedReacts: Record<string, Record<string, IMessageWithPending[]>> = {};

export function useMessages(
  chat: PublicKey | undefined,
  accelerated: boolean = true,
  numTransactions: number = 50
): IUseMessages {
  const { chatSdk } = useChatSdk();
  const { transactions, ...rest } = useTransactions({
    address: chat,
    numTransactions,
    subscribe: true,
    accelerated,
  });

  const [{ error, loading, messages }, setState] = useState<{
    error: Error | undefined;
    messages: IMessageWithPending[] | undefined;
    loading: boolean;
  }>({
    error: undefined,
    messages: undefined,
    loading: false,
  });

  const chatB58 = chat?.toBase58();

  const handleGetNewMessages = useCallback(async () => {
    if (chat) {
      if (!rest.loadingInitial) {
        try {
          const newMessages = await getMessages(
            chat,
            chatSdk,
            transactions,
            messages
          );
          setState({
            loading: false,
            messages: newMessages,
            error: undefined,
          });
        } catch (e: any) {
          setState({ error: e, loading: false, messages: [] });
        }
      }
    }
  }, [transactions, setState]);

  useEffect(() => {
    setState({
      loading: true,
      messages: [],
      error: undefined,
    });
  }, [chatB58]);

  useEffect(() => {
    (async () => {
      await handleGetNewMessages();
    })();
  }, [chatSdk, handleGetNewMessages]);

  // Group by and pull off reaction and reply messages
  const messagesWithReactsAndReplies = useMemo(() => {
    if (!messages) {
      return undefined;
    }

    const reacts = messages.reduce((acc, msg) => {
      if (msg && msg.type === MessageType.React && msg.referenceMessageId) {
        if (!acc[msg.referenceMessageId]) {
          acc[msg.referenceMessageId] = [];
        }

        acc[msg.referenceMessageId].push(msg);
      }

      return acc;
    }, {} as Record<string, IMessageWithPending[]>);

    const messagesById = messages.reduce((acc, msg) => {
      if (msg && msg.type !== MessageType.React) {
        if (!acc[msg.id]) {
          acc[msg.id] = msg;
        }
      }

      return acc;
    }, {} as Record<string, IMessageWithPending>);

    // Don't change identity of reacts array if the number of reacts has not increased
    let cachedReactsLocal: Record<string, IMessageWithPending[]> = {};
    if (chat) {
      cachedReacts[chat.toBase58()] = cachedReacts[chat.toBase58()] || {};
      cachedReactsLocal = cachedReacts[chat.toBase58()];
    }

    return messages
      .filter((msg) => msg.type !== MessageType.React)
      .map((message) => {
        cachedReactsLocal[message.id] = cachedReactsLocal[message.id] || [];
        if (
          cachedReactsLocal[message.id].length != reacts[message.id]?.length
        ) {
          cachedReactsLocal[message.id] = reacts[message.id];
        }

        return {
          ...message,
          reacts: cachedReactsLocal[message.id],
          reply: message.referenceMessageId
            ? messagesById[message.referenceMessageId]
            : null,
        };
      });
  }, [chat, messages]);

  return {
    ...rest,
    loadingInitial: rest.loadingInitial || loading,
    error: rest.error || error,
    messages: messagesWithReactsAndReplies,
  };
}
