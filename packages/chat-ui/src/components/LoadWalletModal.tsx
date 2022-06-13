import {
  Text,
  ModalContent,
  Modal,
  ModalBody,
  useColorModeValue,
  Box,
  Icon,
  Center,
  VStack,
  HStack,
  Button,
  ModalProps,
} from "@chakra-ui/react";
import { useErrorHandler } from "@strata-foundation/react";
import React from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { useLoadDelegate } from "../hooks";
import { WalletIcon, StrataIcon } from "../svg";

export const LoadWalletModal = (props: Partial<ModalProps> & { onLoaded: () => void}) => {
  const {
    loading: loadingDelegate,
    loadDelegate,
    error: delegateError,
  } = useLoadDelegate();

  const { handleErrors } = useErrorHandler();
  handleErrors(delegateError);

  const exec = async () => {
    await loadDelegate();
    props.onLoaded();
  }

  return (
    <Modal
      isOpen={true}
      size="lg"
      onClose={() => {}}
      isCentered
      trapFocus={true}
      {...props}
    >
      <ModalContent borderRadius="xl" shadow="xl">
        <ModalBody p={0}>
          <Box
            position="relative"
            p={12}
            pt={10}
            pb={14}
            borderTopRadius="lg"
            bg={useColorModeValue("gray.200", "gray.800")}
          >
            <Center>
              <HStack spacing={8}>
                <Icon as={AiOutlinePlus} w="40px" h="40px" color="gray.600" />
                <Icon as={WalletIcon} w="80px" h="80px" />
              </HStack>
            </Center>
            <Icon
              w="62px"
              h="59px"
              position="absolute"
              bottom="-28px"
              right="calc(50% - 31px)"
              as={StrataIcon}
            />
          </Box>
          <VStack spacing={6} align="left" p={12}>
            <VStack spacing={2} align="stretch">
              <Text textAlign="center" fontSize="xl" fontWeight="bold">
                Let&apos;s load up your Chat wallet
              </Text>
              <Text textAlign="center">
                Strata Chat loads a hot wallet in your local storage with{" "}
                <b>0.1 Sol</b>, or <b>20,000 messages</b>. This helps us avoid
                asking for approval for every message.
              </Text>
            </VStack>
            <Button
              mt={4}
              variant="solid"
              colorScheme="primary"
              onClick={() => exec()}
              isLoading={loadingDelegate}
            >
              Load Hot Wallet
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
