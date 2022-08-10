import {
  Button,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Popover,
  PopoverBody,
  PopoverContent,
  Input,
  PopoverTrigger,
  Text,
  useColorModeValue,
  useDisclosure,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  InputRightAddon,
  InputGroup,
  CloseButton,
  ModalCloseButton,
} from "@chakra-ui/react";
import { AiFillLock } from "react-icons/ai";

import { AiOutlinePlus } from "react-icons/ai";
import { PublicKey } from "@solana/web3.js";
import { ISendMessageContent, MessageType } from "@strata-foundation/chat";
import { useErrorHandler, useMint, useTokenMetadata } from "@strata-foundation/react";
import React, {
  KeyboardEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAsyncCallback } from "react-async-hook";
import toast from "react-hot-toast";
import { AiOutlineGif, AiOutlineSend } from "react-icons/ai";
import { IoMdAttach } from "react-icons/io";
import { Converter } from "showdown";
import { useSendMessage } from "../../contexts/sendMessage";
import { useReply } from "../../contexts/reply";
import { useEmojiSearch } from "../../hooks/useEmojiSearch";
import { Files } from "../Files";
import { GifSearch } from "../GifSearch";
import { LongPromiseNotification } from "../LongPromiseNotification";
import { ChatInput } from "./ChatInput";
import { ReplyBar } from "./ReplyBar";
import { IMessageWithPending } from "../../hooks/useMessages";
import { useAnalyticsEventTracker } from "../../hooks/useAnalyticsEventTracker";
import { useChatPermissions } from "../../hooks/useChatPermissions";
import { useChatPermissionsFromChat } from "../../hooks/useChatPermissionsFromChat";
import { toBN, toNumber } from "@strata-foundation/spl-utils";

const converter = new Converter({
  simpleLineBreaks: true,
});

export type chatProps = {
  onAddPendingMessage?: (message: IMessageWithPending) => void;
  chatKey?: PublicKey;
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
  chatKey,
  onAddPendingMessage: inputOnAddPendingMessage,
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
  const { info: chatPermissions } = useChatPermissionsFromChat(chatKey);
  const { metadata } = useTokenMetadata(chatPermissions?.readPermissionKey);
  const readMint = useMint(chatPermissions?.readPermissionKey);

  const chatBg = useColorModeValue("gray.100", "gray.800");
  const { handleErrors } = useErrorHandler();
  const { isOpen: isPermissionModalOpen, onClose: onPermissionsClose, onOpen: onPermissionsOpen } = useDisclosure();
  const [readPermissionInputAmount, setReadPermissionInputAmount] = useState<string>();

  useEffect(() => {
    if (readMint && chatPermissions) {
      setReadPermissionInputAmount(
        toNumber(chatPermissions.defaultReadPermissionAmount, readMint).toString()
      );
    }
  }, [readMint, chatPermissions]);

  const [readPermissionAmount, setReadPermissionAmount] = useState<number>();

  const [loading, setLoading] = useState(false);
  const { sendMessage: sendMessageImpl, error } = useSendMessage();

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

  const onAddPendingMessage = (msg: IMessageWithPending) => {
    setLoading(false);
    if (inputOnAddPendingMessage) {
      inputOnAddPendingMessage(msg);
    }
  };

  const { execute: sendMessage } = useAsyncCallback(
    async (m: ISendMessageContent) => {
      setInput("");
      resetEmoji();
      setLoading(true);
      hideReply();

      try {
        if (replyMessage?.id) m.referenceMessageId = replyMessage?.id;
        const msgArgs: any = { message: m, onAddPendingMessage };
        if (readPermissionAmount) {
          msgArgs.readPermissionAmount = toBN(readPermissionAmount, readMint);
          setReadPermissionAmount(undefined)
        }
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
                  await sendMessageImpl(msgArgs);
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
          await sendMessageImpl(msgArgs);
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

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "0px";
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = scrollHeight + "px";
    }
  }, [inputRef, input]);

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
          {/* @ts-ignore */}
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

          {readPermissionAmount && (
            <HStack spacing={1} alignItems="center">
              <Icon as={AiFillLock} />
              <Text>
                {readPermissionAmount} {metadata?.data.symbol}
              </Text>
              <CloseButton
                color="gray.400"
                _hover={{ color: "gray.600", cursor: "pointer" }}
                onClick={() => setReadPermissionAmount(undefined)}
              />
            </HStack>
          )}
          <ReplyBar />
          <HStack w="full" alignItems="flex-end">
            <ChatInput
              inputRef={inputRef}
              onChange={handleChange}
              value={input}
              onKeyDown={handleKeyDown}
            />
            <Menu isLazy>
              <MenuButton
                as={IconButton}
                isLoading={loading}
                variant="outline"
                aria-label="Attachment"
                icon={<Icon w="24px" h="24px" as={AiOutlinePlus} />}
              />
              <MenuList>
                <MenuItem
                  icon={<Icon mt="3px" h="16px" w="16px" as={IoMdAttach} />}
                  onClick={onUploadFile}
                >
                  Upload File
                </MenuItem>
                <MenuItem
                  icon={<Icon mt="3px" h="16px" w="16px" as={AiOutlineGif} />}
                  onClick={onToggleGify}
                >
                  GIF
                </MenuItem>
              </MenuList>
            </Menu>
            <IconButton
              variant="outline"
              aria-label="Additional Message Locking"
              onClick={onPermissionsOpen}
              icon={<Icon w="24px" h="24px" as={AiFillLock} />}
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
          <ModalCloseButton />
          <ModalBody>
            <GifSearch
              onSelect={(gifyId) => {
                onCloseGify();
                sendMessage({
                  type: MessageType.Gify,
                  gifyId,
                });
              }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal
        isOpen={isPermissionModalOpen}
        onClose={onPermissionsClose}
        isCentered
      >
        <ModalContent p={4} borderRadius="xl">
          <ModalHeader pb={0}>Change Read Amount</ModalHeader>
          <ModalBody>
            <VStack spacing={8}>
              <Text>
                Holders in the chat will need this amount of{" "}
                {metadata?.data.symbol} to read this message.
              </Text>
              <InputGroup>
                <Input
                  borderRight="none"
                  value={readPermissionInputAmount}
                  onChange={(e) => setReadPermissionInputAmount(e.target.value)}
                  type="number"
                  step={Math.pow(10, -(readMint?.decimals || 0))}
                />
                <InputRightAddon>{metadata?.data.symbol}</InputRightAddon>
              </InputGroup>
              <HStack w="full" spacing={2}>
                <Button
                  w="full"
                  variant="outline"
                  onClick={() => onPermissionsClose()}
                >
                  Close
                </Button>
                <Button
                  w="full"
                  colorScheme="primary"
                  onClick={() => {
                    readPermissionInputAmount &&
                      setReadPermissionAmount(
                        Number(readPermissionInputAmount)
                      );
                    onPermissionsClose();
                  }}
                >
                  Set Amount
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
