import { PublicKey } from "@solana/web3.js";
import {
  IMessageWithPending,
  useAnalyticsEventTracker,
  useDelegateWallet,
  useEmojiSearch,
  useChatPermissionsFromChat,
  useSendMessage,
} from "../../hooks";
import React, {
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { IoMdAttach } from "react-icons/io";
import { AiOutlineGif, AiOutlineSend } from "react-icons/ai";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  Button,
  HStack,
  useColorModeValue,
  useDisclosure,
  VStack,
  Text,
  PopoverTrigger,
  Popover,
  Divider,
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalBody,
  ModalContent,
  Flex,
  PopoverContent,
  PopoverBody,
  IconButton,
  Icon,
} from "@chakra-ui/react";
import { useErrorHandler } from "@strata-foundation/react";
import { useReply } from "../../contexts";
import { useAsyncCallback } from "react-async-hook";
import { ISendMessageContent, MessageType } from "@strata-foundation/chat";
import toast from "react-hot-toast";
import { LongPromiseNotification } from "../LongPromiseNotification";
import { Converter } from "showdown";
import { GifSearch } from "../GifSearch";
import { ReplyBar } from "./ReplyBar";
import { Files } from "../Files";
import { ChatInput } from "./ChatInput";

const converter = new Converter({
  simpleLineBreaks: true,
});

export type chatProps = {
  onAddPendingMessage?: (message: IMessageWithPending) => void;
  chatKey?: PublicKey;
  scrollRef?: any;
  files: { name: string; file: File }[];
  setFiles: React.Dispatch<
    React.SetStateAction<
      {
        name: string;
        file: File;
      }[]
    >
  >;
  onUploadFile: () => void;
};

const popoverWidth = {
  base: "full",
  md: "50%",
};

