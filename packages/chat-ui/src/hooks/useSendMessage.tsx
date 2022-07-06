import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SYSVAR_CLOCK_PUBKEY, Transaction } from "@solana/web3.js";
import { Accelerator, Cluster } from "@strata-foundation/accelerator";
import {
  ChatSdk,
  IChat,
  IProfile,
  ISendMessageContent
} from "@strata-foundation/chat";
import {
  useAccelerator, useCollectionOwnedAmount, useEndpoint
} from "@strata-foundation/react";
import { sendAndConfirmWithRetry } from "@strata-foundation/spl-utils";
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
  chatSdk,
  accelerator,
  delegateWalletKeypair,
  cluster,
  onAddPendingMessage,
  message,
  nftMint,
}: {
  chat: IChat | undefined;
  chatSdk: ChatSdk | undefined;
  accelerator: Accelerator | undefined;
  delegateWalletKeypair: Keypair | undefined;
  cluster: string;
  onAddPendingMessage: ((message: IMessageWithPending) => void) | undefined;
  message: ISendMessageContent;
  nftMint?: PublicKey;
}) {
  const chatKey = chat?.publicKey;
  if (chatSdk && chatKey) {
    const payer = delegateWalletKeypair?.publicKey || chatSdk.wallet.publicKey;;
    const {
      instructions: instructionGroups,
      signers: signerGroups,
      output: { messageId },
    } = await chatSdk.sendMessageInstructions({
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
      ))!.data.readBigInt64LE(8 * 4)
    );

    if (onAddPendingMessage) {
      const { fileAttachments, ...rest } = message;
      const content = { ...rest, decryptedAttachments: fileAttachments };

      onAddPendingMessage({
        type: content.type,
        sender: chatSdk.wallet.publicKey,
        id: messageId,
        content: JSON.stringify(content),
        txids: txsAndIds.map(({ txid }) => txid),
        chatKey,
        getDecodedMessage: () => Promise.resolve(content),
        encryptedSymmetricKey: "",
        readPermissionAmount: chat!.defaultReadPermissionAmount,
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
export function useSendMessage({ chatKey, onAddPendingMessage }: IUseSendMessageArgs): IUseSendMessageReturn {
  const { chatSdk } = useChatSdk();
  const { accelerator } = useAccelerator();
  const { keypair: delegateWalletKeypair } = useDelegateWallet();
  const { info: chat } = useChat(chatKey);
  const { cluster } = useEndpoint();
  const { matches } = useCollectionOwnedAmount(
    chat?.postPermissionKey
  );

  const {
    error,
    loading,
    execute,
  } = useAsyncCallback(sendMessage);

  return {
    error,
    sendMessage: (message: ISendMessageContent) => {
      return execute({
        chat,
        chatSdk,
        accelerator,
        delegateWalletKeypair,
        cluster,
        onAddPendingMessage,
        message,
        nftMint: matches && matches[0]
      });
    },
    loading,
  };
}