import {
  Keypair,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
} from "@solana/web3.js";
import React from "react";
import { Accelerator, Cluster } from "@strata-foundation/accelerator";
import {
  ChatSdk,
  ISendMessageContent,
  PermissionType,
} from "@strata-foundation/chat";
import {
  useAccelerator,
  useCollectionOwnedAmount,
  useEndpoint,
} from "@strata-foundation/react";
import { sendAndConfirmWithRetry } from "@strata-foundation/spl-utils";
import BN from "bn.js";
import { createContext, FC, useContext } from "react";
import { useAsyncCallback } from "react-async-hook";
import { useChatSdk } from "../contexts/chatSdk";
import { useChat } from "../hooks/useChat";
import { useDelegateWallet } from "../hooks/useDelegateWallet";
import { useChatPermissionsFromChat } from "../hooks/useChatPermissionsFromChat";
import { IMessageWithPending } from "../hooks/useMessages";

export interface IUseSendMessageArgs {
  chatKey?: PublicKey;
}

export interface IUseSendMessageReturn {
  onAddPendingMessage?: (message: IMessageWithPending) => void;
  chatKey?: PublicKey;
  sendMessage(args: {
    message: ISendMessageContent;
    readPermissionKey?: PublicKey;
    readPermissionAmount?: BN;
    readPermissionType?: PermissionType;
    onAddPendingMessage?: (message: IMessageWithPending) => void;
  }): Promise<void>;
  error?: Error;
  loading: boolean;
}

async function sendMessage({
  chatKey,
  chatSdk,
  accelerator,
  delegateWalletKeypair,
  cluster,
  onAddPendingMessage,
  message,
  nftMint,
  readPermissionAmount,
  readPermissionKey,
  readPermissionType,
}: {
  chatKey: PublicKey | undefined;
  chatSdk: ChatSdk | undefined;
  accelerator: Accelerator | undefined;
  delegateWalletKeypair: Keypair | undefined;
  cluster: string;
  onAddPendingMessage: ((message: IMessageWithPending) => void) | undefined;
  message: ISendMessageContent;
  nftMint?: PublicKey;
  readPermissionKey: PublicKey;
  readPermissionAmount: BN;
  readPermissionType: PermissionType;
}) {
  if (chatSdk && chatKey) {
    const payer = delegateWalletKeypair?.publicKey || chatSdk.wallet.publicKey;
    const {
      instructions: instructionGroups,
      signers: signerGroups,
      output: { messageId },
    } = await chatSdk.sendMessageInstructions({
      readPermissionAmount,
      readPermissionKey,
      readPermissionType,
      nftMint,
      delegateWalletKeypair,
      payer,
      chat: chatKey,
      message,
      encrypted: cluster !== "localnet",
    });
    const txsAndIds = await Promise.all(
      instructionGroups.map(async (instructions, index) => {
        const tx = new Transaction();
        tx.recentBlockhash = (
          await chatSdk.provider.connection.getLatestBlockhash()
        ).blockhash;
        tx.feePayer = payer;
        tx.add(...instructions);
        if (signerGroups[index].length > 0) tx.sign(...signerGroups[index]);
        if (!delegateWalletKeypair) {
          await chatSdk.provider.wallet.signTransaction(tx);
        }
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

    const blockTime = Number(
      (await chatSdk.provider.connection.getAccountInfo(
        SYSVAR_CLOCK_PUBKEY,
        "processed"
        //@ts-ignore
      ))!.data.readBigInt64LE(8 * 4)
    );

    if (onAddPendingMessage) {
      const { fileAttachments, ...rest } = message;
      const content = { ...rest, decryptedAttachments: fileAttachments };

      onAddPendingMessage({
        complete: true,
        type: content.type,
        sender: chatSdk.wallet.publicKey,
        id: messageId,
        content: JSON.stringify(content),
        txids: txsAndIds.map(({ txid }) => txid),
        chatKey,
        getDecodedMessage: () => Promise.resolve(content),
        encryptedSymmetricKey: "",
        readPermissionKey,
        readPermissionAmount,
        readPermissionType,
        startBlockTime: blockTime!,
        endBlockTime: blockTime!,
        parts: [],
        pending: true,
        referenceMessageId: content.referenceMessageId || null,
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
export function useStrataSendMessage({
  chatKey,
}: IUseSendMessageArgs): IUseSendMessageReturn {
  const { chatSdk } = useChatSdk();
  const { accelerator } = useAccelerator();
  const { keypair: delegateWalletKeypair } = useDelegateWallet();
  const { info: chat } = useChat(chatKey);
  const { cluster } = useEndpoint();
  const { info: chatPermissions } = useChatPermissionsFromChat(chatKey);
  const { matches } = useCollectionOwnedAmount(
    chatPermissions?.postPermissionKey
  );

  const { error, loading, execute } = useAsyncCallback(sendMessage);

  return {
    error,
    sendMessage: ({
      message,
      onAddPendingMessage,
      readPermissionKey = chatPermissions?.readPermissionKey,
      readPermissionAmount = chatPermissions?.defaultReadPermissionAmount,
      readPermissionType = chatPermissions?.readPermissionType,
    }) => {
      return execute({
        chatKey,
        chatSdk,
        accelerator,
        delegateWalletKeypair,
        cluster,
        message,
        onAddPendingMessage,
        nftMint: matches && matches[0],
        readPermissionType: readPermissionType!,
        readPermissionKey: readPermissionKey!,
        readPermissionAmount: readPermissionAmount!,
      });
    },
    loading,
  };
}

export const SendMessageContext = createContext<IUseSendMessageReturn>(
  {} as IUseSendMessageReturn
);

export const SendMessageProvider: FC<IUseSendMessageArgs> = ({
  //@ts-ignore
  children,
  ...rest
}) => {
  const ret = useStrataSendMessage(rest);

  return (
    <SendMessageContext.Provider value={ret}>
      {children}
    </SendMessageContext.Provider>
  );
};

export const useSendMessage = () => {
  const context = useContext(SendMessageContext);
  if (context === undefined) {
    throw new Error("useSendMessage must be used within a ReplyProvider");
  }
  return context;
};
