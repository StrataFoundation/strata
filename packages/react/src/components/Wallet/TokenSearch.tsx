import {
  Center,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  StackDivider,
  Text,
  VStack,
  StackProps,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ITokenWithMetaAndAccount
} from "@strata-foundation/spl-token-collective";
import Fuse from "fuse.js";
import React, { useEffect, useMemo, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { RiCoinLine } from "react-icons/ri";
import { useUserTokensWithMeta } from "../../hooks";
import { Spinner } from "../Spinner";
import { TokenInfo } from "./TokenInfo";

const SearchError = ({
  title = "",
  subTitle = "",
  description = "",
}: {
  title: string;
  subTitle: string;
  description: string;
}) => {
  return (
    <VStack px={8} py={4} rounded={4} spacing={0} border="1px solid #E1E3E8">
      <Icon h="44px" w="44px" as={RiCoinLine} color="gray.300" />
      <Text fontWeight={800} fontSize="14px">
        {title}
      </Text>
      <Text fontSize="14px">{subTitle}</Text>
      <Text textAlign="center" mt={4} fontSize="14px" color="gray.500">
        {description}
      </Text>
    </VStack>
  );
};

export const TokenSearch = React.memo(
  ({
    onSelect,
    placeholder = "Search Tokens",
    resultsStackProps,
    onBlur,
    includeSol = false
  }: {
    onBlur?: () => void;
    placeholder?: string;
    resultsStackProps?: StackProps;
    onSelect: (tokenWithMeta: ITokenWithMetaAndAccount) => void;
    includeSol?: boolean;
  }) => {
    const { publicKey } = useWallet();
    const { data: tokens, loading } = useUserTokensWithMeta(
      publicKey || undefined,
      includeSol
    );
    const [search, setSearch] = useState("");
    const [focusIndex, setFocusIndex] = useState(0);

    const searched = useMemo(() => {
      if (tokens) {
        const sorted = tokens
          ?.filter((t) => !!t.metadata)
          .sort((a, b) =>
            a.metadata!.data.name.localeCompare(b.metadata!.data.name)
          );
        if (search) {
          return new Fuse(sorted, {
            keys: ["metadata.data.name", "metadata.data.symbol"],
            threshold: 0.2,
          })
            .search(search)
            .map((result) => result.item);
        } else {
          return sorted;
        }
      }
      return [];
    }, [tokens, search]);

    useEffect(() => {
      if (searched.length - 1 < focusIndex && searched.length != 0) {
        setFocusIndex(searched.length - 1);
      }
    }, [searched]);

    const tokenInfos = searched.map((tokenWithMeta, index) => (
      <TokenInfo
        highlighted={index == focusIndex}
        key={tokenWithMeta.publicKey?.toBase58()}
        tokenWithMeta={tokenWithMeta}
        onClick={onSelect}
      />
    ));

    return (
      <VStack w="full">
        <InputGroup>
          <InputLeftElement h="full" pointerEvents="none">
            <Center>
              <Icon w="20px" h="20px" color="gray.500" as={BiSearch} />
            </Center>
          </InputLeftElement>
          <Input
            onBlur={onBlur}
            autoFocus
            display="auto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="lg"
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (e.key == "Enter" && searched[focusIndex]) {
                onSelect(searched[focusIndex]);
              } else if (e.key == "ArrowDown") {
                setFocusIndex((i) =>
                  i == searched.length - 1 ? searched.length - 1 : i + 1
                );
              } else if (e.key == "ArrowUp") {
                setFocusIndex((i) => (i == 0 ? 0 : i - 1));
              }
            }}
          />
        </InputGroup>
        <VStack
          {...resultsStackProps}
          pt={2}
          align="stretch"
          divider={<StackDivider borderColor="gray.200" />}
          w="full"
          justify="stretch"
        >
          {tokenInfos}
          {loading && <Spinner />}
          {!loading &&
            tokenInfos?.length == 0 &&
            (search && search.length > 0 ? (
              <SearchError
                title="Could Not Find Token"
                subTitle="We couldn't find this token in your wallet."
                description="If you have this token in another wallet, please fund this wallet first."
              />
            ) : (
              <SearchError
                title="No Tokens"
                subTitle="It looks like your wallet is empty."
                description="Buy tokens from this wallet first, then they will show up here"
              />
            ))}
        </VStack>
      </VStack>
    );
  }
);
