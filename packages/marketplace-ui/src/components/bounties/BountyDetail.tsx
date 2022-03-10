import {
  Alert, Button, Center,
  Divider,
  Heading, Icon, SimpleGrid,
  Spinner,
  Text,
  VStack
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  useBondingPricing, useOwnedAmount,
  useReserveAmount, useTokenBondingFromMint,
  useTokenMetadata
} from "@strata-foundation/react";
import moment from "moment";
import React, { useMemo, useState } from "react";
import { RiPencilFill } from "react-icons/ri";
import { useBountyInfo } from "../../hooks/useBountyInfo";
import { useIsBountyAdmin } from "../../hooks/useIsBountyAdmin";
import { AuthorityAndTokenInfo } from "./AuthorityAndTokenInfo";
import { BountyCardContribution } from "./BountyCardContribution";
import { BountyContribute } from "./BountyContribute";
import { DisburseFunds } from "../DisburseFunds";
import { TopHolders } from "./TopHolders";

export const BountyDetail = ({
  name,
  description,
  image,
  mintKey,
  onEdit,
}: {
  mintKey?: PublicKey;
  name?: string;
  description?: string;
  image?: string;
  onEdit?: () => void;
}) => {
  const { info: tokenBonding, loading: bondingLoading } =
    useTokenBondingFromMint(mintKey);
  const { publicKey } = useWallet();
  const { pricing } = useBondingPricing(
    tokenBonding?.publicKey
  );

  const targetBalance = useOwnedAmount(tokenBonding?.targetMint);
  const reserveAmount = useReserveAmount(tokenBonding?.publicKey);
  const [topHolderKey, setTopHolderKey] = useState(0);
  const refreshTopHolders = () => setTopHolderKey((k) => k + 1);

  const { isAdmin, isEditor } = useIsBountyAdmin(
    publicKey || undefined,
    tokenBonding?.publicKey
  );

  const {
    info: {
      name: fromChainName,
      image: targetImage,
      createdAt,
      description: fromChainDescription,
      fundsHaveBeenUsed,
      bountyClosed,
      attributes,
      isNormalBounty,
    },
    loading,
  } = useBountyInfo(mintKey);

  name = fromChainName || name;
  image = targetImage || image;
  description = fromChainDescription || description;

  const dataMissing = useMemo(
    () => !name && !image && !description,
    [name, image, description]
  );

  const { metadata: baseMetadata } = useTokenMetadata(
    tokenBonding?.baseMint
  );

  if (
    (!loading && dataMissing) ||
    (attributes && !attributes.is_strata_bounty)
  ) {
    return (
      <Center height="300px">
        <Text>
          <b>404: </b> Not found
        </Text>
      </Center>
    );
  }

  if (dataMissing) {
    return <Spinner />;
  }

  return (
    <VStack spacing={2} w="full">
      {isEditor && (
        <Button
          color="gray.400"
          // __hover={{ rounded: "lg", borderColor: "gray.200", backgroundColor: "gray.100" }}
          leftIcon={<Icon as={RiPencilFill} mr="-1px" />}
          variant="ghost"
          marginLeft="auto"
          onClick={() => onEdit && onEdit()}
        >
          Edit
        </Button>
      )}

      <VStack w="full" p={6} pt={isEditor ? 0 : 8} spacing={8}>
        <VStack spacing={4}>
          <Heading textAlign="center">{name}</Heading>
          <AuthorityAndTokenInfo mintKey={mintKey} />
          {tokenBonding && (
            <Text fontSize="15px" color="gray.400">
              Created{" "}
              {moment(createdAt).fromNow()}
            </Text>
          )}
        </VStack>

        <Text
          w="full"
          align="left"
          fontSize="15px"
          color="gray.500"
          whiteSpace="pre-line"
        >
          {description}

          {"\n"}
          {attributes?.discussion && `Discussion: ${attributes.discussion}\n`}
          {attributes?.contact && `Contact: ${attributes.contact}`}
        </Text>
        {fundsHaveBeenUsed && (
          <Alert status="error">
            Funds have been disbursed from this bounty without closing it.
            Existing contributors may not be able to withdraw what they put into
            the bounty. Contact the bounty authority if you have any questions
          </Alert>
        )}

        {!isNormalBounty && (
          <Alert status="warning">
            This bounty does not have normal bonding curve parameters. It may
            have royalties set, or be using a non fixed price curve. Buyer
            beware.
          </Alert>
        )}
        {bountyClosed && (
          <>
            <Alert status="info">This bounty has been closed.</Alert>
            <Divider color="gray.200" />
            <Heading mb={"-6px"} alignSelf="flex-start" size="sm">
              Top Contributors
            </Heading>
            <TopHolders key={topHolderKey} mintKey={mintKey} />
          </>
        )}
        {!bountyClosed && (
          <>
            <SimpleGrid
              w="full"
              justifyContent="stretch"
              columns={[1, 1, 2]}
              spacing={2}
              gap={2}
            >
              <BountyCardContribution
                amount={reserveAmount}
                symbol={baseMetadata?.data.symbol}
              />
              <BountyCardContribution
                amount={
                  typeof targetBalance === "undefined"
                    ? undefined
                    : pricing?.sellTargetAmount(targetBalance)
                }
                symbol={baseMetadata?.data.symbol}
                text="My Contributions"
              />
            </SimpleGrid>

            <VStack align="flex-end" w="full">
              <BountyContribute mintKey={mintKey} onContributeSuccess={refreshTopHolders} />
            </VStack>
            <Divider color="gray.200" />
            <Heading mb={"-6px"} alignSelf="flex-start" size="sm">
              Top Contributors
            </Heading>
            <TopHolders key={topHolderKey} mintKey={mintKey} />
            {isAdmin && tokenBonding && (
              <VStack w="full" spacing={2}>
                <Divider color="gray.200" />
                <Heading alignSelf="flex-start" size="sm">
                  Disburse Funds
                </Heading>
                <DisburseFunds tokenBondingKey={tokenBonding?.publicKey} />
              </VStack>
            )}
          </>
        )}
      </VStack>
    </VStack>
  );
};
