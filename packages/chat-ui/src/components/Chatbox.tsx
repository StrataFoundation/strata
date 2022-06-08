import { Button, Flex, HStack, Icon, IconButton, Input, Modal, ModalBody, ModalContent, ModalHeader, useDisclosure } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { ISendMessageContent, MessageType } from "@strata-foundation/chat";
import {
  useErrorHandler,
  useMint,
  useOwnedAmount
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import React, { useState } from "react";
import { AiOutlineGif, AiOutlineSend } from "react-icons/ai";
import { IMessageWithPending, useChat, useSendMessage } from "../hooks";
import { BuyMoreButton } from "./BuyMoreButton";
import { FileAttachment } from "./FileAttachment";
import { GifSearch } from "./GifSearch";
// import { Editor, EditorState } from "draft-js";


export type chatProps = {
  onAddPendingMessage?: (message: IMessageWithPending) => void;
  chatKey?: PublicKey;
  scrollRef?: any;
};

export function Chatbox({ scrollRef, chatKey, onAddPendingMessage }: chatProps) {
  const [input, setInput] = useState("");
  const { isOpen, onToggle, onClose } = useDisclosure();
  const handleChange = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    setInput(e.target.value);
  };
  const { handleErrors } = useErrorHandler();
  const { info: chat } = useChat(chatKey);
  const balance = useOwnedAmount(chat?.postPermissionMintOrCollection);
  const mint = useMint(chat?.postPermissionMintOrCollection);
  const postAmount =
    chat?.postPermissionAmount &&
    mint &&
    toNumber(chat?.postPermissionAmount, mint);
  const hasEnough =
    typeof postAmount == "undefined" ||
    typeof balance == "undefined" ||
    balance >= postAmount;

    const [loading, setLoading] = useState(false);
  const { sendMessage: sendMessageImpl, error } = useSendMessage({
    chatKey,
    onAddPendingMessage: (msg) => {
      setInput("");
      setLoading(false)
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
      if (onAddPendingMessage) {
        onAddPendingMessage(msg);
      }
    },
  });

  const sendMessage = (m: ISendMessageContent) => {
    setLoading(true);
    sendMessageImpl(m);
  }

  handleErrors(error);

  return hasEnough ? (
    <>
      <Flex direction="row" position="sticky" bottom={0}>
        <HStack p="10px" spacing={2} w="full" align="stretch">
          <Input
            disabled={loading}
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
            isLoading={loading}
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
