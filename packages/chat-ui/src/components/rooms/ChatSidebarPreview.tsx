import { useChatIdFromIdentifierCertificate } from "../../hooks/useChatIdFromIdentifierCertificate";
import {
  Avatar,
  Flex,
  SkeletonCircle,
  SkeletonText,
  Text,
  useColorMode,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { useTokenMetadata } from "@strata-foundation/react";
import { useRouter } from "next/router";
import React from "react";
import { useChat } from "../../hooks/useChat";
import { useChatKeyFromIdentifier } from "../../hooks/useChatKeyFromIdentifier";
import { route, routes } from "../../routes";

export type chatRoomProps = {
  identifier?: string;
};

export function ChatSidebarPreview({ identifier }: chatRoomProps) {
  const { chatKey, loading: loadingId } = useChatKeyFromIdentifier(identifier);
  const { info: chat, loading: loadingChat } = useChat(chatKey);
  const loading = loadingId || loadingChat;
  const { colorMode } = useColorMode();
  const router = useRouter();
  const { id } = router.query;
  const highlightedBg = useColorModeValue("gray.200", "gray.800");
  const subtext = useColorModeValue("gray.500", "gray.400");

  //push to url for specific chat
  const handleClick = () => {
    router.push(route(routes.chat, { id: identifier }));
  };

  return (
    <Flex
      overflow="none"
      minW="200px"
      align="center"
      bg={identifier === id ? highlightedBg : undefined}
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
      {loading ? (
        <SkeletonText width="200px" />
      ) : (
        <VStack spacing={0} align="start">
          <Text fontSize="md" _dark={{ color: "white" }}>
            {chat?.name}
          </Text>
          <Text fontSize="sm" color={subtext}>
            /{identifier}
          </Text>
        </VStack>
      )}
    </Flex>
  );
}
