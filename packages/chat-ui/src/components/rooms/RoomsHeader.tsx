import React from "react";
import {
  Avatar,
  Box,
  Flex,
  Heading,
  HStack,
  Text,
  useColorMode,
  useMediaQuery,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useChat } from "../../hooks/useChat";
import { roundToDecimals, useMint, useTokenMetadata } from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";

export function RoomsHeader({ chatKey }: { chatKey?: PublicKey }) {
  const { info: chat } = useChat(chatKey);
  const [isMobile] = useMediaQuery("(max-width: 680px)");
  const { metadata: readMetadata, image: readImage } = useTokenMetadata(
    chat?.readPermissionMint
  );
  const postMint = useMint(chat?.postPermissionMint);
  const { metadata: postMetadata, image: postImage } = useTokenMetadata(chat?.postPermissionMint);
  const { colorMode } = useColorMode();

  return (
    <Flex
      align="center"
      justify="space-between"
      width="100%"
      p="10px"
      borderBottom="1px solid"
      borderColor={colorMode === "light" ? "gray.200" : "gray.700"}
      direction="row"
    >
      <Box maxWidth="70%">
        <Heading size={isMobile ? "md" : "lg"} isTruncated>
          {chat?.name}
        </Heading>
        {!isMobile && (
          <HStack spacing={4}>
            { readMetadata && <HStack spacing={1}>
              <Text>Read: 1 </Text>
              <Avatar
                w="16px"
                h="16px"
                title={readMetadata?.data.symbol}
                src={readImage}
              />
            </HStack> }
            { postMetadata && <HStack spacing={1}>
              <Text>
                Post:
                {chat?.postPermissionAmount &&
                  postMint &&
                  roundToDecimals(
                    toNumber(chat.postPermissionAmount, postMint),
                    4
                  )}
              </Text>
              <Avatar
                w="16px"
                h="16px"
                title={postMetadata?.data.symbol}
                src={postImage}
              />
            </HStack> }
          </HStack>
        )}
      </Box>
    </Flex>
  );
}
