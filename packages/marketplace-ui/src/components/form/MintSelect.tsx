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
  const escFunction = useCallback((event) => {
    if (event.key === "Escape") {
      onClose();
    }
  }, []);
  const backgroundColor = useColorModeValue("white", "black.300");

  useEffect(() => {
    document.addEventListener("keydown", escFunction, false);

    return () => {
      document.removeEventListener("keydown", escFunction, false);
    };
  }, []);

  return (
    <>
      {!isOpen && (
        <InputGroup size="md">
          <Input value={value} onChange={(e) => onChange(e.target.value)} />
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
      )}
      {isOpen && (
        <Box>
          <TokenSearch
            includeSol
            resultsStackProps={{
              zIndex: 1000,
              position: "absolute",
              rounded: "lg",
              shadow: "lg",
              maxHeight: "500px",
              overflow: "auto",
              backgroundColor,
              top: "110px",
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
      )}
    </>
  );
};
