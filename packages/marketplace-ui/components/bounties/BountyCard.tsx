import { Box, Heading, HStack, Image, Link, SimpleGrid, VStack, Text } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useReserveAmount, useTokenBondingFromMint, useTokenMetadata } from "@strata-foundation/react";
import { route, routes } from "utils/routes";
import { AuthorityAndTokenInfo } from "./AuthorityAndTokenInfo";
import { BountyCardContribution } from "./BountyCardContribution";
import moment from "moment";

export const BountyCard = ({ mintKey }: { mintKey: PublicKey }) => {
  const { image, displayName } = useTokenMetadata(mintKey);
  const { info: tokenBonding } = useTokenBondingFromMint(mintKey);
  const { metadata } = useTokenMetadata(tokenBonding?.baseMint);
  const reserveAmount = useReserveAmount(tokenBonding?.publicKey);
  return (
    <HStack
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
      <Image w="45px" h="45px" src={image} alt={displayName} />
      <SimpleGrid columns={[1, 2]} gap={4}>
        <VStack maxWidth="500px" spacing={4} align="left">
          <Heading fontSize="20px" size="md">
            {displayName}
          </Heading>
          <AuthorityAndTokenInfo mintKey={mintKey} />
          {tokenBonding && (
            <Text color="gray.400">
              Created{" "}
              {moment(tokenBonding.goLiveUnixTime.toNumber() * 1000).fromNow()}
            </Text>
          )}
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
