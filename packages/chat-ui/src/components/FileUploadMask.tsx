import {
  Text, Box,
  Center,
  Flex,
  HStack,
  Icon,
  useColorModeValue,
} from "@chakra-ui/react";
import React from "react";
import { AiOutlineCloudUpload } from "react-icons/ai";

export function FileUploadMask() {
  return (
    <Box position="absolute" w="full" h="full" zIndex="1000">
      <Flex
        w="full"
        justify="center"
        align="center"
        h="full"
        position="absolute"
      >
        <HStack>
          <Icon w="50px" h="50px" as={AiOutlineCloudUpload} />
          <Text fontSize="xl" fontWeight="semibold">
            Upload File
          </Text>
        </HStack>
      </Flex>

      <Flex
        w="full"
        h="full"
        bg={useColorModeValue("white", "black")}
        opacity="0.3"
      />
    </Box>
  );
}