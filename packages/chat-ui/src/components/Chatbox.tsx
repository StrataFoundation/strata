import {
  Button,
  HStack,
  Icon,
  IconButton,
  Text,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  VStack,
  useColorModeValue,
  useDisclosure,
  Divider,
  Avatar,
  Box,
  ModalOverlay,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
} from "@chakra-ui/react";
import { Flex } from "./MyFlex";
import { PublicKey } from "@solana/web3.js";
import {
  ISendMessageContent,
  MessageType,
  randomizeFileName,
} from "@strata-foundation/chat";
import {
  roundToDecimals,
  useErrorHandler,
  useMint,
  useTokenMetadata,
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import React, { useRef, useEffect, useState, useMemo } from "react";
import { AiOutlineGif, AiOutlineSend } from "react-icons/ai";
import {
  IMessageWithPending,
  useChat,
  useLoadDelegate,
  useSendMessage,
  useWalletProfile,
  useAnalyticsEventTracker,
} from "../hooks";
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
import { useChatOwnedAmount } from "../hooks/useChatOwnedAmount";
import { useEmojiSearch } from "../hooks/useEmojiSearch";
import { Files } from "./Files";

const converter = new Converter({
  simpleLineBreaks: true,
});

export type chatProps = {
  onAddPendingMessage?: (message: IMessageWithPending) => void;
  chatKey?: PublicKey;
  scrollRef?: any;
};

const DARK_BG = {
  bg: "linear-gradient(0deg, rgba(17,24,39) 40%, rgba(21,24,38,0) 100%)",
};
export function Chatbox({
  scrollRef,
  chatKey,
  onAddPendingMessage,
}: chatProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const { emojis, search, searchMatch, reset: resetEmoji } = useEmojiSearch();
  const { isOpen, onToggle, onClose } = useDisclosure();
  const {
    isOpen: loadWalletIsOpen,
    onOpen: onOpenLoadWallet,
    onClose: onCloseLoadWallet,
  } = useDisclosure();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { account: profileAccount } = useWalletProfile(publicKey || undefined);
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

  const gaEventTracker = useAnalyticsEventTracker();

  const [files, setFiles] = useState<{ name: string; file: File }[]>([]);
  const onCancelFile = useMemo(
    () => (file: any) => setFiles((files) => files.filter((f) => f.file != file)),
    [setFiles]
  );
  const chatBg = useColorModeValue("gray.100", "gray.800");
  const { handleErrors } = useErrorHandler();
  const { info: chat } = useChat(chatKey);
  const { metadata: readMetadata, image: readImage } = useTokenMetadata(
    chat?.readPermissionKey
  );

  const { metadata: postMetadata, image: postImage } = useTokenMetadata(
    chat?.postPermissionKey
  );
  const { amount: ownedAmount } = useChatOwnedAmount(publicKey || undefined, chatKey);
  const mint = useMint(chat?.postPermissionKey);
  const postAmount =
    chat?.postPermissionAmount &&
    mint &&
    toNumber(chat?.postPermissionAmount, mint);

  const hasEnough =
    typeof postAmount == "undefined" ||
    typeof ownedAmount == "undefined" ||
    ownedAmount >= postAmount;

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
    resetEmoji();
    setLoading(true);
    try {
      // Show toast if uploading files
      if (m.fileAttachments && m.fileAttachments.length > 0) {
        const text = `Uploading ${m.fileAttachments.map(
          (f) => f.name
        )} to SHDW Drive...`;
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
                await sendMessageImpl(m);
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
        await sendMessageImpl(m);
      }
    } finally {
      setLoading(false);
    }
    gaEventTracker({
      action: "Send Message",
    });
  };

  const handleChange = async (e: React.FormEvent<HTMLTextAreaElement>) => {
    const content = e.currentTarget.value;
    search(e);
    setInput(content);
  };

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

  handleErrors(error, delegateError);

  return (
    <Flex w="full" position="relative">
      {!connected || !profileAccount || !hasEnough || needsTopOff ? (
        <Flex
          position="absolute"
          bottom="0"
          pb={12}
          pt={40}
          w="full"
          justify="center"
          bg="linear-gradient(0deg, rgba(255,255,255) 40%, rgba(255,255,255,0) 100%)"
          _dark={DARK_BG}
        >
          <VStack
            w="full"
            h="full"
            justify="center"
            align="center"
            maxW="360px"
          >
            {!connected ? (
              <>
                <Button
                  size="md"
                  colorScheme="primary"
                  onClick={() => setVisible(true)}
                  px={16}
                >
                  Connect Wallet
                </Button>
                <CreateProfileModal
                  isOpen={profileIsOpen}
                  onClose={closeProfile}
                />
              </>
            ) : !profileAccount ? (
              <>
                <Text fontWeight="bold">
                  A profile is required to send messages
                </Text>
                <Button
                  size="md"
                  colorScheme="primary"
                  onClick={() => openProfile()}
                  px={16}
                >
                  Create Profile to Chat
                </Button>
                <CreateProfileModal
                  isOpen={profileIsOpen}
                  onClose={closeProfile}
                />
              </>
            ) : !hasEnough ? (
              <>
                <Text fontWeight="bold" align="center">
                  In order to participate in this chat:
                </Text>
                <Box w="full" fontSize="sm">
                  {readMetadata && (
                    <HStack spacing={1}>
                      <Text>Read Message</Text>
                      <Flex grow={1}>
                        <Divider variant="dashed" />
                      </Flex>
                      <Text fontWeight="bold" textTransform="capitalize">
                        Hold 1
                      </Text>
                      <Avatar
                        w="18px"
                        h="18px"
                        title={readMetadata?.data.symbol}
                        src={readImage}
                      />
                    </HStack>
                  )}
                  {postMetadata && (
                    <HStack spacing={1}>
                      <Text>Post Message</Text>
                      <Flex grow={1}>
                        <Divider variant="dashed" />
                      </Flex>
                      <Text fontWeight="bold" textTransform="capitalize">
                        {Object.keys(chat?.postPermissionAction || {})[0]}{" "}
                        {postAmount}
                      </Text>
                      <Avatar
                        w="18px"
                        h="18px"
                        title={postMetadata?.data.symbol}
                        src={postImage}
                      />
                    </HStack>
                  )}
                </Box>
                <Box w="full" fontSize="sm">
                  {readMetadata && (
                    <HStack spacing={1}>
                      <Text>You currently have</Text>
                      <Flex grow={1}>
                        <Divider variant="dashed" />
                      </Flex>
                      <Text fontWeight="bold" textTransform="capitalize">
                        {ownedAmount ? roundToDecimals(ownedAmount, 4) : 0}
                      </Text>
                      <Avatar
                        w="18px"
                        h="18px"
                        title={readMetadata?.data.symbol}
                        src={readImage}
                      />
                    </HStack>
                  )}
                </Box>
                <Box pt={4}>
                  <BuyMoreButton
                    mint={chat?.postPermissionKey}
                    btnProps={{ px: 16, size: "md", variant: "solid" }}
                  />
                </Box>
              </>
            ) : needsTopOff ? (
              <>
                <LoadWalletModal
                  isOpen={loadWalletIsOpen}
                  onClose={onCloseLoadWallet}
                  onLoaded={() => onCloseLoadWallet()}
                />
                <Flex justify="center" mb="6px">
                  <Button
                    isLoading={loadingDelegate}
                    size="md"
                    colorScheme="primary"
                    onClick={() => onOpenLoadWallet()}
                    px={16}
                  >
                    Top Off Chat Wallet
                  </Button>
                  <CreateProfileModal
                    isOpen={profileIsOpen}
                    onClose={closeProfile}
                  />
                </Flex>
              </>
            ) : null}
          </VStack>
        </Flex>
      ) : (
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
              <PopoverContent
                bg={chatBg}
                border="none"
                w={{
                  base: "full",
                  md: "50%",
                }}
              >
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
              <Files
                files={files}
                onCancelFile={onCancelFile}
              />
              <HStack w="full">
                <ChatInput
                  inputRef={inputRef}
                  onChange={handleChange}
                  value={input}
                  onKeyDown={(ev) => {
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
                  }}
                />
                <FileAttachment
                  onUpload={async (newFiles) => {
                    setFiles((files) => [
                      ...files,
                      ...[...newFiles].map((file) => {
                        const ret = {
                          name: file.name,
                          file,
                        };
                        randomizeFileName(file); // so no conflicts with gengo
                        return ret;
                      }),
                    ]);
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
                  isDisabled={!hasEnough || (!input && files.length == 0)}
                  onClick={() =>
                    sendMessage({
                      type: MessageType.Html,
                      html: converter.makeHtml(input),
                      fileAttachments: files,
                    })
                  }
                >
                  <Icon as={AiOutlineSend} />
                </Button>
              </HStack>
            </VStack>
          </Flex>
          <Modal
            isOpen={isOpen}
            onClose={onClose}
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
                    onClose();
                    sendMessage({ type: MessageType.Gify, gifyId });
                  }}
                />
              </ModalBody>
            </ModalContent>
          </Modal>
        </>
      )}
    </Flex>
  );
}
