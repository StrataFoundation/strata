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
  Link,
  Input,
  Slider,
  SliderMark,
  SliderTrack,
  SliderThumb,
  SliderFilledTrack,
} from "@chakra-ui/react";
import { useErrorHandler, useProvider } from "@strata-foundation/react";
import { initStorageIfNeeded } from "@strata-foundation/chat";
import React, { useMemo, useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import { AiOutlinePlus } from "react-icons/ai";
import { useLoadDelegate } from "../hooks";
import { WalletIcon, StrataIcon } from "../svg";
import { numberWithCommas } from "@strata-foundation/spl-utils";

export const LoadWalletModal = (
  props: Partial<ModalProps> & { onLoaded: () => void }
) => {
  const {
    delegateWallet,
    loading: loadingDelegate,
    loadDelegate,
    error: delegateError,
    needsInit,
    needsTopOff,
  } = useLoadDelegate();
  const [sliderValue, setSliderValue] = React.useState(50);

  const sol = useMemo(() => {
    return (sliderValue / 100) * 0.1;
  }, [sliderValue]);
  const messages = useMemo(() => {
    return sol / 0.000005;
  }, [sol]);

  const { handleErrors } = useErrorHandler();
  handleErrors(delegateError);

  const exec = async () => {
    await loadDelegate(sol);
    props.onLoaded();
  };

  const labelStyles = {
    mt: "2",
    ml: "-2.5",
    fontSize: "sm",
  };

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
                Let&apos;s load up your Chat Wallet
              </Text>
              <Text textAlign="center">
                Strata Chat loads a hot wallet in your local storage. This helps
                us avoid asking for approval for every message. Load it up with as many messages as you want 
                now, you can always top it off later!
              </Text>
              <Center>
                <Text fontWeight="bold">◎{numberWithCommas(sol, 3)} ({numberWithCommas(messages, 0)} messages)</Text>
              </Center>
              <Box pt={0} pb={2}>
                <Slider
                  min={1}
                  onChange={(val) =>
                    setSliderValue(val)
                  }
                >
                  <SliderMark value={1} {...labelStyles}>
                    0
                  </SliderMark>
                  <SliderMark value={50} {...labelStyles}>
                    0.05
                  </SliderMark>
                  <SliderMark value={100} {...labelStyles}>
                    0.1
                  </SliderMark>
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </Box>
            </VStack>
            <Button
              mt={4}
              variant="solid"
              colorScheme="primary"
              onClick={() => exec()}
              loadingText={"Loading Hot Wallet..."}
              isLoading={loadingDelegate}
            >
              {needsInit ? "Create Hot Wallet" : "Load Hot Wallet"}
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
