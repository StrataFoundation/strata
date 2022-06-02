import { Flex, Icon, IconButton, Stack, useColorMode } from '@chakra-ui/react';
import React from "react";
import { IoMoon, IoSunny } from 'react-icons/io5';
import { ProfileButton } from "./ProfileButton";
import { ChatSidebarPreview } from './rooms/ChatSidebarPreview';

const VISIBLE_CHATS = ["open3"]

export const Sidebar = ({ fullWidth }: { fullWidth?: boolean }) => {
  const { colorMode, toggleColorMode } = useColorMode()

  return (
    <Flex
      height="100vh"
      maxWidth={fullWidth ? "100vw" : "30vw"}
      width={fullWidth ? "100vw" : ""}
      direction="column"
      borderRight="1px solid"
      borderColor={colorMode === "light" ? "gray.200" : "gray.700"}
    >
      <Flex flexWrap="wrap" direction="column" position="sticky" top="0">
        <Flex justify="space-between" height="71px" align="center" p="10px">
          {/* <Avatar src={profile?.imageUrl} /> */}
          <Stack
            maxWidth="30vw"
            direction="row"
            w="full"
            align="space-between"
            justifyContent="space-evenly"
          >
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
          </Stack>
        </Flex>
      </Flex>
      <Stack direction="column" overflow="scroll">
        {VISIBLE_CHATS.map((identifier) => (
          <ChatSidebarPreview key={identifier} identifier={identifier} />
        ))}
      </Stack>
    </Flex>
  );
}
