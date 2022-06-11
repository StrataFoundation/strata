import { Text, HStack, Box, Icon, IconButton, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { Notification } from "@strata-foundation/react";
import toast from "react-hot-toast";
import { BsClipboard } from "react-icons/bs";

export function SeedPhrase({ mnemonic }: { mnemonic: string }) {
  return (
    <Box p={4} rounded="lg" bg={useColorModeValue("gray.200", "gray.800")}>
      <HStack justify="space-between">
        <Text>{mnemonic}</Text>
        <IconButton
          variant="ghost"
          colorScheme="primary"
          aria-label="Copy to Clipboard"
          onClick={() => {
            navigator.clipboard.writeText(mnemonic);
            toast.custom((t) => (
              <Notification
                show={t.visible}
                type="info"
                heading="Copied to Clipboard"
                message={mnemonic}
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