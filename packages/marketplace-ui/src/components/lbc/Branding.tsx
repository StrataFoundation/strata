import {
  Text,
  Link,
  Image,
  HStack,
  VStack,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { StrataIcon, MetaplexIcon } from "../svgs"

export const Branding = () => (
  <VStack spacing={0}>
    <Text fontSize="14px" color="gray.400">
      Powered By
    </Text>
    <HStack spacing={4}>
      <Link isExternal href="https://strataprotocol.com">
        <Icon
          color={useColorModeValue("black", "white")}
          as={StrataIcon}
          w="72px"
          h="29px"
        />
      </Link>
      <Link isExternal href="https://metaplex.com">
        <Icon
          color={useColorModeValue("black", "white")}
          as={MetaplexIcon}
          w="80px"
        />
      </Link>
    </HStack>
  </VStack>
);
