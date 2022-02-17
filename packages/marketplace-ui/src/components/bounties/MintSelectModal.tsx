import React from 'react';
import { PublicKey } from "@solana/web3.js";
import {
  ButtonProps, Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";
import { MintSelect } from '../form/MintSelect';
import { usePublicKey, useTokenMetadata } from '@strata-foundation/react';

export const MintSelectModal = ({
  onChange,
  value,
  buttonProps,
}: {
  onChange: (pkey: string) => void;
  value: string;
  buttonProps: ButtonProps;
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const mintKey = usePublicKey(value);
  const { metadata, loading } = useTokenMetadata(mintKey);

  return (
    <>
      <Button onClick={onOpen} {...buttonProps}>
        {loading ? (
          <Spinner size="xs" />
        ) : metadata ? (
          metadata.data.symbol
        ) : (
          "All Mints"
        )}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Select Mint</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <MintSelect onChange={onChange} value={value} />
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};