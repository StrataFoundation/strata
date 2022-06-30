import React from "react";
import { Flex, useColorModeValue } from "@chakra-ui/react";

interface IWorkspaceProps {}

export const Workspace: React.FC<IWorkspaceProps> = ({ children }) => (
  <Flex
    position="relative"
    direction="column"
    w="full"
    h="full"
    grow={1}
    bg="white"
    _dark={{
      bg: "gray.900",
    }}
    overflow="hidden"
  >
    {children}
  </Flex>
);
