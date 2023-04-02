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

export const SiteDisclaimer: FC = () => {
  const { onClose } = useDisclosure();
  const [hasAcknowledged, setHasAcknowledged] = useLocalStorage(
    "siteDisclaimerAcknowledged",
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
          <Text fontWeight="bold">Site Disclaimer</Text>
          <Text fontSize="sm">
            Please note that Strata protocol is maintained by the community, and no longer has a dedicted team.
            It is preserved as a utility to the community, but bug fixes are
            provided on a volunteer basis. It uses a free rpc node, so it may be
            slow or unresponse at times.
          </Text>
          <Text fontSize="sm" mt={4}>
            We strongly recommend that you fork {" "}
            <a href="https://github.com/StrataFoundation/strata">
              https://github.com/StrataFoundation/strata
            </a>{" "}
            and deploy your own marketplace-ui, rather than using this website.
            The free rpc node could cause issues for your users. You should
            also consider employing a developer that understands the technology behind this application
            and can make changes to your token as needed.
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
