import { usePrevious } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import {
  ChatSdk,
  IMessage,
  MessageType,
  ReactMessage
} from "@strata-foundation/chat";
import {
  TransactionResponseWithSig, truthy, useMint, useOwnedAmount, useTransactions
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-utils";
import { useEffect, useMemo, useState } from "react";
import { useChatSdk } from "../contexts";
import { useChat } from "./useChat";

export interface IMessageWithPending extends IMessage {
  pending?: boolean;
}

export interface IMessageWithPendingAndReacts extends IMessage {
  reacts: IMessageWithPending[];
}

interface IUseMessages {
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
        ...(await chatSdk.getDecodedMessagesFromParts(newParts)),
      ]
        .filter((msg) => msg.txids.every((txid) => !failedTx.has(txid)))
        .sort((a, b) => b.startBlockTime - a.startBlockTime)
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

export function useMessages(
  chat: PublicKey | undefined,
  accelerated: boolean = true
): IUseMessages {
  const { chatSdk } = useChatSdk();
  const { transactions, ...rest } = useTransactions({
    address: chat,
    numTransactions: 50,
    subscribe: true,
    accelerated,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [messages, setMessages] = useState<IMessageWithPending[]>();

  const { info: chatAcc } = useChat(chat);
  const ownedAmount = useOwnedAmount(chatAcc?.readPermissionKey);
  const mint = useMint(chatAcc?.readPermissionKey);
  const readAmountNum = chatAcc && mint && toNumber(chatAcc.defaultReadPermissionAmount, mint)
  const previousOwnedAmount = usePrevious(ownedAmount)

  useEffect(() => {
    if (
      typeof previousOwnedAmount !== "undefined" &&
      typeof readAmountNum !== "undefined" &&
      typeof ownedAmount !== "undefined"
    ) {
      if (previousOwnedAmount < readAmountNum && ownedAmount >= readAmountNum) {
        console.log("Ownership changed, attempting to unlock messages");
        setLoading(true);
        (async () => {
          const newMessages = await getMessages(chatSdk, transactions);
          setMessages(newMessages);
        })();
      }
    }
  }, [previousOwnedAmount, readAmountNum, ownedAmount, previousOwnedAmount]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const newMessages = await getMessages(chatSdk, transactions, messages);
        setMessages(newMessages);
      } catch (e: any) {
        setError(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [chatSdk, transactions, setMessages]);

  // Group by and pull off reaction messages
  const messagesWithReacts = useMemo(() => {
    if (!messages) {
      return undefined;
    }
    // Don't allow the same react from one person more than once
    const seen = new Set<string>();
    const reacts = messages.reduce((acc, msg) => {
      if (msg?.decodedMessage?.type === MessageType.React) {
        const reactMessage = msg.decodedMessage as ReactMessage;
        if (!acc[reactMessage.referenceMessageId]) {
          acc[reactMessage.referenceMessageId] = [];
        }
        const seenKey =
          msg.profileKey?.toBase58() +
          reactMessage.referenceMessageId +
          reactMessage.emoji;
        if (!seen.has(seenKey)) {
          seen.add(seenKey);
          acc[reactMessage.referenceMessageId].push(msg);
        }
      }

      return acc;
    }, {} as Record<string, IMessageWithPending[]>);

    return messages
      .filter((msg) => msg?.decodedMessage?.type !== MessageType.React)
      .map((message) => ({
        ...message,
        reacts: reacts[message.id] || [],
      }));
  }, [messages]);

  return {
    ...rest,
    loadingInitial: rest.loadingInitial || loading,
    error: rest.error || error,
    messages: messagesWithReacts,
  };
}
