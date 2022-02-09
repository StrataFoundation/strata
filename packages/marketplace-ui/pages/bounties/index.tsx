import { BountyCard } from "@/components/bounties/BountyCard";
import { BountyList } from "@/components/bounties/BountyList";
import { MintSelectModal } from "@/components/bounties/MintSelectModal";
import {
  Box, Button, Center, Container, Heading, Icon,
  Input, InputGroup, InputLeftElement, Link, Select, Stack, VStack
} from "@chakra-ui/react";
import { useErrorHandler, usePublicKey } from "@strata-foundation/react";
import { useBounties } from "hooks/useBounties";
import { useQueryString } from "hooks/useQueryString";
import { NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { routes } from "@/utils/routes";
import { BsChevronDown } from "react-icons/bs";

const PAGE_SIZE= 20;
export const Bounties: NextPage = () => {
  const [mint, setMint] = useQueryString("mint", "");
  const [search, setSearch] = useQueryString("search", "");
  const [sort, setSort] = useQueryString("sort", "newest");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const fetchMore = () => setLimit((limit) => limit + PAGE_SIZE);
  
  const baseMint = usePublicKey(mint);
  const { result: bounties, error } = useBounties({
    baseMint,
    search,
    sortType: sort.includes("contribution") ? "CONTRIBUTION" : "GO_LIVE",
    sortDirection: sort.includes("asc") ? "ASC" : "DESC",
    limit
  });
  const { handleErrors } = useErrorHandler();
  handleErrors(error);

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                borderColor="gray.200"
                placeholder="Search text, token name, or token symbol"
              />
            </InputGroup>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              borderColor="gray.200"
              w={[null, null, "248px"]}
              placeholder="Sort by"
              backgroundColor="white"
            >
              <option value="go_live_desc">Most Recent</option>
              <option value="go_live_asc">Oldest</option>
              <option value="contribution_asc">
                Contribution: Low to high
              </option>
              <option value="contribution_desc">
                Contribution: High to low
              </option>
            </Select>
            <MintSelectModal
              buttonProps={{ backgroundColor: "white" }}
              onChange={setMint}
              value={mint}
            />
          </Stack>
          <BountyList>
            {bounties?.map((bounty) => (
              <BountyCard
                key={bounty.tokenBondingKey.toBase58()}
                mintKey={bounty.targetMint}
              />
            ))}
          </BountyList>
          {bounties?.length == PAGE_SIZE && (
            <Button
              onClick={fetchMore}
              variant="link"
              colorScheme="orange"
            >
              See More <Icon ml="6px" w="14px" h="14px" as={BsChevronDown} />
            </Button>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default Bounties;