import { useDelegateWallet } from "../hooks/useDelegateWallet";
import { Button, Flex, FormControl, Input } from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { IMessageContent, MessageType } from "@strata-foundation/chat";
import { useErrorHandler, useMint, useOwnedAmount } from "@strata-foundation/react";
import { sendAndConfirmWithRetry } from "@strata-foundation/spl-utils";
import React, { useState } from "react";
import { useChatSdk } from "../contexts";
import { useChat } from "../hooks";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { BuyMoreButton } from "./BuyMoreButton";

export interface IPendingMessage {
  content: IMessageContent;
  txid: string;
}
export type chatProps = {
  onAddPendingMessage?: (message: IPendingMessage) => void;
  chatKey?: PublicKey;
  scrollRef?: any;
};

export function Chatbox({
  scrollRef,
  chatKey,
  onAddPendingMessage,
}: chatProps) {
  const [input, setInput] = useState("");
  const handleChange = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setInput(e.target.value);
  };
  const { chatSdk } = useChatSdk();
  const delegateWalletKeypair = useDelegateWallet();
  const [error, setError] = useState<Error>();
  const { handleErrors } = useErrorHandler();
  const { info: chat } = useChat(chatKey);
  const balance = useOwnedAmount(chat?.postPermissionMint);
  const mint = useMint(chat?.postPermissionMint);
  const postAmount =
    chat?.postPermissionAmount &&
    mint &&
    toNumber(chat?.postPermissionAmount, mint);
  const hasEnough = typeof postAmount == "undefined" || typeof balance == "undefined"|| (balance >= postAmount);

  handleErrors(error);

  /*get uid and phoroURL from current User then send message 
  and set chat state to "", then scroll to latst message
  */
  const sendMessage = async (e: any) => {
    e.preventDefault();

    if (delegateWalletKeypair) {
      const message = {
        type: MessageType.Text,
        text: input,
      };
      if (chatSdk && chatKey) {
        setInput("");
        const { instructions, signers } = await chatSdk.sendMessageInstructions(
          {
            delegateWalletKeypair,
            payer: delegateWalletKeypair.publicKey,
            chat: chatKey,
            message: JSON.stringify(message),
            encrypted: false,
          }
        );
        let tx = new Transaction();
        tx.recentBlockhash = (
          await chatSdk.provider.connection.getRecentBlockhash()
        ).blockhash;
        tx.feePayer = delegateWalletKeypair.publicKey;
        tx.add(...instructions);
        tx.sign(...signers);
        const rawTx = tx.serialize();
        const txid = await chatSdk.provider.connection.sendRawTransaction(
          rawTx,
          {
            skipPreflight: true,
          }
        );
        if (onAddPendingMessage)
          onAddPendingMessage({ content: message, txid });

        scrollRef.current.scrollIntoView({ behavior: "smooth" });

        await sendAndConfirmWithRetry(
          chatSdk.provider.connection,
          rawTx,
          {
            skipPreflight: true,
          },
          "confirmed"
        );
      }
    }
  };
  return hasEnough ? (
    <Flex direction="row" position="sticky" bottom={0}>
      <FormControl
        p={2}
        zIndex={3}
        as="form"
        display="flex"
        alignItems="center"
      >
        {hasEnough && (
          <Input
            onKeyPress={(ev) => {
              if (ev.key === "Enter") {
                if (ev.shiftKey) {
                  ev.preventDefault();
                  setInput((i) => `${i}\n`);
                } else {
                  sendMessage(ev);
                }
              }
            }}
            size="lg"
            value={input}
            onChange={handleChange}
            placeholder="Type Message"
          />
        )}
        <Button
          alignSelf="flex-end"
          isDisabled={!hasEnough}
          size="lg"
          onClick={sendMessage}
        >
          Send
        </Button>
      </FormControl>
    </Flex>
  ) : (
    <Flex justify="center" mb="6px">
      <BuyMoreButton mint={chat?.postPermissionMint} />
    </Flex>
  );
}
