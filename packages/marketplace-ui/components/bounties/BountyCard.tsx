import { Grid, Heading, HStack, Image, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { roundToDecimals } from "@strata-foundation/react";

function numberWithCommas(x: number): string {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const BountyCardContribution = ({ amount, symbol }: { amount: number, symbol: string}) => {
  return <VStack
    justifySelf={[null, "flex-end"]}
    alignSelf="center"
    align="left"
    spacing={2}
    rounded="lg"
    padding={4}
    border="1px solid"
    borderColor="gray.200"
    minWidth="200px"
  >
    <HStack spacing={2}>
      <Text fontWeight={800} color="gray.700">
        {numberWithCommas(roundToDecimals(amount, 4))}
      </Text>
      <Text color="gray.700">{symbol}</Text>
    </HStack>
    <Text color="gray.500">Contributed</Text>
  </VStack>;
}

export const BountyCard = () => {
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
          <SimpleGrid columns={[1, 1, 2]} fontSize="14px" spacing={4}>
            <HStack spacing={2}>
              <Text fontWeight={800} color="gray.700">
                Authority:{" "}
              </Text>{" "}
              <Text color="gray.500">foo</Text>
            </HStack>
            <HStack spacing={2}>
              <Text fontWeight={800} color="gray.700">
                Authority:{" "}
              </Text>{" "}
              foo
            </HStack>
          </SimpleGrid>
        </VStack>
        <BountyCardContribution amount={25324654.23} symbol="NAS" />
      </SimpleGrid>
    </HStack>
  );
};
