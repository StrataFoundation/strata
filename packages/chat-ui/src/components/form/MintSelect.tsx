import React from "react";
import {
  useColorModeValue,
  Box,
  Button,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  useDisclosure,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { TokenSearch } from "@strata-foundation/react";
import { useCallback, useEffect } from "react";
import { AiOutlineSearch } from "react-icons/ai";

export const MintSelect = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (i: string) => void;
}) => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const { publicKey } = useWallet();
  const escFunction = useCallback((e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    }
  }, []);

  const inputBg = { bg: "gray.200", _dark: { bg: "gray.800" } };
  const backgroundColor = useColorModeValue("gray.200", "gray.800");

  useEffect(() => {
    document.addEventListener("keydown", escFunction, true);

    return () => {
      document.removeEventListener("keydown", escFunction, true);
    };
  }, []);

  return !isOpen ? (
    <InputGroup size="md" variant="filled">
      <Input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        fontSize="sm"
        {...inputBg}
      />
      <InputRightElement width="5.5rem">
        <Button
          isDisabled={!publicKey}
          h="1.75rem"
          size="sm"
          onClick={() => (isOpen ? onClose() : onOpen())}
        >
          <Icon as={AiOutlineSearch} />
          {publicKey ? "Wallet" : "No Wallet"}
        </Button>
      </InputRightElement>
    </InputGroup>
  ) : (
    <Box {...inputBg}>
      <TokenSearch
        includeSol
        resultsStackProps={{
          zIndex: 1000,
          position: "absolute",
          rounded: "lg",
          shadow: "lg",
          maxHeight: "400px",
          overflow: "auto",
          backgroundColor,
          top: "90px",
        }}
        placeholder="Press Escape to Close"
        onSelect={(t) => {
          const mint = t.account?.mint;
          if (mint) {
            onChange(mint.toBase58());
            onClose();
          }
        }}
      />
    </Box>
  );
};
