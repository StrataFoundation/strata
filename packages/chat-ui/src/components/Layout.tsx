import React from "react";
import {
  Box,
  Flex,
  Drawer,
  DrawerOverlay,
  DrawerContent,
} from "@chakra-ui/react";
import { Sidebar } from "@/components/Sidebar";

interface ILayoutProps {
  isSidebarOpen: boolean;
  onSidebarClose(): void;
  onSidebarOpen(): void;
}

export const Layout: React.FC<ILayoutProps> = ({
  children,
  isSidebarOpen,
  onSidebarClose,
}) => (
  <Flex
    as="section"
    bg="gray.50"
    _dark={{
      bg: "gray.900",
    }}
    h="100vh"
    w="100vw"
  >
    <Sidebar
      display={{
        base: "none",
        md: "unset",
      }}
    />
    <Drawer isOpen={isSidebarOpen} onClose={onSidebarClose} placement="left">
      <DrawerOverlay />
      <DrawerContent>
        <Sidebar w="full" borderRight="none" />
      </DrawerContent>
    </Drawer>
    <Flex
      ml={{
        base: 0,
        md: 80,
      }}
      transition=".3s ease"
      direction="column"
      h="full"
      w="full"
    >
      {children}
    </Flex>
  </Flex>
);
