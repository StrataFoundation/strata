import { BsLockFill } from "react-icons/bs";
import {
  Avatar,
  Box,
  Button,
  HStack,
  Icon,
  IconButton,
  Image,
  TextProps,
  Skeleton,
  Text,
  useColorModeValue,
  VStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tooltip,
  PopoverArrow,
  PopoverBody,
} from "@chakra-ui/react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Gif } from "@giphy/react-components";
import { useWallet } from "@solana/wallet-adapter-react";
import { MessageType, IMessage } from "@strata-foundation/chat";
import {
  useErrorHandler,
  useMint,
  useEndpoint,
  truthy,
  useTokenMetadata,
} from "@strata-foundation/react";
import { humanReadable, toNumber } from "@strata-foundation/spl-utils";
import moment from "moment";
import React, { useMemo, useCallback } from "react";
import { useAsync } from "react-async-hook";
import { BsCheckCircleFill, BsCircle } from "react-icons/bs";
import { MdOutlineAddReaction, MdReply } from "react-icons/md";
import sanitizeHtml from "sanitize-html";
import { GIPHY_API_KEY } from "../constants";
import {
  IMessageWithPending,
  IMessageWithPendingAndReacts,
  useChat,
  useChatOwnedAmount,
  useInflatedReacts,
  useProfile,
  useProfileKey,
  useSendMessage,
  useUsernameFromIdentifierCertificate,
  useMessages,
} from "../hooks";
import { BuyMoreButton } from "./BuyMoreButton";
import { PublicKey } from "@solana/web3.js";
import { useEmojis, useReply } from "../contexts";
import { TokenFlare, DisplayReply, Files, Flex } from "./";

const gf = new GiphyFetch(GIPHY_API_KEY);

async function fetchGif(gifyId?: string): Promise<any | undefined> {
  if (gifyId) {
    const { data } = await gf.gif(gifyId);
    return data;
  }
}

function GifyGif({ gifyId }: { gifyId?: string }) {
  const { result: data, loading } = useAsync(fetchGif, [gifyId]);

  if (loading || !data) {
    return <Skeleton w="300px" h="300px" />;
  }

  return <Gif gif={data} width={300} />;
}

const defaultOptions = {
  allowedTags: ["b", "i", "em", "strong", "a", "code", "ul", "li", "p"],
  allowedAttributes: {
    a: ["href", "target"],
  },
};

function ProfileName({ profileKey }: { profileKey: PublicKey } & TextProps) {
  const { info: profile } = useProfile(profileKey);
  const { username } = useUsernameFromIdentifierCertificate(
    profile?.identifierCertificateMint
  );

  return <Text>{username} </Text>;
}

const MAX_MENTIONS_DISPLAY = 3;

