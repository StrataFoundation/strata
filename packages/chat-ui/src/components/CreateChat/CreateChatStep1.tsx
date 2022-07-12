import React from "react";
import {
  VStack,
  Box,
  Text,
  ButtonGroup,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
} from "@chakra-ui/react";

interface ICreateChatStep1Props {
  onBack: () => void;
  onNext: () => void;
}

export const CreateChatStep1: React.FC<ICreateChatStep1Props> = ({
  onBack,
  onNext,
}) => {
  const inputBg = { bg: "gray.200", _dark: { bg: "gray.800" } };
  const helpTextColor = { color: "black", _dark: { color: "white" } };

  return (
    <VStack w="full" alignItems="start" gap={8} spacing={0}>
      <Box>
        <Text fontWeight="bold" fontSize="md">
          Let's Start with the Basic info
        </Text>
        <Text fontSize="xs" fontWeight="normal">
          What do you want your chat to be called?
        </Text>
      </Box>
      <FormControl>
        <FormLabel htmlFor="name">Name</FormLabel>
        <Input id="name" variant="filled" {...inputBg} />
        <FormHelperText fontSize="xs" {...helpTextColor}>
          The name that will appear in the sidebar.
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="identifier">Identifier</FormLabel>
        <Input id="identifier" variant="filled" {...inputBg} />
        <FormHelperText fontSize="xs" {...helpTextColor}>
          A NFT representing ownership of the chat.
        </FormHelperText>
      </FormControl>
      <ButtonGroup variant="outline" colorScheme="primary" w="full">
        <Button w="full" onClick={onBack}>
          Back
        </Button>
        <Button w="full" variant="solid" type="submit">
          Next
        </Button>
      </ButtonGroup>
    </VStack>
  );
};
