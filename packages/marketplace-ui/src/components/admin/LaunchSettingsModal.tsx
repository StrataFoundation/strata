import {
  Image,
  Stack,
  Text,
  Flex,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  useDisclosure,
} from "@chakra-ui/react";
import React from 'react';
import { PublicKey } from '@solana/web3.js';
import { useTokenSwapFromId } from "@strata-foundation/react";
import { DisburseFunds } from "..";
  
  
interface LaunchSettingsModalProps {
  id: PublicKey;
  isOpen: boolean;
  onClose: () => void;
}

export const LaunchSettingsModal = ({ id, isOpen, onClose }: LaunchSettingsModalProps) => {
  const { tokenBonding, childEntangler, parentEntangler } = useTokenSwapFromId(id);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered trapFocus>
      <ModalOverlay />
        <ModalContent borderRadius="xl" shadow="xl">
          <ModalHeader>Disburse Funds</ModalHeader>
          <ModalBody minH="500px">
            <DisburseFunds id={id} />
          </ModalBody>
        </ModalContent>
    </Modal>
  );
};
    