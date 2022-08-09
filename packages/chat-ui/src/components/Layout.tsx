import React from "react";
import {
  Flex,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Sidebar } from "./Sidebar";
import { useWindowSize } from "../hooks/useWindowSize";

interface ILayoutProps {
  isSidebarOpen: boolean;
  onSidebarClose(): void;
  onSidebarOpen(): void;
}

const DARK_BG = {
  bg: "gray.900",
};

const ML = {
  base: 0,
  md: 80,
};
export const Layout: React.FC<React.PropsWithChildren<ILayoutProps>> = ({
  children,
  isSidebarOpen,
  onSidebarClose,
}) => {
  const [width, height] = useWindowSize();
  const breakpointDisplay = useBreakpointValue({
    base: "none",
    md: "unset",
  });
  return (
    <Flex as="section" bg="gray.50" _dark={DARK_BG} h={height} w={width}>
      {breakpointDisplay === "unset" && <Sidebar />}
      <Drawer isOpen={isSidebarOpen} onClose={onSidebarClose} placement="left">
        <DrawerOverlay />
        <DrawerContent>
          {/* Lazy load this sidebar */}
          {isSidebarOpen && (
            <Sidebar w="full" borderRight="none" onClose={onSidebarClose} />
          )}
        </DrawerContent>
      </Drawer>
      <Flex ml={ML} transition=".3s ease" direction="column" h="full" w="full">
        {children}
      </Flex>
    </Flex>
  );
};