export function Chatbox({
  scrollRef,
  chatKey,
  onAddPendingMessage,
  files,
  setFiles,
  onUploadFile,
}: chatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const { emojis, search, searchMatch, reset: resetEmoji } = useEmojiSearch();
  const {
    isOpen: isGifyOpen,
    onToggle: onToggleGify,
    onClose: onCloseGify,
  } = useDisclosure();
  const gaEventTracker = useAnalyticsEventTracker();

  const chatBg = useColorModeValue("gray.100", "gray.800");
  const { handleErrors } = useErrorHandler();

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

  const onCancelFile = useCallback(
    (file: any) =>
      setFiles((files: { name: string; file: File }[]) =>
        files.filter((f) => f.file != file)
      ),
    [setFiles]
  );

  const { replyMessage, hideReply } = useReply();
  useEffect(() => {
    if (replyMessage) inputRef.current?.focus();
  }, [replyMessage]);

  const { execute: sendMessage } = useAsyncCallback(
    async (m: ISendMessageContent) => {
      setInput("");
      resetEmoji();
      setLoading(true);
      hideReply();

      try {
        if (replyMessage?.id) m.referenceMessageId = replyMessage?.id;
        // Show toast if uploading files
        if (m.fileAttachments && m.fileAttachments.length > 0) {
          const text = `Uploading ${m.fileAttachments.map(
            (f) => f.name
          )} to SHDW Drive...`;
          toast.custom(
            (t) => (
              <LongPromiseNotification
                estTimeMillis={1 * 60 * 1000}
                text={text}
                onError={(e) => {
                  handleErrors(e);
                  toast.dismiss(t.id);
                }}
                exec={async () => {
                  await sendMessageImpl({ message: m });
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
          setFiles([]);
        } else {
          await sendMessageImpl({ message: m });
        }
      } finally {
        setLoading(false);
      }
      gaEventTracker({
        action: "Send Message",
      });
    }
  );

  const handleChange = useCallback(
    async (e: React.FormEvent<HTMLTextAreaElement>) => {
      const content = e.currentTarget.value;
      search(e);
      setInput(content);
    },
    [setInput, search]
  );

  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (ev) => {
      if (ev.key === "Enter") {
        if (!ev.shiftKey) {
          ev.preventDefault();
          sendMessage({
            type: MessageType.Html,
            html: converter.makeHtml(input.replace("\n", "\n\n")),
            fileAttachments: files,
          });
        }
      }
    },
    [sendMessage, files, input]
  );

  const handleSendClick = useCallback(
    () =>
      sendMessage({
          type: MessageType.Html,
          html: converter.makeHtml(input),
          fileAttachments: files,
      }),
    [sendMessage, input, files]
  );

  const handleEmojiClick = (native: string) => {
    setInput(
      [`:${searchMatch}`, `:${searchMatch}:`].reduce(
        (acc, string) => acc.replace(string, native),
        input
      )
    );
    inputRef.current?.focus();
    resetEmoji();
  };

  handleErrors(error);

  return (
    <>
      <Flex
        direction="column"
        position="sticky"
        bottom={0}
        p={2}
        w="full"
        minH="76px"
      >
        <Popover
          matchWidth
          isOpen={emojis.length > 0}
          placement="top"
          autoFocus={false}
          closeOnBlur={false}
        >
          <PopoverTrigger>
            <Flex w="full" />
          </PopoverTrigger>
          <PopoverContent bg={chatBg} border="none" w={popoverWidth}>
            <PopoverBody px={0} pt={0}>
              <VStack spacing={0} w="full" align="start">
                <Text
                  p={2}
                  fontSize="xs"
                  fontWeight="bold"
                  textTransform="uppercase"
                  lineHeight="normal"
                >
                  Emojis Matching :
                  <Text as="span" textTransform="none">
                    {searchMatch}
                  </Text>
                </Text>
                <Divider />
                {emojis.map((e: any, indx) => (
                  <HStack
                    w="full"
                    p={2}
                    key={e.name}
                    onClick={() => handleEmojiClick(e.skins[0].native)}
                    _hover={{
                      cursor: "pointer",
                      bg: "gray.200",
                      _dark: {
                        bg: "gray.700",
                      },
                    }}
                  >
                    <Text fontSize="xl">{e.skins[0].native}</Text>
                    <Text fontSize="sm">{e.name}</Text>
                  </HStack>
                ))}
              </VStack>
            </PopoverBody>
          </PopoverContent>
        </Popover>
        <VStack
          p="10px"
          spacing={2}
          w="full"
          align="left"
          bg={chatBg}
          rounded="lg"
        >
          <Files files={files} onCancelFile={onCancelFile} />
          <ReplyBar />
          <HStack w="full">
            <ChatInput
              inputRef={inputRef}
              onChange={handleChange}
              value={input}
              onKeyDown={handleKeyDown}
            />
            <IconButton
              isLoading={loading}
              aria-label="Select Image"
              variant="outline"
              onClick={onUploadFile}
              icon={<Icon w="24px" h="24px" as={IoMdAttach} />}
            />
            <IconButton
              aria-label="Select GIF"
              variant="outline"
              onClick={onToggleGify}
              icon={<Icon w="24px" h="24px" as={AiOutlineGif} />}
            />
            <Button
              isLoading={loading}
              colorScheme="primary"
              variant="outline"
              isDisabled={!input && files.length == 0}
              onClick={handleSendClick}
            >
              <Icon as={AiOutlineSend} />
            </Button>
          </HStack>
        </VStack>
      </Flex>
      <Modal
        isOpen={isGifyOpen}
        onClose={onCloseGify}
        size="2xl"
        isCentered
        trapFocus={true}
      >
        <ModalOverlay />
        <ModalContent borderRadius="xl" shadow="xl">
          <ModalHeader>Select GIF</ModalHeader>
          <ModalBody>
            <GifSearch
              onSelect={(gifyId) => {
                onCloseGify();
                sendMessage({ type: MessageType.Gify, gifyId });
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
