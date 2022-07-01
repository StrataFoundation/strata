import React from "react";
import { IconButton } from "@chakra-ui/react";
import { FiMenu } from "react-icons/fi";
import { Flex } from "./MyFlex";

interface IHeaderProps {
  onSidebarOpen(): void;
}

export const Header: React.FC<IHeaderProps> = ({ children, onSidebarOpen }) => (
  <Flex
    as="header"
    align="center"
    justify="space-between"
    w="full"
    px="4"
    zIndex="sticky"
    bg="white"
    _dark={{
      bg: "gray.900",
    }}
    borderBottomWidth="1px"
    color="inherit"
    minH="16"
  >
    <IconButton
      aria-label="Menu"
      display={{
        base: "inline-flex",
        md: "none",
      }}
      onClick={onSidebarOpen}
      icon={<FiMenu />}
      size="md"
    />
    <Flex align="center" w="full">
      {children}
    </Flex>
  </Flex>
);
