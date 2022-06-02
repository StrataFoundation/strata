import React, { FC } from "react";
import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { useLocalStorage } from "@strata-foundation/react";

export const Disclaimer: FC = () => {
  const { onClose } = useDisclosure();
  const [hasAcknowledged, setHasAcknowledged] = useLocalStorage(
    "strataDisclaimerAcknowledged",
    false
  );

  const handleAcknowledge = () => {
    setHasAcknowledged(true);
  };

  return (
    <Modal isOpen={!hasAcknowledged} onClose={onClose} size="sm" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalBody pt={4} color={useColorModeValue("black", "white")}>
          <Text fontWeight="bold">Disclaimer</Text>
          <Text fontSize="sm">
            Please note that participating in any Strata Protocol launch is a
            high-risk activity. The tokens you may receive in exchange for
            contributing to a launch could go to zero. Strata Protocol is not
            liable for any losses incurred by using our platform.
          </Text>
          <Text fontSize="sm" mt={4}>
            Strata Protocol is open-source and self-service. As a result,
            the Strata team does not perform diligence on projects and
            bears no responsibility for the quality of projects that utilize
            the Strata Launchpad. Be careful and do your own research before
            participating in any Strata Protocol launch.
          </Text>
          <Flex justifyContent="center">
            <Button
              variant="ghost"
              colorScheme="primary"
              onClick={handleAcknowledge}
              _hover={{ bgColor: "transparent" }}
            >
              I Accept
            </Button>
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
