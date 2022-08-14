import {
  Box,
  Button,
  Center,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  useColorModeValue,
  VStack,
} from "@chakra-ui/react";
import { ChatSdk } from "@strata-foundation/chat";
import { useErrorHandler } from "@strata-foundation/react";
import React, { useEffect, useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { AiOutlinePlus } from "react-icons/ai";
import { useChatSdk } from "../contexts/chatSdk";
import {
  delegateWalletStorage,
  useDelegateWallet,
} from "../hooks/useDelegateWallet";
import { StrataIcon } from "../svg/Strata";
import { WalletIcon } from "../svg/Wallet";
import { LitProtocolWarning } from "./LitProtocolWarning";

async function migrate(
  mnemonic: string | undefined,
  chatSdk: ChatSdk | undefined
) {
  if (mnemonic && chatSdk) {
    await chatSdk?.initializeSettings({
      settings: {
        delegateWalletSeed: mnemonic,
      },
    });
    localStorage.removeItem(
      delegateWalletStorage.storageKey(chatSdk.provider.wallet.publicKey)
    );
  }
}

const DARK_BG = { bg: "gray.800" };

export const LegacyWalletMigrationModal = () => {
  const { legacyMnemonic } = useDelegateWallet();
  const { chatSdk } = useChatSdk();
  const { handleErrors } = useErrorHandler();
  const [isOpen, setIsOpen] = useState(false);
  const {
    execute: exec,
    loading: migrating,
    error,
  } = useAsyncCallback(migrate);
  handleErrors(error);
  useEffect(() => {
    if (legacyMnemonic) {
      setIsOpen(true);
    }
  }, [legacyMnemonic]);

  if (legacyMnemonic) {
    return (
      <Modal size="xl" isOpen={isOpen} onClose={() => {}} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="xl" shadow="xl">
          <ModalBody p={0}>
            <Box
              position="relative"
              p={12}
              pt={10}
              pb={14}
              borderTopRadius="lg"
              bg={"gray.200"}
              _dark={DARK_BG}
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
              <Text textAlign="center" fontSize="xl" fontWeight="bold">
                Migrate chat wallet with Lit Protocol
              </Text>
              <LitProtocolWarning />
              <Button
                variant="solid"
                colorScheme="primary"
                onClick={async () => {
                  await exec(legacyMnemonic, chatSdk);
                  setIsOpen(false);
                }}
                loadingText={"Migrating..."}
                isLoading={migrating}
              >
                Migrate
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return <div />;
};
