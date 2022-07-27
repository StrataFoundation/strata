import React from "react";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Box,
  CloseButton,
  HStack,
  Image,
  Skeleton,
  Text,
  useColorModeValue,
  VStack
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useMetaplexTokenMetadata } from "@strata-foundation/react";

export interface IMintedNftNotificationProps {
  onDismiss?: () => void;
  mint: PublicKey;
}

export const MintedNftNotification = ({
  onDismiss,
  mint,
}: IMintedNftNotificationProps) => {
  const { metadata, image, loading } = useMetaplexTokenMetadata(mint);
  return (
    <Alert
      w="full"
      bgColor={useColorModeValue("white", "black.300")}
      borderTop="1px"
      borderTopColor="gray.600"
      rounded="lg"
      fontFamily="body"
      color={useColorModeValue("black", "white")}
      status={"success"}
      flexDirection="column"
      p={0}
    >
      <Box w="full">
        {(loading || !image) && <Skeleton w="full" h="327px" />}
        {!loading && image && (
          <Image
            objectFit="cover"
            alt={metadata?.data.name}
            w="full"
            minH="327px"
            src={image}
          />
        )}
      </Box>
      <VStack
        align="left"
        w="full"
        p={8}
        spacing={1}
        borderWidth="2px"
        borderTopWidth={0}
        borderBottomRadius="8px"
        borderColor={useColorModeValue("gray.200", "black.300")}
      >
        <HStack align="left" spacing={1}>
          <AlertTitle fontSize="24px" fontWeight={700}>
            Success!
          </AlertTitle>
          <AlertIcon />
        </HStack>
        <Text color="gray.400">
          {loading
            ? "Waiting on your preview..."
            : `Here is a preview of ${metadata ? metadata.data.name : ""}`}
        </Text>
      </VStack>
      <CloseButton
        position="absolute"
        right="8px"
        top="8px"
        color={useColorModeValue("gray.600", "gray.400")}
        _hover={{ color: "gray.600", cursor: "pointer" }}
        onClick={onDismiss}
      />
    </Alert>
  );
};
