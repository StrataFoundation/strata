import {
  Text,
  HStack,
  Box,
  Icon,
  IconButton,
  useColorModeValue,
  TextProps,
  BoxProps,
} from "@chakra-ui/react";
import React from "react";
import { Notification } from "@strata-foundation/react";
import toast from "react-hot-toast";
import { BsClipboard } from "react-icons/bs";

export function CopyBlackBox({ text, ...rest }: { text: string } & BoxProps ) {
  return (
    <Box
      p={4}
      rounded="lg"
      bg={useColorModeValue("gray.200", "gray.800")}
      {...rest}
    >
      <HStack justify="space-between">
        <Text>{text}</Text>
        <IconButton
          variant="ghost"
          colorScheme="primary"
          aria-label="Copy to Clipboard"
          onClick={() => {
            navigator.clipboard.writeText(text);
            toast.custom((t) => (
              <Notification
                show={t.visible}
                type="info"
                heading="Copied to Clipboard"
                message={text}
                onDismiss={() => toast.dismiss(t.id)}
              />
            ));
          }}
          icon={<Icon as={BsClipboard} />}
        />
      </HStack>
    </Box>
  );
}
