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
  useDisclosure,
  VStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Tooltip,
  PopoverArrow,
  PopoverBody,
  Flex,
} from "@chakra-ui/react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Gif } from "@giphy/react-components";
import { useWallet } from "@solana/wallet-adapter-react";
import { MessageType } from "@strata-foundation/chat";
import {
  useErrorHandler,
  useMint,
  useEndpoint,
  truthy,
  useTokenMetadata,
} from "@strata-foundation/react";
import { humanReadable } from "@strata-foundation/spl-utils";
import moment from "moment";
import React, { useMemo } from "react";
import { useAsync } from "react-async-hook";
import { BsCheckCircleFill, BsCircle } from "react-icons/bs";
import { MdOutlineAddReaction } from "react-icons/md";
import sanitizeHtml from "sanitize-html";
import { GIPHY_API_KEY } from "../constants";
import {
  IMessageWithPending,
  IMessageWithPendingAndReacts,
  useChat,
  useProfile,
  useProfileKey,
  useSendMessage,
  useUsernameFromIdentifierCertificate,
} from "../hooks";
import { BuyMoreButton } from "./BuyMoreButton";
import { PublicKey } from "@solana/web3.js";
import { useEmojis } from "../contexts";

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
  decodedMessage,
  profileKey,
  readPermissionAmount,
  chatKey,
  txids,
  startBlockTime,
  htmlAllowlist = defaultOptions,
  reacts,
  showUser = true,
  pending = false,
}: Partial<IMessageWithPendingAndReacts> & {
  htmlAllowlist?: any;
  pending?: boolean;
  showUser: boolean;
}) {
  const { publicKey } = useWallet();
  const { showPicker } = useEmojis();
  const { key: myProfile } = useProfileKey(publicKey || undefined);
  const { info: profile } = useProfile(profileKey);
  const { username } = useUsernameFromIdentifierCertificate(
    profile?.identifierCertificateMint
  );
  const { cluster } = useEndpoint();
  const id = profile?.ownerWallet.toBase58();
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

  const uid = publicKey?.toBase58();
  const status = pending ? "Pending" : "Confirmed";
  const lockedColor = useColorModeValue("gray.400", "gray.600");
  const highlightedBg = useColorModeValue("gray.200", "gray.800");
  const message = decodedMessage;

  const { isOpen, onToggle, onClose } = useDisclosure();
  const { handleErrors } = useErrorHandler();
  const { sendMessage, error } = useSendMessage({
    chatKey,
  });
  handleErrors(error);

  const myReacts = useMemo(() => {
    if (!reacts) {
      return new Set();
    }

    return new Set(
      reacts
        .filter(
          (react: IMessageWithPending) =>
            myProfile && react.profileKey?.equals(myProfile)
        )
        .map((react) => react.decodedMessage!.emoji!)
    );
  }, [reacts, myProfile]);

  const reactsByEmoji = useMemo(() => {
    if (!reacts) {
      return {};
    }

    const grouped = reacts.reduce(
      (
        acc: Record<string, IMessageWithPending[]>,
        react: IMessageWithPending
      ) => {
        acc[react.decodedMessage!.emoji!] = [
          ...(acc[react.decodedMessage!.emoji!] || []),
          react,
        ];
        return acc;
      },
      {} as Record<string, IMessageWithPending[]>
    );

    // Dedup by profile
    return Object.fromEntries(
      Object.entries(grouped).map(([key, value]) => {
        const seen = new Set<string>();

        return [
          key,
          value
            .filter((v) => {
              const k = v.profileKey.toBase58();
              if (!seen.has(k)) {
                seen.add(k);
                return v;
              }
            })
            .filter(truthy),
        ];
      })
    );
  }, [reacts]);

  const handleOnReaction = () => {
    showPicker(messageId);
  };

  return (
    <Box position="relative" _hover={{ bg: highlightedBg }}>
      <Popover
        matchWidth
        trigger="hover"
        placement="top-end"
        onClose={onClose}
        isLazy
      >
        <PopoverContent w="full" bg="transparent" border="none">
          <PopoverBody>
            <Flex
              direction="row"
              top={2}
              right={20}
              justifyContent="end"
              position="absolute"
              zIndex="2"
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
                <HStack>
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
                </HStack>
              )}

              <Box
                w="fit-content"
                position="relative"
                textAlign={"left"}
                wordBreak="break-word"
                color="black"
                _dark={{ color: "white" }}
              >
                {message ? (
                  message.type === MessageType.Gify ? (
                    <GifyGif gifyId={message.gifyId} />
                  ) : message.type === MessageType.Image ? (
                    <Image
                      mt={"4px"}
                      alt={message.text}
                      height="300px"
                      src={
                        (message.attachments || [])[0] ||
                        blobToUrl((message.decryptedAttachments || [])[0])
                      }
                    />
                  ) : message.type === MessageType.Text ? (
                    <Text mt={"-4px"}>{message.text}</Text>
                  ) : (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: message.html
                          ? sanitizeHtml(message.html, htmlAllowlist)
                          : "",
                      }}
                    />
                  )
                ) : (
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
                                { length: 10 + Math.random() * 100 },
                                () => "."
                              ).join()}
                            </Skeleton>
                            <Icon color={lockedColor} as={BsLockFill} />
                          </HStack>
                        </Tooltip>
                      );
                    }}
                  />
                )}
              </Box>
              {Object.entries(reactsByEmoji).length > 0 && (
                <HStack mt={2}>
                  {Object.entries(reactsByEmoji).map(([emoji, messages]) => (
                    <Popover matchWidth trigger="hover" key={emoji}>
                      <PopoverTrigger>
                        <Button
                          onClick={() => {
                            if (!myReacts.has(emoji))
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
                          variant={myReacts.has(emoji) ? "solid" : "outline"}
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
                    onClick={onToggle}
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
function blobToUrl(blob: Blob | undefined): string | undefined {
  if (blob) {
    const urlCreator = window.URL || window.webkitURL;
    return urlCreator.createObjectURL(blob);
  }
}
