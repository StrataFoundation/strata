import React, { useEffect, useState } from "react";
import {
  Divider,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  useColorMode,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { RiSearch2Line, RiSunLine, RiMoonLine } from "react-icons/ri";
import { ProfileButton } from "./ProfileButton";
import { ChatSidebarPreview } from "./rooms/ChatSidebarPreview";
import { useLocalStorage } from "@strata-foundation/react";
import { VISIBLE_CHATS } from "../constants/globals";
import { useRouter } from "next/router";
import { useChat } from "../hooks/useChat";
import { useChatKeyFromIdentifier } from "../hooks/useChatKeyFromIdentifier";
import { CreateChatButton } from "./CreateChat/CreateChatButton";

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
      pt={3}
      pb={0}
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
        <CreateChatButton
          colorScheme="gray"
          rounded="full"
          variant="outline"
          aria-label="Create Chat Button"
        />
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
        overflowY="scroll"
      >
        {chats
          .filter((identifier) => identifier.includes(input))
          .map((identifier) => (
            <ChatSidebarPreview
              onClose={() => {
                setChats([...chats.filter((c) => c !== identifier)]);
              }}
              key={identifier}
              identifier={identifier}
              onClick={() => {
                setInput("");
                props.onClose && props.onClose();
              }}
            />
          ))}
      </Flex>
      <VStack w="full" gap={0} spacing={0} px={0}>
        <Divider />
        <IconButton
          w="full"
          colorScheme="gray"
          variant="ghost"
          rounded="none"
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
        <Divider />
        <Flex
          pt={3.5}
          pb={3.5}
          align="center"
          justifyContent="space-evenly"
          w="full"
        >
          <ProfileButton size="lg" />
        </Flex>
      </VStack>
    </VStack>
  );
};
