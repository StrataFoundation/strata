import React from "react";
import { VStack, Box, Text, ButtonGroup, Button } from "@chakra-ui/react";

interface ICreateChatStep2Props {
  onBack: () => void;
  onNext: () => void;
}

export const CreateChatStep2: React.FC<ICreateChatStep2Props> = ({
  onBack,
  onNext,
}) => {
  return (
    <VStack w="full" alignItems="start" gap={6} spacing={0}>
      <Box>
        <Text fontWeight="bold" fontSize="md">
          What kind of read messages do you want
        </Text>
        <Text fontSize="xs" fontWeight="normal">
          How do you want to gate the ability to read messages in your chat?
        </Text>
      </Box>
      <ButtonGroup variant="outline" colorScheme="primary" w="full">
        <Button w="full" onClick={onBack}>
          Back
        </Button>
        <Button w="full" variant="solid" onClick={onNext}>
          Next
        </Button>
      </ButtonGroup>
    </VStack>
  );
};
