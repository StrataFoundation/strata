import React from "react";
import { Alert, AlertIcon, Link, Text } from "@chakra-ui/react";

export const LitProtocolWarning = () => {
  return (
    <Alert status="warning">
      <AlertIcon />
      <Text fontSize="sm">
        Do not approve any{" "}
        <Link color="primary.500" href="https://litprotocol.com/">
          Lit Protocol
        </Link>{" "}
        transactions on websites you do not trust. Your chat wallet is
        encrypted and could be decrypted if you give permission. Your chat wallet
        does not give access to your primary wallet, but can be used to impersonate you.
      </Text>
    </Alert>
  );
};
