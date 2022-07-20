import {
  Text,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  ModalHeader,
} from "@chakra-ui/react";
import React from 'react';
import { PublicKey } from '@solana/web3.js';
import { DisburseFunds } from "..";
  
  
interface LaunchSettingsModalProps {
  id: PublicKey;
  isOpen: boolean;
  onClose: () => void;
}

export const LaunchSettingsModal = ({ id, isOpen, onClose }: LaunchSettingsModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" isCentered trapFocus>
      <ModalOverlay />
        <ModalContent borderRadius="xl" shadow="xl">
          <ModalHeader fontSize="2xl">Launch Settings</ModalHeader>
          <ModalBody minH="500px">
            <Text fontSize="xl" fontWeight="bold">Disburse Funds</Text>
            <Text fontSize="md" color="gray">Retrieve any raised funds and tokens remaining</Text>
            <DisburseFunds id={id} />

            <Text fontSize="xl" fontWeight="bold" mt="20px">Disburse Funds and Close</Text>
            <Text fontSize="md" color="gray">Retrieve funds and close the launch. This will render your launch UI unusable.</Text>
            <DisburseFunds id={id} closeBonding closeEntangler />
          </ModalBody>
        </ModalContent>
    </Modal>
  );
};
    