import { Keypair, PublicKey, SYSVAR_CLOCK_PUBKEY, Transaction } from "@solana/web3.js";
import { Cluster } from "@strata-foundation/accelerator";
import { Accelerator } from "@strata-foundation/accelerator";
import {
  ChatSdk,
  IChat,
  IProfile,
  ISendMessageContent
} from "@strata-foundation/chat";
import {
  useAccelerator, useEndpoint,
  useErrorHandler, useSolanaUnixTime
} from "@strata-foundation/react";
import { sendAndConfirmWithRetry } from "@strata-foundation/spl-utils";
import { useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { useChatSdk } from "../contexts";
import { IMessageWithPending, useChat, useWalletProfile } from "../hooks";
import { useDelegateWallet } from "../hooks/useDelegateWallet";


export interface IUseSendMessageArgs {
  onAddPendingMessage?: (message: IMessageWithPending) => void;
  chatKey?: PublicKey;
}

export interface IUseSendMessageReturn {
  onAddPendingMessage?: (message: IMessageWithPending) => void;
  chatKey?: PublicKey;
  sendMessage(message: ISendMessageContent): Promise<void>;
  error?: Error;
  loading: boolean;
}

async function sendMessage({
  chat,
  profile,
  chatSdk,
  accelerator,
  delegateWalletKeypair,
  cluster,
  onAddPendingMessage,
  message
}: {
  chat: IChat | undefined,
  profile: IProfile | undefined,
  chatSdk: ChatSdk | undefined,
  accelerator: Accelerator | undefined,
  delegateWalletKeypair: Keypair | undefined,
  cluster: string,
  onAddPendingMessage: ((message: IMessageWithPending) => void) | undefined,
  message: ISendMessageContent
}) {
  const chatKey = chat?.publicKey;
  if (delegateWalletKeypair) {
    if (chatSdk && chatKey) {
      const {
        instructions: instructionGroups,
        signers: signerGroups,
        output: { messageId },
      } = await chatSdk.sendMessageInstructions({
        delegateWalletKeypair,
        payer: delegateWalletKeypair.publicKey,
        chat: chatKey,
        message,
        encrypted: cluster !== "localnet",
      });
      const txsAndIds = await Promise.all(
        instructionGroups.map(async (instructions, index) => {
          const tx = new Transaction();
          tx.recentBlockhash = (
            await chatSdk.provider.connection.getRecentBlockhash()
          ).blockhash;
          tx.feePayer = delegateWalletKeypair.publicKey;
          tx.add(...instructions);
          tx.sign(...signerGroups[index]);
          const rawTx = tx.serialize();
          accelerator?.sendTransaction(cluster as Cluster, tx);
          const txid = await chatSdk.provider.connection.sendRawTransaction(
            rawTx,
            {
              skipPreflight: true,
            }
          );
          return {
            txid,
            rawTx,
          };
        })
      );

      const blockTime = Number((await chatSdk.provider.connection.getAccountInfo(
        SYSVAR_CLOCK_PUBKEY
      ))!.data.readBigInt64LE(8 * 4));

      if (onAddPendingMessage) {
        const { fileAttachments, ...rest } = message;
        const content = { ...rest, decryptedAttachments: fileAttachments };

        onAddPendingMessage({
          profileKey: profile!.publicKey,
          id: messageId,
          content: JSON.stringify(content),
          txids: txsAndIds.map(({ txid }) => txid),
          chatKey,
          decodedMessage: content,
          encryptedSymmetricKey: "",
          readPermissionAmount: chat!.defaultReadPermissionAmount,
          startBlockTime: blockTime!,
          endBlockTime: blockTime!,
          parts: [],
          pending: true,
        });
      }

      await Promise.all(
        txsAndIds.map(({ rawTx }) =>
          sendAndConfirmWithRetry(
            chatSdk.provider.connection,
            rawTx,
            {
              skipPreflight: true,
            },
            "confirmed"
          )
        )
      );
    }
  }
}
export function useSendMessage({ chatKey, onAddPendingMessage }: IUseSendMessageArgs): IUseSendMessageReturn {
  const { chatSdk } = useChatSdk();
  const { accelerator } = useAccelerator();
  const { keypair: delegateWalletKeypair } = useDelegateWallet();
  const { info: chat } = useChat(chatKey);
  const { info: profile } = useWalletProfile();
  const { cluster } = useEndpoint();

  const {
    error,
    loading,
    execute,
  } = useAsyncCallback(sendMessage);

  return {
    error,
    sendMessage: (message: ISendMessageContent) =>
      execute({
        chat,
        chatSdk,
        profile,
        accelerator,
        delegateWalletKeypair,
        cluster,
        onAddPendingMessage,
        message,
      }),
    loading,
  };
}