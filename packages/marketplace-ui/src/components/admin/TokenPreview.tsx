import {
  Alert,
  Box,
  Image,
  Button,
  Container,
  Center,
  Stack,
  Text,
  Collapse,
  Flex,
  Input,
  Switch,
  VStack,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { usePublicKey, useTokenMetadata } from "@strata-foundation/react";
import { PublicKey } from "@solana/web3.js";

interface TokenPreviewProps {
  mintKey: PublicKey | undefined
}

export const TokenPreview = ({ mintKey }: TokenPreviewProps) => {
  const { metadata, data, image } = useTokenMetadata(mintKey);
  return (
    <Flex>
      <Image
        alt="Token logo"
        w="70px"
        h="70px"
        borderRadius="50%"
        src={image}
      />
      <Stack paddingLeft="10px">
        <Text 
          fontSize="2xl" 
          color="white" 
          textAlign="left" 
          fontWeight="bold"
        >
          {data?.name}
        </Text>
        <Text 
          fontSize="md" 
          color="white" 
          marginTop="0 !important"
        >
            ${data?.symbol}
          </Text>
      </Stack>


    </Flex>
      
  );
};
  