import { Button, Flex, HStack, Icon, IconButton, Input, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@chakra-ui/react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Cluster } from "@strata-foundation/accelerator";
import { IDecryptedMessageContent, ISendMessageContent, MessageType } from "@strata-foundation/chat";
import {
  useEndpoint,
  useErrorHandler,
  useMint,
  useOwnedAmount,
  useAccelerator,
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { sendAndConfirmWithRetry } from "@strata-foundation/spl-utils";
import React, { useState } from "react";
import { AiOutlineGif, AiOutlineSend } from "react-icons/ai";
import { useChatSdk } from "../contexts";
import { useChat } from "../hooks";
import { useDelegateWallet } from "../hooks/useDelegateWallet";
import { BuyMoreButton } from "./BuyMoreButton";
import { FileAttachment } from "./FileAttachment";
import { GifSearch } from "./GifSearch";

export interface IPendingMessage {
  content: IDecryptedMessageContent;
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
  const { accelerator } = useAccelerator();
  const delegateWalletKeypair = useDelegateWallet();
  const [error, setError] = useState<Error>();
  const { handleErrors } = useErrorHandler();
  const { info: chat } = useChat(chatKey);
  const balance = useOwnedAmount(chat?.postPermissionMintOrCollection);
  const mint = useMint(chat?.postPermissionMintOrCollection);
  const postAmount =
    chat?.postPermissionAmount &&
    mint &&
    toNumber(chat?.postPermissionAmount, mint);
  const hasEnough = typeof postAmount == "undefined" || typeof balance == "undefined"|| (balance >= postAmount);
  const { cluster } = useEndpoint();

  handleErrors(error);

  /*get uid and phoroURL from current User then send message 
  and set chat state to "", then scroll to latst message
  */
  const sendMessage = async (message: ISendMessageContent) => {
    if (delegateWalletKeypair) {
      if (chatSdk && chatKey) {
        setInput("");
        const { instructions, signers } = await chatSdk.sendMessageInstructions(
          {
            delegateWalletKeypair,
            payer: delegateWalletKeypair.publicKey,
            chat: chatKey,
            message,
            encrypted: cluster !== "localnet",
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

        if (onAddPendingMessage) {
          const { fileAttachments, ...rest } = message;

          onAddPendingMessage({ content: { ...rest, decryptedAttachments: fileAttachments }, txid, chatKey });
        }
        
        accelerator?.sendTransaction(cluster as Cluster, tx);
        
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
            <FileAttachment
              onUpload={async (file) => {
                await sendMessage({
                  type: MessageType.Image,
                  fileAttachments: [file],
                });
              }}
            />
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
      <BuyMoreButton mint={chat?.postPermissionMintOrCollection} />
    </Flex>
  );
}
