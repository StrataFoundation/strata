import React from "react";
import {
  Avatar,
  Box,
  HStack,
  Icon,
  Text,
  useColorMode,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { IMessage } from "@strata-foundation/chat";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProfile } from "../hooks";
import { BsCircle, BsCheckCircleFill } from "react-icons/bs";
export function Message({
  decodedMessage,
  profileKey,
  pending = false,
}: Partial<IMessage> & { pending?: boolean }) {
  const { colorMode } = useColorMode();
  const { publicKey } = useWallet();
  const { info: profile } = useProfile(profileKey);
  const id = profile?.ownerWallet.toBase58();
  const uid = publicKey?.toBase58();

  const status = pending ? "Pending" : "Confirmed";

  let message;
  try {
    message = decodedMessage && JSON.parse(decodedMessage).text;
  } catch (e: any) {
    message = decodedMessage;
  }

  const usernameColor = { light: "green.500", dark: "green.200" };
  const textColor = { light: "black", dark: "white" };
  return (
    <HStack w="full" align="start" spacing={2}>
      <Avatar mt="6px" size="sm" src={profile?.imageUrl} />
      <VStack w="full" align="start" spacing={0}>
        <Text
          fontSize="sm"
          mb="-4px"
          fontWeight="semibold"
          color={uid == id ? "blue.500" : usernameColor[colorMode]}
        >
          {profile?.username}
        </Text>
        <Box
          w="fit-content"
          position="relative"
          textAlign={"left"}
          wordBreak="break-word"
          color={textColor[colorMode]}
        >
          <Text>{message}</Text>
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
