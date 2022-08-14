import React from "react";
import { IconButton, Flex } from "@chakra-ui/react";
import { FiMenu } from "react-icons/fi";

interface IHeaderProps {
  onSidebarOpen(): void;
}
//@ts-ignore
export const Header: React.FC<IHeaderProps> = ({ children, onSidebarOpen }) => (
  <Flex
    as="header"
    align="center"
    justify="space-between"
    w="full"
    px={4}
    bg="white"
    _dark={{
      bg: "gray.900",
    }}
    borderBottomWidth="1px"
    color="inherit"
    minH="16"
    gap={4}
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
