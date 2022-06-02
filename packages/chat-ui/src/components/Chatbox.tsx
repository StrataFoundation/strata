import { useDelegateWallet } from "../hooks/useDelegateWallet";
import { Button, Flex, FormControl, HStack, Icon, IconButton, Input, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@chakra-ui/react";
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
import { AiOutlineGif } from "react-icons/ai";
import { GifSearch } from "./GifSearch";
import { AiOutlineSend } from "react-icons/ai";
import { ShdwAttachment } from "./ShdwAttachment";

export interface IPendingMessage {
  content: IMessageContent;
  txid: string;
  chatKey?: PublicKey;
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
  const { isOpen, onToggle, onClose } = useDisclosure();
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
  const sendMessage = async (message: IMessageContent) => {
    if (delegateWalletKeypair) {
      if (chatSdk && chatKey) {
        setInput("");
        const { instructions, signers } = await chatSdk.sendMessageInstructions(
          {
            delegateWalletKeypair,
            payer: delegateWalletKeypair.publicKey,
            chat: chatKey,
            message,
            encrypted: true,
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
          onAddPendingMessage({ content: message, txid, chatKey });

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
    <>
      <Flex direction="row" position="sticky" bottom={0}>
        <HStack p="10px" spacing={2} w="full" align="stretch">
          {hasEnough && (
            <Input
              onKeyPress={(ev) => {
                if (ev.key === "Enter") {
                  if (ev.shiftKey) {
                    ev.preventDefault();
                    setInput((i) => `${i}\n`);
                  } else {
                    ev.preventDefault();
                    sendMessage({
                      type: MessageType.Text,
                      text: input,
                    });
                  }
                }
              }}
              size="lg"
              value={input}
              onChange={handleChange}
              placeholder="Type Message"
            />
          )}
          <ShdwAttachment onUpload={(url) => sendMessage({
            type: MessageType.Image,
            attachments: [url]
          })} />
          <IconButton
            size="lg"
            aria-label="Select GIF"
            variant="outline"
            onClick={onToggle}
            icon={<Icon w="24px" h="24px" as={AiOutlineGif} />}
          />
          <Button
            colorScheme="primary"
            variant="outline"
            alignSelf="flex-end"
            isDisabled={!hasEnough || !input}
            size="lg"
            onClick={() =>
              sendMessage({
                type: MessageType.Text,
                text: input,
              })
            }
          >
            <Icon as={AiOutlineSend} />
          </Button>
        </HStack>
      </Flex>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        isCentered
        trapFocus={true}
      >
        <ModalContent borderRadius="xl" shadow="xl">
          <ModalHeader>Select GIF</ModalHeader>
          <ModalBody>
            <GifSearch
              onSelect={(gifyId) => {
                onClose();
                sendMessage({ type: MessageType.Gify, gifyId });
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  ) : (
    <Flex justify="center" mb="6px">
      <BuyMoreButton mint={chat?.postPermissionMint} />
    </Flex>
  );
}
