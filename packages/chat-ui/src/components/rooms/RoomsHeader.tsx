import {
  Avatar,
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Switch,
  Text,
  useColorMode,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react";
import { Flex } from "../MyFlex";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Cluster } from "@strata-foundation/accelerator";
import {
  roundToDecimals,
  useAccelerator,
  useEndpoint,
  useLocalStorage,
  useMint,
  useTokenMetadata,
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import debounce from "lodash/debounce";
import React, { useEffect } from "react";
import { RiQuestionLine } from "react-icons/ri";
import { useChatSdk } from "../../contexts/chatSdk";
import { useChatOwnedAmount } from "../../hooks";
import { useChat } from "../../hooks/useChat";
import { BuyMoreButton } from "../BuyMoreButton";

const playSound = debounce(() => {
  const audio = new Audio("/notification.mp3");
  audio.addEventListener("canplaythrough", (event) => {
    // the audio is now playable; play it if permissions allow
    audio.play();
  });
}, 500);

interface ISettings {
  soundEnabled: boolean;
  visualEnabled: boolean;
}

export const RoomsHeader = ({ chatKey }: { chatKey?: PublicKey }) => {
  const { info: chat } = useChat(chatKey);
  const readMintKey = chat?.readPermissionKey;
  const [isMobile] = useMediaQuery("(max-width: 680px)");
  const { metadata: readMetadata, image: readImage } = useTokenMetadata(
    chat?.readPermissionKey
  );
  const readMint = useMint(readMintKey);
  const postMint = useMint(chat?.postPermissionKey);
  const { metadata: postMetadata, image: postImage } = useTokenMetadata(
    chat?.postPermissionKey
  );
  const { colorMode } = useColorMode();
  const { accelerator } = useAccelerator();
  const { cluster } = useEndpoint();
  const { chatSdk } = useChatSdk();
  const { publicKey } = useWallet();
  const { amount: ownedAmount } = useChatOwnedAmount(
    publicKey || undefined,
    chatKey
  );

  const [settings, setSettings] = useLocalStorage<ISettings>("settings", {
    soundEnabled: true,
    visualEnabled: false,
  });

  useEffect(() => {
    const subId = (async () => {
      if (
        accelerator &&
        chatKey &&
        chatSdk &&
        publicKey &&
        (settings.soundEnabled || settings.visualEnabled)
      ) {
        const subId = await accelerator.onTransaction(
          cluster as Cluster,
          chatKey,
          async ({ transaction, txid, blockTime }) => {
            const parts = await chatSdk.getMessagePartsFromInflatedTx({
              txid,
              blockTime,
              transaction: {
                signatures: [txid],
                message: transaction.compileMessage(),
              },
            });
            // Only notify for other people sending message
            if (
              !document.hasFocus() &&
              parts.some((part) => !part.sender.equals(publicKey))
            ) {
              playSound();
            }
          }
        );

        return subId;
      }
    })();
    return () => {
      (async () => {
        const id = await subId;
        if (id && accelerator) {
          accelerator.unsubscribeTransaction(id);
        }
      })();
    };
  }, [settings, publicKey, accelerator, chatSdk, chatKey]);

  return (
    <Flex align="center" justify="space-between" width="100%" direction="row">
      <Heading size={isMobile ? "md" : "md"} isTruncated>
        {chat?.name}
      </Heading>
      {chat?.name && (
        <Popover placement="top-end">
          <PopoverTrigger>
            <Box
              color={colorMode === "light" ? "black" : "white"}
              _hover={{ cursor: "pointer" }}
            >
              <RiQuestionLine size={!isMobile ? 26 : 20} />
            </Box>
          </PopoverTrigger>
          <Portal>
            <PopoverContent
              border={0}
              bg={colorMode === "light" ? "gray.200" : "gray.800"}
              borderRadius={14}
            >
              <PopoverBody py={6} px={4}>
                <VStack alignItems="start" spacing={4}>
                  <Heading size="md">Welcome To {chat.name}</Heading>
                  <Text
                    color={colorMode === "light" ? "black.300" : "gray.400"}
                  >
                    In order to participate in actions in this chat:
                  </Text>
                  <Box w="full" fontSize="sm">
                    {readMetadata && (
                      <HStack spacing={1}>
                        <Text>Read Message</Text>
                        <Flex grow={1}>
                          <Divider variant="dashed" />
                        </Flex>
                        <Text fontWeight="bold" textTransform="capitalize">
                          Hold{" "}
                          {chat?.defaultReadPermissionAmount &&
                            readMint &&
                            roundToDecimals(
                              toNumber(
                                chat.defaultReadPermissionAmount,
                                readMint
                              ),
                              4
                            )}
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
                          {Object.keys(chat?.postPermissionAction || {})[0]}{" "}
                          {chat?.postPermissionAmount &&
                            postMint &&
                            roundToDecimals(
                              toNumber(chat.postPermissionAmount, postMint),
                              4
                            )}
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
                          {ownedAmount ? roundToDecimals(ownedAmount, 4) : 0}
                        </Text>
                        <Avatar
                          w="18px"
                          h="18px"
                          title={readMetadata?.data.symbol}
                          src={readImage}
                        />
                      </HStack>
                    )}
                  </Box>
                  <BuyMoreButton
                    mint={readMintKey}
                    btnProps={{ w: "full", size: "md" }}
                  />
                  <Box w="full">
                    <Divider mt={4} mb={2} />
                  </Box>
                  <Heading size="md">Settings</Heading>
                  <Box w="full">
                    <FormControl
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <FormLabel htmlFor="noise-alerts" mb="0">
                        Sound notifications
                      </FormLabel>
                      <Switch
                        isChecked={settings.soundEnabled}
                        id="noise-alerts"
                        colorScheme="primary"
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            soundEnabled: e.target.checked,
                          })
                        }
                      />
                    </FormControl>
                    {/* <FormControl
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <FormLabel htmlFor="visual-alerts" mb="0">
                        Desktop notifications
                      </FormLabel>
                      <Switch
                        isChecked={settings.visualEnabled}
                        id="visual-alerts"
                        colorScheme="primary"
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            visualEnabled: e.target.checked,
                          })
                        }
                      />
                    </FormControl> */}
                  </Box>
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Portal>
        </Popover>
      )}
    </Flex>
  );
};
