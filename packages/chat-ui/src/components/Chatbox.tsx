import {
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { ISendMessageContent, MessageType, randomizeFileName } from "@strata-foundation/chat";
import {
  useErrorHandler,
  useMint,
  useOwnedAmount,
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import React, { useState } from "react";
import { AiOutlineGif, AiOutlineSend } from "react-icons/ai";
import { IMessageWithPending, useChat, useLoadDelegate, useSendMessage, useWalletProfile } from "../hooks";
import { BuyMoreButton } from "./BuyMoreButton";
import { ChatInput } from "./ChatInput";
import { FileAttachment } from "./FileAttachment";
import { GifSearch } from "./GifSearch";
import { Converter } from "showdown";
import toast from "react-hot-toast";
import { LongPromiseNotification } from "./LongPromiseNotification";
import { CreateProfileModal } from "./CreateProfileModal";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LoadWalletModal } from "./LoadWalletModal";

const converter = new Converter({
  simpleLineBreaks: true,
});

export type chatProps = {
  onAddPendingMessage?: (message: IMessageWithPending) => void;
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
  const { isOpen: loadWalletIsOpen, onOpen: onOpenLoadWallet, onClose: onCloseLoadWallet }= useDisclosure();
  const handleChange = (html: string) => {
    setInput(html);
  };
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { account: profileAccount } = useWalletProfile();
  const {
    needsTopOff,
    loadDelegate,
    loading: loadingDelegate,
    error: delegateError,
  } = useLoadDelegate();
  const {
    isOpen: profileIsOpen,
    onClose: closeProfile,
    onOpen: openProfile,
  } = useDisclosure({
    defaultIsOpen: false,
  });
  
  const chatBg = useColorModeValue("gray.100", "gray.800");
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
      setLoading(false);
      scrollRef.current.scrollTop = 0;
      if (onAddPendingMessage) {
        onAddPendingMessage(msg);
      }
    },
  });

  const sendMessage = async (m: ISendMessageContent) => {
    setInput("");
    setLoading(true);
    try {
      await sendMessageImpl(m);
    } finally {
      setLoading(false);
    }
  };

  handleErrors(error, delegateError);

  return !connected ? (
    <Flex justify="center" mb="6px">
      <Button
        size="sm"
        colorScheme="primary"
        variant="outline"
        onClick={() => setVisible(true)}
      >
        Connect Wallet
      </Button>
      <CreateProfileModal isOpen={profileIsOpen} onClose={closeProfile} />
    </Flex>
  ) : !profileAccount ? (
    <Flex justify="center" mb="6px">
      <Button
        size="sm"
        colorScheme="primary"
        variant="outline"
        onClick={() => openProfile()}
      >
        Create Profile to Chat
      </Button>
      <CreateProfileModal isOpen={profileIsOpen} onClose={closeProfile} />
    </Flex>
  ) : needsTopOff ? (
    <>
      <LoadWalletModal isOpen={loadWalletIsOpen} onClose={onCloseLoadWallet} onLoaded={() => onCloseLoadWallet()} />
      <Flex justify="center" mb="6px">
        <Button
          isLoading={loadingDelegate}
          size="sm"
          colorScheme="primary"
          variant="outline"
          onClick={() => onOpenLoadWallet()}
        >
          Top Off Chat Wallet
        </Button>
        <CreateProfileModal isOpen={profileIsOpen} onClose={closeProfile} />
      </Flex>
    </>
  ) : hasEnough ? (
    <>
      <Flex direction="row" position="sticky" bottom={0} p={2}>
        <HStack
          p="10px"
          spacing={2}
          w="full"
          align="center"
          bg={chatBg}
          rounded="lg"
        >
          <ChatInput
            onChange={(e) => handleChange(e.target.value)}
            value={input}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                if (!ev.shiftKey) {
                  ev.preventDefault();
                  sendMessage({
                    type: MessageType.Html,
                    html: converter.makeHtml(input.replace("\n", "\n\n")),
                  });
                }
              }
            }}
          />
          <FileAttachment
            onUpload={async (file) => {
              const text = `Uploading ${file.name} to SHDW Drive...`;
              toast.custom(
                (t) => (
                  <LongPromiseNotification
                    estTimeMillis={2 * 60 * 1000}
                    text={text}
                    onError={(e) => {
                      handleErrors(e);
                      toast.dismiss(t.id);
                    }}
                    exec={async () => {
                      randomizeFileName(file);
                      await sendMessageImpl({
                        type: MessageType.Image,
                        fileAttachments: [file],
                      });
                      return true;
                    }}
                    onComplete={async () => {
                      toast.dismiss(t.id);
                    }}
                  />
                ),
                {
                  duration: Infinity,
                }
              );
            }}
          />
          <IconButton
            aria-label="Select GIF"
            variant="outline"
            onClick={onToggle}
            icon={<Icon w="24px" h="24px" as={AiOutlineGif} />}
          />
          <Button
            isLoading={loading}
            colorScheme="primary"
            variant="outline"
            isDisabled={!hasEnough || !input}
            onClick={() =>
              sendMessage({
                type: MessageType.Html,
                html: converter.makeHtml(input),
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
