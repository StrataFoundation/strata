import React from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  useColorMode,
  useMediaQuery,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useChat } from "../../hooks/useChat";

export function RoomsHeader({ chatKey }: { chatKey?: PublicKey }) {
  const { info: chat } = useChat(chatKey);
  const [isMobile] = useMediaQuery("(max-width: 680px)");
  const { colorMode } = useColorMode();
  //filter out other users so only avatars of other users show up
  // const timeAgo = chatData.lastSent ? formatDistanceToNowStrict(new Date(chatData?.lastSent.toDate())) : "Not available"
  const timeAgo = "Not Available";

  return (
    <Flex
      align="center"
      justify="space-between"
      width="100%"
      p="10px"
      borderBottom="1px solid"
      borderColor={colorMode === "light" ? "gray.200" : "gray.700"}
      direction="row"
    >
      <Box maxWidth="70%">
        <Heading size={isMobile ? "md" : "lg"} isTruncated>
          {chat?.name}
        </Heading>
        {!isMobile && <Text>Last Active: {timeAgo}</Text>}
      </Box>
    </Flex>
  );
}
