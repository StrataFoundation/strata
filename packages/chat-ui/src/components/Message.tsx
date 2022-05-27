import React from "react";
import { Box, Text, useColorMode } from "@chakra-ui/react";
import { IMessage } from "@strata-foundation/chat";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProfile } from "../hooks";

export function Message({ decodedMessage, profileKey }: IMessage) {
  const { colorMode } = useColorMode();
  const { publicKey } = useWallet();
  const { info: profile } = useProfile(profileKey);
  const id = profile?.publicKey.toBase58();
  const uid = publicKey?.toBase58();

  const bgColor = { light: "gray.300", dark: "gray.600" };
  const textColor = { light: "black", dark: "white" };
  return (
    <Box
      bg={uid == id ? "blue.500" : bgColor[colorMode]}
      w="fit-content"
      py={1}
      px={3}
      rounded="xl"
      margin={2}
      ml={uid == id ? "auto" : "0"}
      position="relative"
      textAlign={uid == id ? "right" : "left"}
      wordBreak="break-word"
      color={uid == id ? "white" : textColor[colorMode]}
    >
      <Text>{decodedMessage}</Text>
    </Box>
  );
}
