import { gql, useLazyQuery } from "@apollo/client";
import { PublicKey } from "@solana/web3.js";
import {
  ChatSdk,
  IMessage,
  IMessagePart,
  MessageType,
  PermissionType,
} from "@strata-foundation/chat";
import { TransactionResponseWithSig } from "@strata-foundation/accelerator";
import { truthy, useTransactions } from "@strata-foundation/react";
import { useEffect, useMemo, useState } from "react";
import { useChatSdk } from "../contexts";
import BN from "bn.js";
import { usePrevious } from "@chakra-ui/react";

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
  vybeMessageParts?: IMessagePart[],
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
    let newParts = vybeMessageParts?.filter(
      (part) => !completedTxs.has(part.txid)
    );
    if (newTxs.length > 0) {
      newParts = (
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
    }
    if ((newParts?.length || 0) > 0) {
      return [
        ...(completedMessages || []),
        ...(await chatSdk.getMessagesFromParts(newParts!)),
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

export function useMessages({
  chat,
  accelerated = true,
  useVybe = true,
  numTransactions = 50,
  vybeQuery = gql`
    query GetMessageParts(
      $chat: String!
      $blockTime: numeric!
      $offset: Int!
      $limit: Int!
    ) {
      strata_strata {
        pid_chatGL6yNgZT2Z3BeMYGcgdMpcBKdmxko4C5UhEX4To {
          message_parts_message_part_event_v_0(
            order_by: { blocktime: desc }
            where: { blocktime: { _lt: $blockTime }, chat: { _eq: $chat } }
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
  `,
}: {
  chat: PublicKey | undefined;
  accelerated?: boolean;
  useVybe?: boolean;
  numTransactions?: number;
  vybeQuery?: any;
}): IUseMessages {
  const { chatSdk } = useChatSdk();
  const prevChat = usePrevious(chat);
  const { transactions, ...rest } = useTransactions({
    address: chat,
    numTransactions,
    subscribe: true,
    accelerated,
    lazy: true,
  });
  const currentTime = useMemo(() => Date.now() / 1000, []);
  const variables = useMemo(() => {
    if (chat) {
      return {
        chat: chat.toBase58(),
        blockTime: currentTime,
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
    if (chat && !prevChat?.equals(chat)) {
      setState({
        messages: [],
        loading: true,
      });
    }
  }, [prevChat, chat]);

  const [{ loading, messages }, setState] = useState<{
    messages: IMessageWithPending[] | undefined;
    loading: boolean;
  }>({
    messages: undefined,
    loading: false,
  });
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (variables && useVybe) {
      loadVybe({
        variables,
        context: {
          clientName: "vybe",
        },
      });
    } else if (chat && !useVybe) {
      rest.fetchMore(numTransactions);
    }
  }, [
    numTransactions,
    useVybe,
    rest.fetchMore,
    loadVybe,
    variables,
    setState,
    rest.fetchMore,
  ]);
  useEffect(() => {
    (async () => {
      if (!rest.loadingInitial && !loadingVybe && chat) {
        try {
          const newMessages = await getMessages(
            chat,
            chatSdk,
            transactions,
            vybeMessageParts,
            prevChat?.equals(chat) ? messages : []
          );
          if (newMessages !== messages) {
            setState({
              loading: false,
              messages: newMessages,
            });
          }
        } catch (e: any) {
          setError(e);
          setState({
            loading: false,
            messages: [],
          });
        }
      }
    })();
  }, [
    messages,
    prevChat,
    loadingVybe,
    chat,
    chatSdk,
    vybeMessageParts,
    transactions,
    setState,
    rest.loadingInitial,
  ]);

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
    loadingMore: loadingVybe || rest.loadingMore,
    loadingInitial: rest.loadingInitial || loading,
    error: rest.error || error,
    messages: messagesWithReactsAndReplies,
  };
}

function getMessageType(d: any): MessageType | undefined {
  if (d.isReact) {
    return MessageType.React;
  } else if (d.isHtml) {
    return MessageType.Html;
  } else if (d.isGify) {
    return MessageType.Gify;
  } else if (d.isImage) {
    return MessageType.Image;
  } else if (d.isText) {
    return MessageType.Text;
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
