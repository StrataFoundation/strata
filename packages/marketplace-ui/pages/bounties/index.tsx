import { BountyCard } from "../../src/components/bounties/BountyCard";
import { BountyList } from "../../src/components/bounties/BountyList";
import { MintSelectModal } from "../../src/components/bounties/MintSelectModal";
import { route, routes } from "../../src/utils/routes";
import {
  Box,
  Button,
  Center,
  Container,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Select,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  useErrorHandler,
  usePublicKey,
  useQueryString,
} from "@strata-foundation/react";
import { useBounties } from "../../src/hooks/useBounties";
import { NextPage } from "next";
import { NextSeo } from "next-seo";
import { useRouter } from "next/router";
import { useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import { BsChevronDown } from "react-icons/bs";
import { SITE_URL } from "../../src/constants";

const PAGE_SIZE = 20;
export const Bounties: NextPage = () => {
  const [mint, setMint] = useQueryString("mint", "");
  const [search, setSearch] = useQueryString("search", "");
  const [sort, setSort] = useQueryString("sort", "newest");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const fetchMore = () => setLimit((limit) => limit + PAGE_SIZE);
  const router = useRouter();

  const baseMint = usePublicKey(mint);
  const {
    result: bounties,
    error,
    loading,
  } = useBounties({
    baseMint,
    search,
    sortType: sort.includes("contribution") ? "CONTRIBUTION" : "GO_LIVE",
    sortDirection: sort.includes("asc") ? "ASC" : "DESC",
    limit,
  });
  const { handleErrors } = useErrorHandler();
  handleErrors(error);

  return (
    <Box
      w="full"
      backgroundColor="#f9f9f9"
      minHeight="100vh"
      paddingBottom="200px"
    >
      <NextSeo
        title="Strata Bounties"
        description="Bounties allow users to pool resources to get work done"
        openGraph={{
          url: `${SITE_URL}/bounties`,
          title: "Strata Bounty Board",
          description:
            "Bounties allow users to pool resources to get work done",
          site_name: "StrataLaunchpad",
        }}
      />
      <Center padding="54px" backgroundColor="black.500">
        <VStack spacing={6}>
          <Heading fontWeight={400} color="white" fontSize="24px">
            Your time gets more{" "}
            <Box
              display="inline"
              background="linear-gradient(to right,#FFCD01, #E17E44);"
              backgroundClip="text"
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
      <Container justifyContent="stretch" maxW="container.lg">
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
                onClick={() =>
                  router.push(
                    route(routes.bounty, {
                      mintKey: bounty.targetMint.toBase58(),
                    }),
                    undefined,
                    { shallow: true }
                  )
                }
                key={bounty.tokenBondingKey.toBase58()}
                mintKey={bounty.targetMint}
              />
            ))}
            {!loading && bounties?.length === 0 && (
              <Center w="full" h="350px">
                <VStack spacing={4}>
                  <Text color="gray.500" fontWeight={600} fontSize="18px">
                    Nothing to show...
                  </Text>
                  <Text color="gray.400" fontWeight={400} fontSize="16px">
                    There were no bounties found for these search parameters
                  </Text>
                </VStack>
              </Center>
            )}
            {loading && (
              <Center w="full" h="350px">
                <Spinner />
              </Center>
            )}
          </BountyList>
          {bounties?.length == PAGE_SIZE && (
            <Button onClick={fetchMore} variant="link" colorScheme="orange">
              See More <Icon ml="6px" w="14px" h="14px" as={BsChevronDown} />
            </Button>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default Bounties;
