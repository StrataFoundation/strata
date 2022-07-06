import React from "react";
import { Flex } from "./MyFlex";

interface IWorkspaceProps {}

const DARK_BG = {
  bg: "gray.900",
};

export const Workspace: React.FC<IWorkspaceProps> = ({ children }) => (
  <Flex
    position="relative"
    direction="column"
    w="full"
    h="full"
    grow={1}
    bg="white"
    _dark={DARK_BG}
    overflow="hidden"
  >
    {children}
  </Flex>
);
