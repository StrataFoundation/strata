import React from "react";
import { Flex, Box, Icon, IconButton, useColorMode } from "@chakra-ui/react";
import { IoMoon, IoSunny } from "react-icons/io5";
import { ProfileButton } from "./ProfileButton";
import { ChatSidebarPreview } from "./rooms/ChatSidebarPreview";

const VISIBLE_CHATS = ["open"];

export const Sidebar = (props: any) => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box
      as="nav"
      pos="fixed"
      top="0"
      left="0"
      zIndex="sticky"
      h="full"
      pb="10"
      overflowX="hidden"
      overflowY="auto"
      bg="white"
      _dark={{
        bg: "gray.900",
      }}
      color="inherit"
      borderRightWidth="1px"
      w="80"
      {...props}
    >
      <Flex px="4" py="5" align="center" justifyContent="space-evenly">
        <ProfileButton />
        <IconButton
          colorScheme="primary"
          variant="outline"
          aria-label="Toggle Dark Mode"
          icon={
            colorMode === "light" ? <Icon as={IoMoon} /> : <Icon as={IoSunny} />
          }
          onClick={toggleColorMode}
        />
      </Flex>
      <Flex
        direction="column"
        as="nav"
        fontSize="sm"
        color="gray.600"
        aria-label="Main Navigation"
      >
        {VISIBLE_CHATS.map((identifier) => (
          <ChatSidebarPreview key={identifier} identifier={identifier} />
        ))}
      </Flex>
    </Box>
  );
};
