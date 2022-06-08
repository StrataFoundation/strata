import {
  Avatar,
  Box,
  HStack,
  Icon,
  Skeleton,
  Text,
  useColorMode,
  useColorModeValue,
  VStack,
  Image,
} from "@chakra-ui/react";
import moment from "moment";
import { GiphyFetch } from "@giphy/js-fetch-api";
import { Gif } from "@giphy/react-components";
import { useWallet } from "@solana/wallet-adapter-react";
import { IMessage, MessageType } from "@strata-foundation/chat";
import { roundToDecimals, useMint, useTokenMetadata } from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import React, { useMemo } from "react";
import { useAsync } from "react-async-hook";
import { BsCheckCircleFill, BsCircle } from "react-icons/bs";
import { GIPHY_API_KEY } from "../constants";
import { useChat, useProfile } from "../hooks";
import { BuyMoreButton } from "./BuyMoreButton";

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
    return <Skeleton w="300px" h="300px" />
  }

  return <Gif gif={data} width={300} />;
}

export function Message({
  decodedMessage,
  profileKey,
  readPermissionAmount,
  chatKey,
  startBlockTime,
  showUser = true,
  pending = false,
}: Partial<IMessage> & { pending?: boolean; showUser: boolean }) {
  const { colorMode } = useColorMode();
  const { publicKey } = useWallet();
  const { info: profile } = useProfile(profileKey);
  const { metadata } = useTokenMetadata(profile?.identifierCertificateMint);
  const username = metadata?.data.name.split(".")[0]
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

  const message = decodedMessage;

  const usernameColor = { light: "green.500", dark: "green.200" };
  const textColor = { light: "black", dark: "white" };
  return (
    <HStack w="full" align="start" spacing={2}>
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
            <Text fontSize="xs" color={muted}>{moment(time).format("LT")}</Text>
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
            ) : (
              <Text mt={"-4px"}>{message.text}</Text>
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
  );
}
function blobToUrl(blob: Blob | undefined): string | undefined {
  if (blob) {
    const urlCreator = window.URL || window.webkitURL;
    return urlCreator.createObjectURL(blob);
  }
}

