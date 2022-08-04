import {
  Avatar,
  SkeletonCircle,
  SkeletonText,
  Text,
  useColorMode,
  useColorModeValue,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import React from "react";
import { useChat } from "../../hooks/useChat";
import { useChatKeyFromIdentifier } from "../../hooks/useChatKeyFromIdentifier";
import { route, routes } from "../../routes";

export type chatRoomProps = {
  identifier?: string;
  onClick?: () => void;
};

export function ChatSidebarPreview({ identifier, onClick }: chatRoomProps) {
  const { chatKey, loading: loadingId } = useChatKeyFromIdentifier(identifier);
  const { info: chat, loading: loadingChat } = useChat(chatKey);
  const loading = loadingId || loadingChat;
  const { colorMode } = useColorMode();
  const router = useRouter();
  const { id } = router.query;
  const highlightedBg = useColorModeValue("gray.200", "gray.800");
  const subtext = useColorModeValue("gray.500", "gray.400");

  //push to url for specific chat
  const handleClick = async () => {
    await router.push(route(routes.chat, { id: identifier }), undefined, {
      shallow: true,
    });
    onClick && onClick();
  };

  return (
    <Flex
      overflow="none"
      minW="200px"
      align="center"
      bg={identifier === id ? highlightedBg : undefined}
      px={4}
      py={3}
      cursor="pointer"
      borderRadius="10px"
      _hover={{ bg: colorMode === "light" ? "gray.200" : "gray.700" }}
      onClick={handleClick}
    >
      {loading ? (
        <SkeletonCircle mr={2} />
      ) : (
        <Avatar mr={2} size="md" src={chat?.imageUrl} />
      )}
      {loading ? (
        <SkeletonText width="200px" />
      ) : (
        <VStack spacing={0} align="start">
          <Text fontSize="md" _dark={{ color: "white" }}>
            {chat?.name}
          </Text>
          <Text fontSize="sm" color={subtext}>
            {identifier}.chat
          </Text>
        </VStack>
      )}
    </Flex>
  );
}
