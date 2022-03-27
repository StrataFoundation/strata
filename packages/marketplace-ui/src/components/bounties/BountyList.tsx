import React from "react";
import { StackDivider, VStack } from "@chakra-ui/react";

export const BountyList: React.FC = ({ children }) => {
  return (
    <VStack
      align="left"
      rounded="lg"
      spacing={0}
      backgroundColor="white"
      divider={<StackDivider borderColor="gray.200" />}
    >
      {children}
    </VStack>
  );
};
