import React, { useEffect } from "react";
import {
  Box,
  Divider,
  Icon,
  IconButton,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import { IoMoon, IoSunny } from "react-icons/io5";
import { ProfileButton } from "./ProfileButton";
import { ChatSidebarPreview } from "./rooms/ChatSidebarPreview";
import { useLocalStorage } from "@strata-foundation/react";
import { VISIBLE_CHATS } from "../constants";
import { useRouter } from "next/router";
import { useChat, useChatKeyFromIdentifier } from "../hooks";
import { Flex } from "./MyFlex";

const DARK_BG = {
  bg: "gray.900",
};

export const Sidebar = (props: any) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const [chats, setChats] = useLocalStorage("chats", VISIBLE_CHATS);
  const router = useRouter();
  const { id } = router.query;
  const { chatKey, loading: loadingId } = useChatKeyFromIdentifier(
    id as string
  );
  const { info: chat } = useChat(chatKey);

  // Make sure all VISIBLE_CHATS are in the chats list
  useEffect(() => {
    if (VISIBLE_CHATS.some((c) => chats.indexOf(c) === -1)) {
      setChats([...new Set([...chats, ...VISIBLE_CHATS])]);
    }
  }, [chats, setChats]);

  useEffect(() => {
    if (chat && id && chats.indexOf(id as string) === -1) {
      setChats([...new Set([...chats, id as string])]);
    }
  }, [setChats, chats, chat, id]);

  return (
    <Flex
      position="relative"
      direction="column"
      h="full"
      grow={1}
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      overflowX="hidden"
      overflowY="auto"
      bg="white"
      _dark={DARK_BG}
      color="inherit"
      borderRightWidth="1px"
      w="80"
      p={4}
      {...props}
    >
      <Flex
        direction="column"
        as="nav"
        fontSize="sm"
        color="gray.600"
        aria-label="Main Navigation"
        grow={1}
        gap={2}
      >
        {chats.map((identifier) => (
          <ChatSidebarPreview key={identifier} identifier={identifier} />
        ))}
        <Divider />
      </Flex>
      <VStack gap={2}>
        <Divider />
        <Flex align="center" justifyContent="space-evenly" w="full" gap={2}>
          <ProfileButton />
          <IconButton
            colorScheme="primary"
            variant="outline"
            aria-label="Toggle Dark Mode"
            icon={
              colorMode === "light" ? (
                <Icon as={IoMoon} />
              ) : (
                <Icon as={IoSunny} />
              )
            }
            onClick={toggleColorMode}
          />
        </Flex>
      </VStack>
    </Flex>
  );
};
