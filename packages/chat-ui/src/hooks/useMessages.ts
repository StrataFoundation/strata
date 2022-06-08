import { ConfirmedTransactionMeta, Message, PublicKey } from "@solana/web3.js";
import { ChatSdk, IMessage } from "@strata-foundation/chat";
import {
  truthy,
  useTransactions,
  TransactionResponseWithSig,
} from "@strata-foundation/react";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [messages, setMessages] = useState<IMessageWithPending[]>();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const newMessages = await getMessages(
          chatSdk, transactions, messages
        )
        setMessages(newMessages);
      } catch (e: any) {
        setError(e)
      } finally {
        setLoading(false)
      }
    })()
  }, [chatSdk, transactions, setMessages])

  return {
    ...rest,
    loadingInitial: rest.loadingInitial || loading,
    error: rest.error || error,
    messages,
  };
}