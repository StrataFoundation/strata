import { BountyCard } from "@/components/bounties/BountyCard";
import { BountyList } from "@/components/bounties/BountyList";
import {
  Box, Button, Center, Container, Heading, Icon,
  Input, InputGroup, InputLeftElement, Link, Select, Stack, VStack
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { NextPage } from "next";
import Head from "next/head";
import { AiOutlineSearch } from "react-icons/ai";
import { routes } from "../routes";

export const Bounties: NextPage = () => {
  return (
    <Box w="full" backgroundColor="#f9f9f9" height="100vh" overflow="auto">
      <Head>
        <title>Strata Bounties</title>
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="og:type" content="website" />
        <meta
          name="description"
          content="Bounties allow users to pool resources to get work done"
        />
        <meta property="og:title" content="Strata Bounty Board" />
        {/* <meta property="og:image" content={} /> */}
        {/* <meta property="og:description" content={description} /> */}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Center padding="54px" backgroundColor="black.500">
        <VStack spacing={6}>
          <Heading fontWeight={400} color="white" fontSize="24px">
            Your time gets more{" "}
            <Box
              display="inline"
              background="linear-gradient(to right,#FFCD01, #E17E44);"
              backgroundClip="text"
              textFillColor="transparent"
            >
              valuable
            </Box>
          </Heading>
          <Button
            w="160px"
            height="40px"
            as={Link}
            href={routes.newBounty.path}
            colorScheme="orange"
          >
            Create
          </Button>
        </VStack>
      </Center>
      <Container justify="stretch" maxW="container.lg">
        <VStack pt={16} spacing={8} align="stretch" justify="stretch">
          <Heading fontWeight={700} color="black.700" fontSize="32px">
            Recent Bounties
          </Heading>
          <Stack direction={["column", "column", "row"]} spacing={2}>
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <Icon color="#718EBF" as={AiOutlineSearch} />
              </InputLeftElement>
              <Input
                borderColor="gray.200"
                placeholder="Search text, token name, or token symbol"
              />
            </InputGroup>
            <Select
              borderColor="gray.200"
              w={[null, null, "248px"]}
              placeholder="Sort by"
              backgroundColor="white"
            >
              <option value="newest">Most Recent</option>
              <option value="oldest">Oldest</option>
              <option value="contribution_asc">
                Contribution: Low to high
              </option>
              <option value="contribution_desc">
                Contribution: High to low
              </option>
            </Select>
          </Stack>
          <BountyList>
            <BountyCard mintKey={PublicKey.default} />
            <BountyCard mintKey={PublicKey.default}  />
          </BountyList>
        </VStack>
      </Container>
    </Box>
  );
}

export default Bounties;