export function Message({
  id: messageId,
  getDecodedMessage,
  profileKey,
  readPermissionAmount,
  chatKey,
  txids,
  startBlockTime,
  replyToMessageId,
  htmlAllowlist = defaultOptions,
  reacts,
  type: messageType,
  showUser = true,
  pending = false,
  scrollRef,
  messages,
}: Partial<IMessageWithPendingAndReacts> & {
  htmlAllowlist?: any;
  pending?: boolean;
  showUser: boolean;
  scrollRef: any;
  messages: IMessage[];
}) {
  const { publicKey } = useWallet();
  const { referenceMessageId, showPicker } = useEmojis();
  const { replyToMessageId: currentlyReplyingToId, showReply } = useReply();
  const { info: profile } = useProfile(profileKey);
  const { username } = useUsernameFromIdentifierCertificate(
    profile?.identifierCertificateMint
  );
  const getDecodedMessageOrIdentity =
    getDecodedMessage || (() => Promise.resolve(undefined));
  const {
    result: message,
    loading: decoding,
    error: decodeError,
  } = useAsync(getDecodedMessageOrIdentity, []);
  const { cluster } = useEndpoint();
  const { info: chat } = useChat(chatKey);
  const time = useMemo(() => {
    if (startBlockTime) {
      const t = new Date(0);
      t.setUTCSeconds(startBlockTime);
      return t;
    }
  }, [startBlockTime]);

  const readMint = chat?.readPermissionKey;
  const mintAcc = useMint(readMint);
  const { metadata } = useTokenMetadata(readMint);
  const tokenAmount =
    mintAcc &&
    readPermissionAmount &&
    humanReadable(readPermissionAmount, mintAcc);

  const { amount: ownedAmount } = useChatOwnedAmount(publicKey || undefined, chatKey);

  const status = pending ? "Pending" : "Confirmed";
  const lockedColor = useColorModeValue("gray.400", "gray.600");
  const highlightedBg = useColorModeValue("gray.200", "gray.800");
  const files = useMemo(() => [
    ...(message?.attachments || []),
    ...(message?.decryptedAttachments || []),
  ], [message]);

  const {
    reacts: inflatedReacts,
    error: reactError,
    loading: reactsLoading,
  } = useInflatedReacts(reacts);

  const { handleErrors } = useErrorHandler();
  const { sendMessage, error } = useSendMessage({
    chatKey,
  });
  handleErrors(error, decodeError, reactError);

  const handleOnReaction = useCallback(() => {
    showPicker(messageId);
  }, [showPicker, messageId]);

  const handleOnReply = useCallback(() => {
    showReply(messageId);
  }, [showReply, messageId]);

  // LEGACY: If this is a reaction before message types were stored on the top level instead of json
  if (message?.type === MessageType.React) {
    return null;
  }

  return (
    <Box
      position="relative"
      _hover={{ bg: highlightedBg }}
      bg={messageId === referenceMessageId || messageId === currentlyReplyingToId ? highlightedBg : "initial"}
    >
      <Popover matchWidth trigger="hover" placement="top-end" isLazy>
        <PopoverContent w="full" bg="transparent" border="none">
          <PopoverBody>
            <Flex
              direction="row"
              top={2}
              right={20}
              justifyContent="end"
              position="absolute"
            >
              <IconButton
                icon={<Icon as={MdOutlineAddReaction} />}
                w="32px"
                h="32px"
                variant="outline"
                size="lg"
                aria-label="Add Reaction"
                bg="white"
                _dark={{
                  bg: "gray.900",
                  _hover: {
                    bg: highlightedBg,
                  },
                }}
                onClick={handleOnReaction}
              />
              <IconButton
                icon={<Icon as={MdReply} />}
                w="32px"
                h="32px"
                variant="outline"
                size="lg"
                aria-label="Reply"
                bg="white"
                _dark={{
                  bg: "gray.900",
                  _hover: {
                    bg: highlightedBg,
                  },
                }}
                onClick={handleOnReply}
              />
            </Flex>
          </PopoverBody>
        </PopoverContent>
        <PopoverTrigger>
          <HStack
            pl={2}
            pr={2}
            pb={1}
            pt={1}
            w="full"
            align="start"
            spacing={2}
            className="strata-message"
          >
            {showUser ? (
              <Avatar mt="6px" size="sm" src={profile?.imageUrl} />
            ) : (
              <Box w="36px" />
            )}
            <VStack w="full" align="start" spacing={0}>
              {showUser && (
                <HStack alignItems="flex-end">
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="green.500"
                    _dark={{ color: "green.200" }}
                  >
                    {username}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    _dark={{ color: "gray.400" }}
                  >
                    {moment(time).format("LT")}
                  </Text>
                  <TokenFlare
                    chat={chatKey}
                    wallet={profile?.ownerWallet}
                    tokens={[
                      chat?.readPermissionKey,
                      chat?.postPermissionKey,
                    ].filter(truthy)}
                  />
                </HStack>
              )}

              <Box
                w="fit-content"
                position="relative"
                textAlign={"left"}
                wordBreak="break-word"
                color="black"
                _dark={{ color: "white" }}
                id={messageId}
              >
                <DisplayReply chatKey={chatKey} 
                  replyToMessageId={replyToMessageId} 
                  htmlAllowList={htmlAllowlist} 
                  scrollRef={scrollRef}
                  messages={messages}
                />
                {message ? (
                  messageType === MessageType.Gify ? (
                    <GifyGif gifyId={message.gifyId} />
                  ) : message.type === MessageType.Image ? (
                    <Files files={files} />
                  ) : message.type === MessageType.Text ? (
                    <Text mt={"-4px"}>{message.text}</Text>
                  ) : (
                    <>
                      <Files files={files} />
                      <div
                        dangerouslySetInnerHTML={{
                          __html: message.html
                            ? sanitizeHtml(message.html, htmlAllowlist)
                            : "",
                        }}
                      />
                    </>
                  )
                ) : decoding ? (
                  <Skeleton startColor={lockedColor} height="20px">
                    {Array.from(
                      { length: genLength(messageId || "") },
                      () => "."
                    ).join()}
                  </Skeleton>
                ) : readPermissionAmount &&
                  mintAcc &&
                  (ownedAmount || 0) <
                    toNumber(readPermissionAmount, mintAcc) ? (
                  <BuyMoreButton
                    mint={readMint}
                    trigger={(props) => {
                      return (
                        <Tooltip
                          label={`You need ${tokenAmount} ${metadata?.data.symbol} to read this message`}
                        >
                          <HStack
                            onClick={props.onClick}
                            spacing={2}
                            _hover={{ cursor: "pointer" }}
                          >
                            <Skeleton
                              startColor={lockedColor}
                              height="20px"
                              speed={100000}
                            >
                              {Array.from(
                                { length: genLength(messageId || "") },
                                () => "."
                              ).join()}
                            </Skeleton>
                            <Icon color={lockedColor} as={BsLockFill} />
                          </HStack>
                        </Tooltip>
                      );
                    }}
                  />
                ) : (
                  <Tooltip label={`Failed to decode message`}>
                    <Skeleton
                      startColor={lockedColor}
                      height="20px"
                      speed={100000}
                    >
                      {Array.from(
                        { length: genLength(messageId || "") },
                        () => "."
                      ).join()}
                    </Skeleton>
                  </Tooltip>
                )}
              </Box>
              {inflatedReacts && inflatedReacts.length > 0 && (
                <HStack mt={2}>
                  {inflatedReacts.map(({ emoji, messages, mine }) => (
                    <Popover matchWidth trigger="hover" key={emoji}>
                      <PopoverTrigger>
                        <Button
                          onClick={() => {
                            if (!mine)
                              sendMessage({
                                type: MessageType.React,
                                emoji: emoji,
                                referenceMessageId: messageId,
                              });
                          }}
                          borderLeftRadius="20px"
                          width="55px"
                          borderRightRadius="20px"
                          p={0}
                          variant={mine ? "solid" : "outline"}
                          size="sm"
                          key={emoji}
                        >
                          <HStack spacing={1}>
                            <Text lineHeight={0} fontSize="lg">
                              {emoji}
                            </Text>
                            <Text lineHeight={0} fontSize="sm">
                              {messages.length}
                            </Text>
                          </HStack>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent width="fit-content">
                        <PopoverArrow />
                        <PopoverBody>
                          <HStack spacing={1}>
                            {messages
                              .slice(0, MAX_MENTIONS_DISPLAY)
                              .map((message, index) => (
                                <HStack key={message.id} spacing={0}>
                                  <ProfileName
                                    profileKey={message.profileKey}
                                  />
                                  {messages.length - 1 != index && (
                                    <Text>, </Text>
                                  )}
                                </HStack>
                              ))}
                            {messages.length > MAX_MENTIONS_DISPLAY && (
                              <Text>
                                and {messages.length - MAX_MENTIONS_DISPLAY}{" "}
                                others
                              </Text>
                            )}
                          </HStack>
                        </PopoverBody>
                      </PopoverContent>
                    </Popover>
                  ))}
                  <Button
                    borderLeftRadius="20px"
                    width="55px"
                    borderRightRadius="20px"
                    variant="outline"
                    size="sm"
                    onClick={handleOnReaction}
                  >
                    <Icon as={MdOutlineAddReaction} />
                  </Button>
                </HStack>
              )}
            </VStack>
            <Icon
              _hover={{ cursor: "pointer" }}
              onClick={() => {
                txids?.forEach((tx) => {
                  window.open(
                    `https://explorer.solana.com/tx/${tx}?cluster=${cluster}`
                  );
                });
              }}
              alignSelf="center"
              w="12px"
              h="12px"
              as={pending ? BsCircle : BsCheckCircleFill}
              color="gray"
              title={status}
            />
          </HStack>
        </PopoverTrigger>
      </Popover>
    </Box>
  );
}

const lengths: Record<string, number> = {};

function genLength(id: string): number {
  if (!lengths[id]) {
    lengths[id] = 10 + Math.random() * 100;
  }

  return lengths[id];
}
