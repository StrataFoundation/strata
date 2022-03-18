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
  VStack,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useTokenMetadata } from "@strata-foundation/react";
import React from "react";

export interface IMintedNftNotificationProps {
  onDismiss?: () => void;
  mint: PublicKey;
}

export const MintedNftNotification = ({
  onDismiss,
  mint,
}: IMintedNftNotificationProps) => {
  const { metadata, image, loading } = useTokenMetadata(mint);
  return (
    <Alert
      w="full"
      bgColor="black.300"
      borderTop="1px"
      borderTopColor="gray.600"
      rounded="lg"
      fontFamily="body"
      color="white"
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
      <VStack align="left" w="full" p={8} spacing={1}>
        <HStack align="left" spacing={1}>
          <AlertTitle fontSize="24px" fontWeight={700}>
            Success!
          </AlertTitle>
          <AlertIcon />
        </HStack>
        <Text color="gray.400">
          {loading
            ? "Waiting on your preview..."
            : `Here is a preview of your NFT: ${
                metadata ? metadata.data.name : ""
              }`}
        </Text>
      </VStack>
      <CloseButton
        position="absolute"
        right="8px"
        top="8px"
        color="gray.400"
        _hover={{ color: "gray.600", cursor: "pointer" }}
        onClick={onDismiss}
      />
    </Alert>
  );
};
