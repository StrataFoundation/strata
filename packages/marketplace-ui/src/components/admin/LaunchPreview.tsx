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
import { useReserveAmount, useTokenSwapFromId } from "@strata-foundation/react";
import { MdSettings } from "react-icons/md";
import { LaunchSettingsModal } from "./LaunchSettingsModal";


interface LaunchPreviewProps {
  id: PublicKey;
  name: string | undefined;
  image: string | undefined;
}

export const LaunchPreview = ({ id, name, image }: LaunchPreviewProps) => {
  const { tokenBonding, childEntangler, parentEntangler } = useTokenSwapFromId(id);
  const { isOpen, onToggle, onClose } = useDisclosure();
  const reserveAmount = useReserveAmount(tokenBonding?.publicKey);
  return (
    <Flex alignItems="center" w="full">
      <Image
        alt="Token logo"
        marginLeft="2em"
        w="50px"
        h="50px"
        borderRadius="50%"
        src={image}
      />
      <Stack paddingLeft="10px">
        <Text 
          fontSize="2xl" 
          textAlign="left" 
          fontWeight="bold"
        >
          {name}
        </Text>
        <Text 
          fontSize="md" 
          marginTop="0 !important"
        >
          Amount raised: {reserveAmount} 
          </Text>
      </Stack>
      <Icon w="24px" h="24px" as={MdSettings} onClick={onToggle} cursor="pointer" marginLeft="auto" marginRight="2em" />
      <LaunchSettingsModal id={id} isOpen={isOpen} onClose={onClose} />
    </Flex>
  );
};
    