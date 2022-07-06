import React, { useEffect, useState } from "react";
import {
  Box,
  Divider,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  useColorMode,
  VStack,
} from "@chakra-ui/react";
import {
  RiSearch2Line,
  RiSunLine,
  RiMoonLine,
  RiAddCircleLine,
} from "react-icons/ri";
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
  const [input, setInput] = useState("");
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

  const handleSearch = (e: React.FormEvent<HTMLInputElement>) => {
    const content = e.currentTarget.value;
    setInput(content);
  };

  return (
    <VStack
      position="relative"
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
      py={4}
      pt={3}
      gap={1}
      {...props}
    >
      <Flex gap={2} px={4} pb={2} w="full">
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <Icon as={RiSearch2Line} />
          </InputLeftElement>
          <Input
            type="search"
            variant="filled"
            placeholder="Search"
            value={input}
            onChange={handleSearch}
          />
        </InputGroup>

        {/* <IconButton
          aria-label="Create Chat"
          padding={0}
          icon={<Icon as={RiAddCircleLine} w={6} h={6} />}
          isDisabled
        /> */}
      </Flex>
      <Flex
        direction="column"
        as="nav"
        w="full"
        px={4}
        fontSize="sm"
        color="gray.600"
        aria-label="Main Navigation"
        grow={1}
        gap={2}
      >
        {chats
          .filter((identifier) => identifier.includes(input))
          .map((identifier) => (
            <ChatSidebarPreview
              key={identifier}
              identifier={identifier}
              onClick={() => setInput("")}
            />
          ))}
      </Flex>
      <VStack gap={2} w="full" px={4}>
        <Divider />
        <Flex align="center" justifyContent="space-evenly" w="full" gap={2}>
          <ProfileButton />
          <IconButton
            colorScheme="primary"
            variant="outline"
            aria-label="Toggle Dark Mode"
            icon={
              colorMode === "light" ? (
                <Icon as={RiMoonLine} />
              ) : (
                <Icon as={RiSunLine} />
              )
            }
            onClick={toggleColorMode}
          />
        </Flex>
      </VStack>
    </VStack>
  );
};
