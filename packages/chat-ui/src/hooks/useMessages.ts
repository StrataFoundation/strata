import { gql, useLazyQuery } from "@apollo/client";
import { PublicKey } from "@solana/web3.js";
import { TransactionResponseWithSig } from "@strata-foundation/accelerator";
import {
  ChatSdk,
  IMessage,
  IMessagePart,
  MessageType, PermissionType, RawMessageType
} from "@strata-foundation/chat";
import {
  truthy,
  useEndpoint,
  usePublicKey,
  useTransactions
} from "@strata-foundation/react";
import BN from "bn.js";
import { useEffect, useMemo, useState } from "react";
import { useAsync } from "react-async-hook";
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
          async ({ signature: sig, transaction, pending, meta, blockTime }) => {
            if (
              !txToMessages[sig] ||
              // @ts-ignore
              (txToMessages[sig][0].pending && !pending)
            ) {
              try {
                const found = (
                  await chatSdk.getMessagePartsFromInflatedTx({
                    transaction: transaction!,
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

export function useMessages({
  chat,
  accelerated,
  numTransactions = 50,
  useVybe,
  vybeQuery,
}: {
  chat: PublicKey | undefined;
  accelerated?: boolean;
  numTransactions?: number;
  useVybe?: boolean;
  vybeQuery?: any;
}): IUseMessages {
  const { chatSdk } = useChatSdk();
  if (typeof accelerated === "undefined") {
    accelerated = true;
  }
  const { info: chatAcc } = useChat(chat);
  const { cluster } = useEndpoint();
  const canUseVybe = cluster === "mainnet-beta" && (chatAcc?.postMessageProgramId.equals(ChatSdk.ID) || vybeQuery);
  if (!canUseVybe) {
    useVybe = false
  }
  if (typeof useVybe === "undefined") {
    useVybe = true;
  }

  const [rawMessages, setRawMessages] = useState<
    Record<string, IMessageWithPending>
  >({});

  if (!vybeQuery) {
    vybeQuery = gql`
      query GetMessageParts(
        $chat: String!
        $maxBlockTime: numeric!
        $minBlockTime: numeric!
        $offset: Int!
        $limit: Int!
      ) {
        strata_strata {
          pid_chatGL6yNgZT2Z3BeMYGcgdMpcBKdmxko4C5UhEX4To {
            message_parts_message_part_event_v_0(
              order_by: { blocktime: desc }
              where: {
                blocktime: { _lt: $maxBlockTime, _gt: $minBlockTime }
                chat: { _eq: $chat }
              }
              offset: $offset
              limit: $limit
            ) {
              blockTime: blocktime
              id: id_1
              isReact: messageType(path: "react")
              isText: messageType(path: "text")
              isGify: messageType(path: "gify")
              isImage: messageType(path: "image")
              isHtml: messageType(path: "html")
              readPermissionAmount
              readPermissionKey
              referenceMessageId
              sender
              txid: signature
              totalParts
              signer
              readPermissionTypeIsNative: readPermissionType(path: "native")
              readPermissionTypeIsToken: readPermissionType(path: "token")
              readPermissionTypeIsNft: readPermissionType(path: "nft")
              postPermissionTypeIsNative: readPermissionType(path: "native")
              postPermissionTypeIsToken: readPermissionType(path: "token")
              postPermissionTypeIsNft: readPermissionType(path: "nft")
              currentPart
              encryptedSymmetricKey
              conditionVersion
              content
              chat
              blocktime
            }
          }
        }
      }
    `;
  }
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

  const currentTime = useMemo(() => Date.now() / 1000, []);
  const variables = useMemo(() => {
    if (chat) {
      return {
        chat: chat.toBase58(),
        minBlockTime: 0,
        maxBlockTime: currentTime,
        offset: 0,
        limit: numTransactions,
      };
    }
  }, [currentTime, chat, numTransactions]);
  const [loadVybe, { loading: loadingVybe, data: vybeData }] =
    useLazyQuery<any>(vybeQuery, {
      variables,
      context: {
        clientName: "vybe",
      },
    });
  const vybeMessageParts = useMemo(
    () =>
      vybeData?.strata_strata[0].pid_chatGL6yNgZT2Z3BeMYGcgdMpcBKdmxko4C5UhEX4To.message_parts_message_part_event_v_0.map(
        (d: any) => 
          ({
            ...d,
            readPermissionAmount: new BN(d.readPermissionAmount),
            readPermissionKey: new PublicKey(d.readPermissionKey),
            sender: new PublicKey(d.sender),
            signer: new PublicKey(d.signer),
            chat: new PublicKey(d.chat),
            pending: false,
            messageType: getMessageType(d),
            readPermissionType: getPermissionType("read", d),
          } as IMessagePart[])
      ),
    [vybeData]
  );
  
  useEffect(() => {
    if (chatSdk && vybeMessageParts) {
      setRawMessages((rawMessages) => {
        const messages = chatSdk.getMessagesFromParts(vybeMessageParts);
        return reduceMessages(chatSdk, rawMessages, messages);
      });
    }
  }, [vybeMessageParts, chatSdk]);

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
    if (variables && useVybe) {
      loadVybe({
        variables,
        context: {
          clientName: "vybe",
        },
      });
    } else if (stablePubkey && !useVybe) {
      rest.fetchMore(numTransactions);
    }
  }, [
    numTransactions,
    useVybe,
    rest.fetchMore,
    loadVybe,
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
  }, [stablePubkey, messages]);

  return {
    ...rest,
    hasMore: useVybe
      ? messages.length > 0 && vybeMessageParts && vybeMessageParts.length >= numTransactions
      : rest.hasMore,
    fetchMore: useVybe
      ? async(num) => {
          await loadVybe({
            variables: {
              ...variables,
              limit: num,
              maxBlockTime:
                vybeMessageParts[vybeMessageParts.length - 1] &&
                vybeMessageParts[vybeMessageParts.length - 1].blockTime,
            },
          })
      }
      : rest.fetchMore,
    fetchNew: useVybe
      ? async (num) => {
          await loadVybe({
            variables: {
              ...variables,
              limit: num,
              maxBlockTime: new Date().valueOf() / 1000,
              minBlockTime:
                vybeMessageParts[0] ? vybeMessageParts[0].blockTime : 0,
            },
          });
        }
      : rest.fetchNew,
    loadingInitial: loadingInitial || (useVybe && !vybeData && !loadingVybe),
    loadingMore: loading || loadingVybe || rest.loadingMore,
    error: rest.error || error,
    messages: messagesWithReactsAndReplies,
  };
}

function getMessageType(d: any): RawMessageType | undefined {
  if (d.isReact) {
    return RawMessageType.React;
  } else if (d.isHtml) {
    return RawMessageType.Html;
  } else if (d.isGify) {
    return RawMessageType.Gify;
  } else if (d.isImage) {
    return RawMessageType.Image;
  } else if (d.isText) {
    return RawMessageType.Text;
  }
}

function getPermissionType(type: string, d: any): PermissionType | undefined {
  if (d[type + "PermissionTypeIsNft"]) {
    return PermissionType.NFT;
  } else if (d[type + "PermissionTypeIsNative"]) {
    return PermissionType.Native;
  } else if (d[type + "PermissionTypeIsToken"]) {
    return PermissionType.Token;
  }
}
