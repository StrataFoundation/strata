import {
  Avatar,
  Box,
  Button,
  HStack,
  Icon,
  IconButton,
  Image,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
  Text,
  useColorMode,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Gif } from "@giphy/react-components";
import { useWallet } from "@solana/wallet-adapter-react";
import { MessageType } from "@strata-foundation/chat";
import {
  roundToDecimals,
  useErrorHandler,
  useMint,
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
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
import { EmojiSearch } from "./EmojiSearch";

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

export function Message({
  id: messageId,
  decodedMessage,
  profileKey,
  readPermissionAmount,
  chatKey,
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
  const { colorMode } = useColorMode();
  const { publicKey } = useWallet();
  const { key: myProfile } = useProfileKey(publicKey || undefined);
  const { info: profile } = useProfile(profileKey);
  const { username } = useUsernameFromIdentifierCertificate(
    profile?.identifierCertificateMint
  );

  const id = profile?.ownerWallet.toBase58();
  const { info: chat } = useChat(chatKey);
  const readMint = chat?.readPermissionMintOrCollection;
  const readMintAcc = useMint(readMint);
  const muted = useColorModeValue("gray.500", "gray.400");
  const time = useMemo(() => {
    if (startBlockTime) {
      const t = new Date(0);
      t.setUTCSeconds(startBlockTime);
      return t;
    }
  }, [startBlockTime]);

  const uid = publicKey?.toBase58();

  const status = pending ? "Pending" : "Confirmed";
  const redColor = useColorModeValue("red.600", "red.400");
  const highlightedBg = useColorModeValue("gray.200", "gray.800");

  const message = decodedMessage;

  const usernameColor = { light: "green.500", dark: "green.200" };
  const textColor = { light: "black", dark: "white" };

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

  const reactsWithCounts = useMemo(() => {
    if (!reacts) {
      return {};
    }

    return reacts.reduce(
      (acc: Record<string, number>, react: IMessageWithPending) => {
        acc[react.decodedMessage!.emoji!] =
          (acc[react.decodedMessage!.emoji!] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [reacts]);

  return (
    <Popover matchWidth trigger="hover" placement="end-start" onClose={onClose}>
      <PopoverContent
        right={isOpen ? "350px" : "180px"}
        bg={isOpen ? undefined : "transparent"}
        border={isOpen ? undefined : "none"}
        width={isOpen ? undefined : "60px"}
      >
        <PopoverBody>
          {!isOpen && (
            <IconButton
              icon={<Icon as={MdOutlineAddReaction} />}
              w="32px"
              h="32px"
              variant="outline"
              size="lg"
              aria-label="Add Reaction"
              onClick={onToggle}
            />
          )}
          {isOpen && (
            <EmojiSearch
              onSelect={(emoji) => {
                onClose();
                sendMessage({
                  type: MessageType.React,
                  emoji: emoji.symbol,
                  referenceMessageId: messageId,
                });
              }}
            />
          )}
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
          _hover={{ backgroundColor: highlightedBg }}
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
                  color={uid == id ? "blue.500" : usernameColor[colorMode]}
                >
                  {username}
                </Text>
                <Text fontSize="xs" color={muted}>
                  {moment(time).format("LT")}
                </Text>
              </HStack>
            )}

            <Box
              w="fit-content"
              position="relative"
              textAlign={"left"}
              wordBreak="break-word"
              color={textColor[colorMode]}
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
                <>
                  <Text color={redColor} fontStyle="italic" mb={2}>
                    {readPermissionAmount && readMintAcc
                      ? `You need at least ${roundToDecimals(
                          toNumber(readPermissionAmount, readMintAcc),
                          readMintAcc.decimals
                        )} tokens to read this message.`
                      : "You do not have enough tokens to read this message."}
                  </Text>
                  <BuyMoreButton mint={readMint} />
                </>
              )}
            </Box>
            {Object.entries(reactsWithCounts).length > 0 && (
              <HStack mt={2}>
                {Object.entries(reactsWithCounts).map(([emoji, count]) => (
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
                        {count}
                      </Text>
                    </HStack>
                  </Button>
                ))}
                <Button
                  borderLeftRadius="20px"
                  width="55px"
                  borderRightRadius="20px"
                  isRounded={false}
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
  );
}
function blobToUrl(blob: Blob | undefined): string | undefined {
  if (blob) {
    const urlCreator = window.URL || window.webkitURL;
    return urlCreator.createObjectURL(blob);
  }
}
