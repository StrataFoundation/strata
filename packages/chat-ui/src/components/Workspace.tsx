import React from "react";
import { Flex, useColorModeValue } from "@chakra-ui/react";

interface IWorkspaceProps {}

export const Workspace: React.FC<IWorkspaceProps> = ({ children }) => {
  const bg = useColorModeValue("white", "gray.900");

  return (
    <Flex
      direction="column"
      w="full"
      h="full"
      grow={1}
      bg={bg}
      overflow="hidden"
    >
      {children}
    </Flex>
  );
};
