import { Text, Link, Image, HStack, VStack } from "@chakra-ui/react";
import React from "react";

export const Branding = () => (
  <VStack>
    <HStack spacing={4}>
      <Link isExternal href="https://strataprotocol.com">
        <Image h="24px" alt="Strata" src="/logo-white.svg" />
      </Link>
      <Link isExternal href="https://metaplex.com">
        <Image h="9px" alt="Metaplex" src="/metaplex-logo.svg" />
      </Link>
    </HStack>
    <Text fontSize="14px" color="gray.400">
      Powered by Strata &amp; Metaplex
    </Text>
  </VStack>
);
