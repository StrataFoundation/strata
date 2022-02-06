import { Box, Heading, HStack, Image, SimpleGrid, VStack } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { AuthorityAndTokenInfo } from "./AuthorityAndTokenInfo";
import { BountyCardContribution } from "./BountyCardContribution";

export const BountyCard = ({ mintKey }: { mintKey: PublicKey }) => {
  return (
    <HStack
      align="flex-start"
      spacing={4}
      _hover={{ backgroundColor: "gray.100", cursor: "pointer" }}
      padding={8}
    >
      <Image
        w="45px"
        h="45px"
        src="https://strataprotocol.com/img/logo.png"
        alt="Hey"
      />
      <SimpleGrid columns={[1, 2]} gap={4}>
        <VStack maxWidth="500px" spacing={4} align="left">
          <Heading fontSize="20px" size="md">
            Web Developer. provider does not catch new events/block updates
          </Heading>
          <AuthorityAndTokenInfo mintKey={mintKey} />
        </VStack>
        <Box justifySelf={[null, "flex-end"]} alignSelf="center" align="left">
          <BountyCardContribution amount={25324654.23} symbol="NAS" />
        </Box>
      </SimpleGrid>
    </HStack>
  );
};
