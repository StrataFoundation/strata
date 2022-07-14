import {
  Avatar,
  Box,
  Hide,
  HStack,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent, 
  PopoverTrigger,
  Skeleton,
  Text,
  Tooltip,
  useColorModeValue,
  VStack
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { MessageType } from "@strata-foundation/chat";
import {
  useErrorHandler,
  useMint,
  useTokenMetadata
} from "@strata-foundation/react";
import { humanReadable, toNumber } from "@strata-foundation/spl-utils";
import moment from "moment";
import React, { useCallback, useMemo } from "react";
import { useAsync } from "react-async-hook";
import { BsLockFill } from "react-icons/bs";
import { DisplayReply, MessageHeader, MessageStatus, Reacts } from ".";
import { BuyMoreButton } from "..";
import { useEmojis, useReply } from "../../contexts";
import {
  IMessageWithPendingAndReacts, useChatOwnedAmount,
  useChatPermissionsFromChat,
  useSendMessage, useWalletProfile
} from "../../hooks";
import { MessageBody } from "./MessageBody";
import { MessageToolbar } from "./MessageToolbar";

const defaultOptions = {
  allowedTags: ["b", "i", "em", "strong", "a", "code", "ul", "li", "p"],
  allowedAttributes: {
    a: ["href", "target"],
  },
};

export function Message(
  props: Partial<IMessageWithPendingAndReacts> & {
    htmlAllowlist?: any;
    pending?: boolean;
    showUser: boolean;
    scrollToMessage: (id: string) => void;
  }
) {
  const {
    id: messageId,
    getDecodedMessage,
    sender,
    readPermissionAmount,
    chatKey,
    txids,
    startBlockTime,
    htmlAllowlist = defaultOptions,
    reacts,
    type: messageType,
    showUser = true,
    pending = false,
    reply,
    scrollToMessage,
  } = props;

  const { publicKey } = useWallet();
  const { referenceMessageId: emojiReferenceMessageId, showPicker } =
    useEmojis();
  const { info: profile } = useWalletProfile(sender);
  const { info: chatPermissions } = useChatPermissionsFromChat(chatKey);

  const time = useMemo(() => {
    if (startBlockTime) {
      const t = new Date(0);
      t.setUTCSeconds(startBlockTime);
      return t;
    }
  }, [startBlockTime]);

  const readMint = chatPermissions?.readPermissionKey;
  const mintAcc = useMint(readMint);
  const { metadata } = useTokenMetadata(readMint);
  const tokenAmount =
    mintAcc &&
    readPermissionAmount &&
    humanReadable(readPermissionAmount, mintAcc);

  const { amount: ownedAmount } = useChatOwnedAmount(
    publicKey || undefined,
    chatKey
  );

  const notEnoughTokens = useMemo(() => {
    return (
      readPermissionAmount &&
      mintAcc &&
      (ownedAmount || 0) < toNumber(readPermissionAmount, mintAcc)
    );
  }, [readPermissionAmount, mintAcc, ownedAmount]);

  // Re decode if not enough tokens changes
  const getDecodedMessageOrIdentity = (_: boolean) =>
    getDecodedMessage ? getDecodedMessage() : Promise.resolve(undefined);
  const {
    result: message,
    loading: decoding,
    error: decodeError,
  } = useAsync(getDecodedMessageOrIdentity, [notEnoughTokens]);

  const lockedColor = useColorModeValue("gray.400", "gray.600");
  const highlightedBg = useColorModeValue("gray.200", "gray.800");

  const { handleErrors } = useErrorHandler();
  const { sendMessage, error } = useSendMessage({
    chatKey,
  });
  handleErrors(error, decodeError);

  const handleOnReaction = useCallback(() => {
    showPicker(messageId);
  }, [showPicker, messageId]);

  const { replyMessage } = useReply();

  const bg = useMemo(
    () =>
      messageId === emojiReferenceMessageId || messageId === replyMessage?.id
        ? highlightedBg
        : "initial",
    [highlightedBg, emojiReferenceMessageId, messageId, replyMessage?.id]
  );
  const hover = useMemo(() => ({ bg: highlightedBg }), [highlightedBg]);

  const textColor = useColorModeValue("black", "white");
  const loadingSkeleton = useMemo(() => {
    return (
      <Skeleton startColor={lockedColor} height="20px">
        {Array.from({ length: genLength(messageId || "") }, () => ".").join()}
      </Skeleton>
    );
  }, [messageId, lockedColor]);

  const buyMoreTrigger = useCallback(
    (props) => {
      return (
        <Tooltip
          label={`You need ${tokenAmount} ${metadata?.data.symbol} to read this message`}
        >
          <HStack
            onClick={props.onClick}
            spacing={2}
            _hover={{ cursor: "pointer" }}
          >
            <Skeleton startColor={lockedColor} height="20px" speed={100000}>
              {Array.from(
                { length: genLength(messageId || "") },
                () => "."
              ).join()}
            </Skeleton>
            <Icon color={lockedColor} as={BsLockFill} />
          </HStack>
        </Tooltip>
      );
    },
    [tokenAmount, metadata, lockedColor, messageId]
  );

  // LEGACY: If this is a reaction before message types were stored on the top level instead of json
  if (message?.type === MessageType.React) {
    return null;
  }

  return (
    <Box position="relative" _hover={hover} bg={bg}>
      <Popover matchWidth trigger="hover" placement="top-end" isLazy>
        <PopoverContent w="full" bg="transparent" border="none">
          <PopoverBody>
            <MessageToolbar {...props} />
          </PopoverBody>
        </PopoverContent>
        <PopoverTrigger>
          <VStack spacing={0} gap={0} w="full">
            {reply && (
              <DisplayReply
                reply={reply}
                scrollToMessage={scrollToMessage}
              />
            )}
            <HStack
              pl={2}
              pr={2}
              pb={1}
              pt={reply ? 0 : 1}
              w="full"
              align="start"
              spacing={2}
              className="strata-message"
            >
              {showUser ? (
                <Avatar mt="6px" size="sm" src={profile?.imageUrl} />
              ) : (
                <Box w="34px" />
              )}
              <VStack w="full" align="start" spacing={0}>
                {showUser && (
                  <MessageHeader
                    chatKey={chatKey}
                    sender={sender}
                    startBlockTime={startBlockTime}
                  />
                )}

                <Box
                  w="fit-content"
                  position="relative"
                  textAlign={"left"}
                  wordBreak="break-word"
                  color={textColor}
                  id={messageId}
                >
                  {message && messageType ? (
                    <MessageBody
                      htmlAllowlist={htmlAllowlist}
                      message={message}
                      messageType={messageType}
                    />
                  ) : decoding ? (
                    loadingSkeleton
                  ) : notEnoughTokens ? (
                    <BuyMoreButton mint={readMint} trigger={buyMoreTrigger} />
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
                {reacts && reacts.length > 0 && (
                  <Reacts
                    onAddReaction={handleOnReaction}
                    reacts={reacts}
                    onReact={(emoji, mine) => {
                      if (!mine)
                        sendMessage({
                          message: {
                            type: MessageType.React,
                            emoji: emoji,
                            referenceMessageId: messageId,
                          },
                        });
                    }}
                  />
                )}
              </VStack>
              <HStack alignItems="center" flexShrink={0}>
                {showUser && (
                  <Hide below="md">
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      _dark={{ color: "gray.400" }}
                    >
                      {moment(time).format("LT")}
                    </Text>
                  </Hide>
                )}
                <MessageStatus txids={txids} pending={pending} />
              </HStack>
            </HStack>
          </VStack>
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

export const MemodMessage = React.memo(Message);
