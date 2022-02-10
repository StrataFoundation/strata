import {
  Box,
  Heading,
  HStack,
  Image,
  SimpleGrid,
  VStack,
  Text,
  Skeleton,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import {
  useReserveAmount,
  useTokenBondingFromMint,
  useTokenMetadata,
} from "@strata-foundation/react";
import { route, routes } from "utils/routes";
import { AuthorityAndTokenInfo } from "./AuthorityAndTokenInfo";
import { BountyCardContribution } from "./BountyCardContribution";
import moment from "moment";
import Link from "next/link";

export const BountyCard = ({ mintKey }: { mintKey: PublicKey }) => {
  const { image, displayName, loading } = useTokenMetadata(mintKey);
  const { info: tokenBonding, loading: bondingLoading } = useTokenBondingFromMint(mintKey);
  const { metadata } = useTokenMetadata(tokenBonding?.baseMint);
  const reserveAmount = useReserveAmount(tokenBonding?.publicKey);
  return (
    <HStack
      w="full"
      as={Link}
      href={route(routes.bounty, { mintKey: mintKey.toBase58() })}
      align="flex-start"
      spacing={4}
      _hover={{
        backgroundColor: "gray.100",
        cursor: "pointer",
        textDecoration: "none",
      }}
      padding={8}
    >
      {!loading && <Image w="45px" h="45px" src={image} alt={displayName} />}
      {loading && <Skeleton w="45px" h="45px" />}
      <SimpleGrid columns={[1, 2]} gap={4} w="full">
        <VStack maxWidth="500px" spacing={4} align="left">
          {!loading && displayName && (
            <Heading fontSize="20px" size="md">
              {displayName}
            </Heading>
          )}
          {loading && (
            <VStack w="full" align="left">
              <Skeleton width="full" height="20px" />
              <Skeleton width="50%" height="20px" />
            </VStack>
          )}
          <AuthorityAndTokenInfo mintKey={mintKey} />
          {!bondingLoading && tokenBonding && (
            <Text color="gray.400">
              Created{" "}
              {moment(tokenBonding.goLiveUnixTime.toNumber() * 1000).fromNow()}
            </Text>
          )}
          {bondingLoading && <Skeleton w="80px" />}
        </VStack>
        <Box justifySelf={[null, "flex-end"]} alignSelf="center" align="left">
          <BountyCardContribution
            amount={reserveAmount}
            symbol={metadata?.data.symbol}
          />
        </Box>
      </SimpleGrid>
    </HStack>
  );
};
