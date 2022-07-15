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
import { PublicKey } from "@solana/web3.js";
import { useTokenBondingFromMint } from "@strata-foundation/react";
import { LaunchPreview } from "./LaunchPreview";

interface TokenPreviewProps {
  mintKey: PublicKey | undefined;
}

export const TokenLaunches = ({ mintKey }: TokenPreviewProps) => {
  // TODO can there be multiple valid token bondings?
  // TODO has to account for fungible entanglers securely
  const { info: tokenBonding } = useTokenBondingFromMint(mintKey);
  console.log(tokenBonding);
  return (
    <Box bgColor="white" borderRadius="8px" w="full">
      {tokenBonding ? (
        <LaunchPreview />
      ) : (
        <Text padding="30px">Launch a token offering</Text>
      )}
    </Box>

  );
};
  