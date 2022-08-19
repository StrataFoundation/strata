import { PublicKey } from "@solana/web3.js";
import { TransactionResponseWithSig } from "@strata-foundation/accelerator";
import {
  ChatSdk,
  IMessage,
  IMessagePart,
  MessageType,
} from "@strata-foundation/chat";
import {
  truthy,
  useEndpoint,
  usePublicKey,
  useTransactions,
} from "@strata-foundation/react";
import BN from "bn.js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAsync, useAsyncCallback } from "react-async-hook";
import { useChatSdk } from "../contexts/chatSdk";
import { useChat } from "./useChat";

export interface IMessageWithPending extends IMessage {
  pending?: boolean;
}

export interface IMessageWithPendingAndReacts extends IMessage {
  reacts: IMessageWithPending[];
  reply: IMessageWithPending | null;
}

export interface IUseMessagesState {
  error: Error | undefined;
  loading: boolean;
  messages: IMessageWithPending[] | undefined;
}

export interface IUseMessages {
  error: Error | undefined;
  hasMore: boolean;
  loadingInitial: boolean;
  loadingMore: boolean;
  messages: IMessageWithPendingAndReacts[] | undefined;
  fetchMore(num: number): Promise<void>;
  fetchNew(num: number): Promise<void>;
}

const txToMessages: Record<string, IMessagePart[]> = {};

async function getMessagesFromTxs(
  chat?: PublicKey,
  chatSdk?: ChatSdk,
  txs: TransactionResponseWithSig[] = []
): Promise<IMessageWithPending[]> {
  if (chat && chatSdk) {
    const failedTx = new Set(
      Array.from(txs.filter((tx) => tx.meta?.err).map((tx) => tx.signature))
    );
    const newParts = (
      await Promise.all(
        txs.map(
          async ({
            logs,
            signature: sig,
            transaction,
            pending,
            meta,
            blockTime,
          }) => {
            if (
              !txToMessages[sig] ||
              txToMessages[sig].length == 0 ||
              // @ts-ignore
              (txToMessages[sig][0].pending && !pending)
            ) {
              try {
                const found = (
                  await chatSdk.getMessagePartsFromInflatedTx({
                    logs,
                    transaction,
                    txid: sig,
                    meta,
                    blockTime,
                    chat,
                  })
                ).map((f) => ({ ...f, pending }));
                txToMessages[sig] = found;
              } catch (e: any) {
                console.warn("Failed to decode message", e);
              }
            }

            return txToMessages[sig];
          }
        )
      )
    )
      .flat()
      .filter(truthy);

    return [...(await chatSdk.getMessagesFromParts(newParts))]
      .filter((msg) => msg.txids.every((txid) => !failedTx.has(txid)))
      .map((message) => {
        // @ts-ignore
        message.pending = message.parts.some((p) => p.pending);
        return message;
      });
  }

  return [];
}

// Only change the identity of message.reacts if the number of reacts has increased on a message
// chat -> message id -> number of reacts
let cachedReacts: Record<string, Record<string, IMessageWithPending[]>> = {};

function setDifference(a: Set<string>, b: Set<string>): Set<string> {
  return new Set(Array.from(a).filter((item) => !b.has(item)));
}
const mergeMessages = (
  chatSdk: ChatSdk,
  message1: IMessageWithPending,
  message2: IMessageWithPending
) => {
  const pending = message1.pending && message2.pending;
  if (message2.complete) {
    if (message2.pending != pending) {
      return { ...message2, pending };
    }
    return message2;
  }

  if (message1.complete) {
    message1.pending = pending;
    if (message1.pending != pending) {
      return { ...message1, pending };
    }

    return message1;
  }

  // If new parts not found
  if (
    setDifference(new Set(message1.txids), new Set(message2.txids)).size == 0
  ) {
    if (message1.pending) {
      return message2;
    }

    return message2;
  }

  const set = new Set();
  const allParts = message1.parts.concat(...message2.parts);
  const nonPendingParts = new Set(
    // @ts-ignore
    allParts.filter((p) => !p.pending).map((p) => p.txid)
  );

  return chatSdk.getMessageFromParts(
    allParts.filter((part) => {
      // Prefer non pending complete ones over pending incompletes
      // @ts-ignore
      if (part.pending && nonPendingParts.has(part.txid)) {
        return false;
      }

      if (set.has(part.txid)) {
        return false;
      }
      set.add(part.txid);
      return true;
    })
  );
};

const reduceMessages = (
  chatSdk: ChatSdk,
  messageState: Record<string, IMessageWithPending>,
  messages: IMessageWithPending[]
): Record<string, IMessageWithPending> => {
  return messages.reduce(
    (acc, message) => {
      const existing = acc[message.id];
      if (existing) {
        acc[message.id] = mergeMessages(chatSdk, message, existing)!;
      } else {
        acc[message.id] = message;
      }

      return acc;
    },
    { ...messageState }
  );
};

export type FetchArgs = {
  minBlockTime: number;
  maxBlockTime: number;
  chat: PublicKey;
  limit: number;
  offset: number;
};
export type Fetcher = (args: FetchArgs) => Promise<IMessagePart[]>;

