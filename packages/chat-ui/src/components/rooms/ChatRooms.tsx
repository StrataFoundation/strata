import React from "react";
import { Flex, Text, useColorMode, SkeletonText } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/router";
import { useChat } from "../../hooks/useChat";

export type chatRoomProps = {
  chatKey?: PublicKey;
};

export function ChatRooms({ chatKey }: chatRoomProps) {
  const { info: chat, loading } = useChat(chatKey);
  const { colorMode } = useColorMode();
  const router = useRouter();

  //push to url for specific chat
  const handleClick = () => {
    router.push(`/rooms/${chat?.identifier}`);
  };

  return (
    <Flex
      minW="200px"
      align="center"
      p={4}
      cursor="pointer"
      _hover={{ bg: colorMode === "light" ? "gray.200" : "gray.700" }}
      onClick={handleClick}
    >
      {loading ? <SkeletonText width="200px" /> : <Text>{chat?.name}</Text>}
    </Flex>
  );
}
