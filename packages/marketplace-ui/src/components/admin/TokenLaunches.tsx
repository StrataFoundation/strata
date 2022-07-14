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
  const tokenBonding = useTokenBondingFromMint(mintKey);
  
  return (
    <>
      {tokenBonding && (
        <Box color="white" borderRadius="8px">
          <LaunchPreview />
        </Box>
      )}
    </>
  );
};
  