export const MESSAGE_LAMBDA = "https://prod-api.teamwumbo.com/messages";
const lambdaFetcher = async (args: FetchArgs) => {
  const res = await fetch(`${MESSAGE_LAMBDA}`, {
    body: JSON.stringify(args),
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
    },
  });
  const rows = await res.json();

  return rows.map(
    (d: any) =>
      ({
        ...d,
        blockTime: Number(d.blocktime),
        readPermissionAmount: new BN(d.readPermissionAmount),
        readPermissionKey: new PublicKey(d.readPermissionKey),
        sender: new PublicKey(d.sender),
        signer: new PublicKey(d.signer),
        chat: new PublicKey(d.chat),
        chatKey: new PublicKey(d.chat),
        pending: false,
        totalParts: Number(d.totalParts),
        currentPart: Number(d.currentPart),
      } as IMessagePart[])
  );
};

export function useMessages({
  chat,
  accelerated,
  numTransactions = 50,
  fetcher,
}: {
  chat: PublicKey | undefined;
  accelerated?: boolean;
  numTransactions?: number;
  fetcher?: Fetcher | null;
}): IUseMessages {
  const { chatSdk } = useChatSdk();
  if (typeof accelerated === "undefined") {
    accelerated = true;
  }
  const { info: chatAcc } = useChat(chat);
  const { cluster } = useEndpoint();
  let useFetcher = !!fetcher;
  const canUseFetcher =
    cluster === "mainnet-beta" &&
    (chatAcc?.postMessageProgramId.equals(ChatSdk.ID) || fetcher);
  if (canUseFetcher && typeof fetcher === "undefined") {
    useFetcher = true;
    fetcher = lambdaFetcher;
  }

  const [rawMessages, setRawMessages] = useState<
    Record<string, IMessageWithPending>
  >({});

  const { transactions, loadingInitial, ...rest } = useTransactions({
    address: chat,
    numTransactions,
    subscribe: true,
    lazy: true,
    accelerated,
  });

  const stablePubkey = usePublicKey(chat?.toBase58());
  // Clear messages when chat changes
  useEffect(() => {
    if (stablePubkey) {
      setRawMessages((messages) => {
        return Object.fromEntries(
          Object.entries(messages).filter((entry) => {
            return entry[1].chatKey && entry[1].chatKey.equals(stablePubkey);
          })
        );
      });
    }
  }, [stablePubkey]);

  const variables = useMemo(() => {
    if (chat) {
      const currentTime = Date.now() / 1000;

      return {
        chat: chat.toBase58(),
        minBlockTime: 0,
        maxBlockTime: currentTime,
        offset: 0,
        limit: numTransactions,
      };
    }
  }, [chat, numTransactions]);

  const fetchFn = useCallback(
    async (args: any) => (fetcher ? fetcher(args) : Promise.resolve([])),
    [fetcher]
  );
  const {
    loading: fetchLoading,
    result: fetchedMessageParts,
    error: fetchError,
    execute: runFetch,
  } = useAsyncCallback(fetchFn);

  useEffect(() => {
    if (chatSdk && fetchedMessageParts) {
      setRawMessages((rawMessages) => {
        const messages = chatSdk.getMessagesFromParts(fetchedMessageParts);
        return reduceMessages(chatSdk, rawMessages, messages);
      });
    }
  }, [fetchedMessageParts, chatSdk]);

  const {
    result: txMessages,
    loading,
    error,
  } = useAsync(getMessagesFromTxs, [stablePubkey, chatSdk, transactions]);

  useEffect(() => {
    if (chatSdk && txMessages) {
      setRawMessages((rawMessages) => {
        return reduceMessages(chatSdk, rawMessages, txMessages);
      });
    }
  }, [txMessages, chatSdk]);

  useEffect(() => {
    if (variables && useFetcher) {
      runFetch(variables);
    } else if (stablePubkey && !useFetcher && chatAcc) {
      rest.fetchMore(numTransactions);
    }
  }, [
    chatAcc,
    numTransactions,
    useFetcher,
    runFetch,
    variables,
    rest.fetchMore,
    stablePubkey,
  ]);

  const messages = useMemo(
    () =>
      Object.values(rawMessages).sort(
        (a, b) => b.startBlockTime - a.startBlockTime
      ),
    [rawMessages]
  );
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
      .filter(
        (msg) => msg.type !== MessageType.React && msg.chatKey.equals(chat)
      )
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
  }, [stablePubkey, messages]);

  return {
    ...rest,
    hasMore: Boolean(
      useFetcher
        ? messages.length > 0 &&
            fetchedMessageParts &&
            fetchedMessageParts.length >= numTransactions
        : rest.hasMore
    ),
    fetchMore: useFetcher
      ? async (num) => {
          await runFetch({
            ...variables,
            limit: num,
            maxBlockTime:
              fetchedMessageParts &&
              fetchedMessageParts[fetchedMessageParts.length - 1] &&
              fetchedMessageParts[fetchedMessageParts.length - 1].blockTime,
          });
        }
      : rest.fetchMore,
    fetchNew: useFetcher
      ? async (num) => {
          await runFetch({
            ...variables,
            limit: num,
            maxBlockTime: new Date().valueOf() / 1000,
            minBlockTime:
              fetchedMessageParts && fetchedMessageParts[0]
                ? fetchedMessageParts[0].blockTime
                : 0,
          });
        }
      : rest.fetchNew,
    loadingInitial:
      loadingInitial || (useFetcher && !fetchedMessageParts && !fetchLoading),
    loadingMore: loading || fetchLoading || rest.loadingMore,
    error: rest.error || error || fetchError,
    messages: messagesWithReactsAndReplies,
  };
}
