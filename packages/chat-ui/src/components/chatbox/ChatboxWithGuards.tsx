import {
  Avatar,
  Flex,
  Box,
  Button,
  Divider,
  HStack,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  roundToDecimals,
  useErrorHandler,
  useMint,
  useTokenMetadata,
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { useChatPermissionsFromChat } from "../../hooks";
import React, { useRef } from "react";
import { useLoadDelegate } from "../../hooks";
import { useChatOwnedAmounts } from "../../hooks/useChatOwnedAmounts";
import { BuyMoreButton } from "../BuyMoreButton";
import { LoadWalletModal } from "../LoadWalletModal";
import { Chatbox, chatProps } from "./Chatbox";
import { NATIVE_MINT } from "@solana/spl-token";

const DARK_BG = {
  bg: "linear-gradient(0deg, rgba(17,24,39) 40%, rgba(21,24,38,0) 100%)",
};

export function ChatboxWithGuards({
  scrollRef,
  chatKey,
  onAddPendingMessage,
  files,
  setFiles,
  onUploadFile,
}: chatProps) {
  const myScrollRef = useRef(null);
  if (!scrollRef) scrollRef = myScrollRef;

  const {
    isOpen: loadWalletIsOpen,
    onOpen: onOpenLoadWallet,
    onClose: onCloseLoadWallet,
  } = useDisclosure();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const {
    delegateWallet,
    needsTopOff,
    needsInit,
    loading: loadingDelegate,
    error: delegateError,
  } = useLoadDelegate();
  const {
    isOpen: delegateIsOpen,
    onClose: closeDelegate,
    onOpen: openDelegate,
  } = useDisclosure({
    defaultIsOpen: false,
  });
  const { handleErrors } = useErrorHandler();
  const { info: chatPermissions } = useChatPermissionsFromChat(chatKey);
  const { metadata: readMetadata, image: readImage } = useTokenMetadata(
    chatPermissions?.readPermissionKey
  );

  const { metadata: postMetadata, image: postImage } = useTokenMetadata(
    chatPermissions?.postPermissionKey
  );
  const { ownedReadAmount, ownedPostAmount, isSame } = useChatOwnedAmounts(
    publicKey || undefined,
    chatKey
  );
  const mint = useMint(chatPermissions?.postPermissionKey);
  const postAmount =
    chatPermissions?.postPermissionAmount &&
    mint &&
    toNumber(chatPermissions?.postPermissionAmount, mint);

  const hasEnough =
    typeof postAmount == "undefined" ||
    typeof ownedPostAmount == "undefined" ||
    ownedPostAmount >= postAmount;

  handleErrors(delegateError);

  return (
    <Flex w="full" position="relative">
      {!connected || !hasEnough || needsTopOff ? (
        <Flex
          position="absolute"
          bottom="0"
          pb={12}
          pt={40}
          w="full"
          justify="center"
          bg="linear-gradient(0deg, rgba(255,255,255) 40%, rgba(255,255,255,0) 100%)"
          _dark={DARK_BG}
        >
          <VStack
            w="full"
            h="full"
            justify="center"
            align="center"
            maxW="360px"
          >
            {!connected ? (
              <>
                <Button
                  size="md"
                  colorScheme="primary"
                  onClick={() => setVisible(true)}
                  px={16}
                >
                  Connect Wallet
                </Button>
              </>
            ) : !hasEnough ? (
              <>
                <Text fontWeight="bold" align="center">
                  In order to participate in this chat:
                </Text>
                <Box w="full" fontSize="sm">
                  {readMetadata && (
                    <HStack spacing={1}>
                      <Text>Read Message</Text>
                      <Flex grow={1}>
                        <Divider variant="dashed" />
                      </Flex>
                      <Text fontWeight="bold" textTransform="capitalize">
                        Hold 1
                      </Text>
                      <Avatar
                        w="18px"
                        h="18px"
                        title={readMetadata?.data.symbol}
                        src={readImage}
                      />
                    </HStack>
                  )}
                  {postMetadata && (
                    <HStack spacing={1}>
                      <Text>Post Message</Text>
                      <Flex grow={1}>
                        <Divider variant="dashed" />
                      </Flex>
                      <Text fontWeight="bold" textTransform="capitalize">
                        {
                          Object.keys(
                            chatPermissions?.postPermissionAction || {}
                          )[0]
                        }{" "}
                        {postAmount}
                      </Text>
                      <Avatar
                        w="18px"
                        h="18px"
                        title={postMetadata?.data.symbol}
                        src={postImage}
                      />
                    </HStack>
                  )}
                </Box>
                <Box w="full" fontSize="sm">
                  {readMetadata && (
                    <HStack spacing={1}>
                      <Text>You currently have</Text>
                      <Flex grow={1}>
                        <Divider variant="dashed" />
                      </Flex>
                      <Text fontWeight="bold" textTransform="capitalize">
                        {ownedReadAmount
                          ? roundToDecimals(ownedReadAmount, 4)
                          : 0}
                      </Text>
                      <Avatar
                        w="18px"
                        h="18px"
                        title={readMetadata?.data.symbol}
                        src={readImage}
                      />
                    </HStack>
                  )}
                  {!isSame && postMetadata && (
                    <HStack spacing={1}>
                      <Text>You currently have</Text>
                      <Flex grow={1}>
                        <Divider variant="dashed" />
                      </Flex>
                      <Text fontWeight="bold" textTransform="capitalize">
                        {ownedPostAmount
                          ? roundToDecimals(ownedPostAmount, 4)
                          : 0}
                      </Text>
                      <Avatar
                        w="18px"
                        h="18px"
                        title={postMetadata?.data.symbol}
                        src={postImage}
                      />
                    </HStack>
                  )}
                </Box>
                <Box pt={4}>
                  <BuyMoreButton
                    mint={chatPermissions?.readPermissionKey}
                    btnProps={{ px: 16, size: "md", variant: "solid" }}
                  />
                  {!isSame &&
                    chatPermissions &&
                    !NATIVE_MINT.equals(chatPermissions?.postPermissionKey) && (
                      <BuyMoreButton
                        mint={chatPermissions?.postPermissionKey}
                        btnProps={{ px: 16, size: "md", variant: "solid" }}
                      />
                    )}
                </Box>
              </>
            ) : needsTopOff ? (
              <>
                <LoadWalletModal
                  isOpen={loadWalletIsOpen}
                  onClose={onCloseLoadWallet}
                  onLoaded={() => onCloseLoadWallet()}
                />
                <Flex justify="center" mb="6px">
                  <Button
                    isLoading={loadingDelegate}
                    size="md"
                    colorScheme="primary"
                    onClick={() => onOpenLoadWallet()}
                    px={16}
                  >
                    Top Off Chat Wallet
                  </Button>
                </Flex>
              </>
            ) : null}
          </VStack>
        </Flex>
      ) : (
        <VStack w="full">
          {!delegateWallet && (
            <HStack mb={-3} mt={1} fontSize="sm">
              <Text fontWeight="bold">Tired of approving transactions?</Text>
              <Button
                fontSize="sm"
                variant="link"
                size="md"
                colorScheme="primary"
                onClick={() => openDelegate()}
                px={16}
              >
                Load Delegate Wallet
              </Button>
            </HStack>
          )}

          {(needsTopOff || needsInit) && (
            <LoadWalletModal
              isOpen={delegateIsOpen}
              onClose={closeDelegate}
              onLoaded={closeDelegate}
            />
          )}

          <Chatbox
            scrollRef={scrollRef}
            chatKey={chatKey}
            onAddPendingMessage={onAddPendingMessage}
            files={files}
            setFiles={setFiles}
            onUploadFile={onUploadFile}
          />
        </VStack>
      )}
    </Flex>
  );
}
