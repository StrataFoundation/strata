import { Avatar, Flex, SkeletonCircle, SkeletonText, Text, useColorMode, useColorModeValue } from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";
import { useChat } from "../../hooks/useChat";
import { useChatKey } from "../../hooks/useChatKey";
import { route, routes } from "../../routes";

export type chatRoomProps = {
  identifier?: string;
};

export function ChatSidebarPreview({ identifier }: chatRoomProps) {
  const chatKey = useChatKey(identifier);
  const { info: chat, loading } = useChat(chatKey);
  const { colorMode } = useColorMode();
  const router = useRouter();
  const { id } = router.query;
  const highlightedBg = useColorModeValue("gray.200", "gray.800");

  //push to url for specific chat
  const handleClick = () => {
    router.push(route(routes.chat, { id: chat?.identifier }));
  };

  return (
    <Flex
      minW="200px"
      align="center"
      bg={id == chat?.identifier ? highlightedBg : undefined}
      p={4}
      cursor="pointer"
      _hover={{ bg: colorMode === "light" ? "gray.200" : "gray.700" }}
      onClick={handleClick}
    >
      {loading ? (
        <SkeletonCircle mr={2} />
      ) : (
        <Avatar mr={2} size="md" src={chat?.imageUrl} />
      )}
      {loading ? <SkeletonText width="200px" /> : <Text>{chat?.name}</Text>}
    </Flex>
  );
}
