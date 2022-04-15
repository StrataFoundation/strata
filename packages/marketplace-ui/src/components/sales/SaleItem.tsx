import {
  Alert,
  Button,
  Center,
  Heading,
  Image,
  Input,
  Spinner,
  Text,
  VStack,
  Box,
  Stack,
  AspectRatio,
  Skeleton,
  Badge,
  HStack,
  FormControl,
  FormLabel,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  Notification,
  useBondingPricing,
  useMint,
  useOwnedAmount,
  useProvider,
  useStrataSdks,
  useTokenBondingFromMint,
  useTokenMetadata,
} from "@strata-foundation/react";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import BN from "bn.js";
import React, { useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import toast from "react-hot-toast";
import { SaleItemAdmin } from "./SaleItemAdmin";
import { FiClock } from "react-icons/fi";
import { QuantityPicker } from "./QuantityPicker";

async function buy(
  tokenBondingSdk: SplTokenBonding,
  tokenBonding: PublicKey,
  quantity: number
): Promise<void> {
  await tokenBondingSdk.buy({
    tokenBonding,
    desiredTargetAmount: quantity,
    slippage: 0.05,
  });

  toast.custom((t) => (
    <Notification
      show={t.visible}
      type="success"
      heading="Transactoin Successful"
      message={`Successfully purchased ${quantity}`}
      onDismiss={() => toast.dismiss(t.id)}
    />
  ));
}

export const SaleItem = ({
  mintKey,
  name,
  description,
  image,
}: {
  mintKey: PublicKey | undefined;
  name: string;
  description: string;
  image: string;
}) => {
  const { info: tokenBonding, loading: bondingLoading } =
    useTokenBondingFromMint(mintKey);
  const { connected, publicKey } = useWallet();
  const targetMint = useMint(tokenBonding?.targetMint);
  const {
    image: targetImage,
    metadata: targetMetadata,
    data: targetData,
    loading: targetMetaLoading,
  } = useTokenMetadata(tokenBonding?.targetMint);
  const { metadata: baseMetadata, loading: metadataLoading } = useTokenMetadata(
    tokenBonding?.baseMint
  );
  const { pricing, loading: pricingLoading } = useBondingPricing(
    tokenBonding?.publicKey
  );
  const { tokenBondingSdk } = useStrataSdks();
  const [qty, setQty] = useState(1);
  const { execute, loading, error } = useAsyncCallback(buy);
  const { awaitingApproval } = useProvider();
  const qtyNumber = Number(qty);
  const mintCapNumber = (tokenBonding?.mintCap as BN | undefined)?.toNumber();
  const targetSupplyNumber = targetMint?.supply.toNumber();
  const balance = useOwnedAmount(tokenBonding?.baseMint);
  const price = pricing?.buyTargetAmount(1);
  const total = pricing?.buyTargetAmount(Number(qty) || 1);
  const notEnoughFunds = (balance || 0) < (total || 0);
  const passedMintCap =
    mintCapNumber && ((targetSupplyNumber || 0) >= (mintCapNumber || 0));
  const remainingAmount = (mintCapNumber || 0) - (targetSupplyNumber || 0);

  const isAdmin =
    publicKey &&
    (tokenBonding?.reserveAuthority as PublicKey | undefined)?.equals(
      publicKey
    );
  name = targetMetadata?.data.name || name;
  image = targetImage || image;
  description = targetData?.description || description;

  const dataMissing = !name && !image && !description;

  if (!targetMetaLoading && dataMissing) {
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
    <Box
      pt="8"
      px={{ base: "5", lg: "8" }}
      pb={{ base: "10", lg: "8" }}
      w="full"
    >
      <Stack direction={{ base: "column", md: "row" }} spacing="8">
        <Box flex="1">
          <Stack spacing="4">
            <AspectRatio ratio={4 / 3}>
              <Image
                rounded="md"
                src={image}
                objectFit="cover"
                alt={"Placeholder"}
                fallback={<Skeleton />}
              />
            </AspectRatio>
          </Stack>
        </Box>
        <Box flex="1">
          <Stack spacing={{ base: "4", md: "8" }}>
            <Stack spacing={{ base: "2", md: "4" }}>
              <Stack spacing="3">
                <Badge
                  alignSelf="start"
                  textTransform="none"
                  size="sm"
                  fontWeight="semibold"
                  lineHeight="1rem"
                  borderRadius="base"
                  py="1"
                  px="2"
                  bg="primary.500"
                  color="white"
                >
                  {passedMintCap ? "Sold Out" : "For Sale"}
                </Badge>
              </Stack>
              <Heading size="lg" fontWeight="medium">
                {name}
              </Heading>
              <Stack
                direction={{ base: "column", md: "row" }}
                spacing="1"
                align="baseline"
                justify="space-between"
              >
                <HStack spacing="1">
                  <Text
                    as="span"
                    fontSize="lg"
                    fontWeight="semibold"
                    color="gray.700"
                  >
                    {baseMetadata?.data.symbol}{" "}
                    {pricingLoading ? <Spinner size="xs" /> : price?.toFixed(2)}
                  </Text>
                </HStack>
              </Stack>
              <Text color="gray.600">{description}</Text>
            </Stack>
            <HStack
              spacing={{ base: "4", md: "8" }}
              align="flex-end"
              justify="space-evenly"
            >
              { mintCapNumber && <Box flex="1">
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="medium">
                    <HStack spacing="2">
                      <Text>Available</Text>
                      {mintCapNumber && remainingAmount < mintCapNumber / 4 && (
                        <HStack spacing="1">
                          <Icon as={FiClock} />
                          <Text fontSize="xs" fontWeight="medium">
                            Low stock
                          </Text>
                        </HStack>
                      )}
                    </HStack>
                  </FormLabel>
                  <Flex
                    borderRadius="base"
                    px="2"
                    py="0.705rem"
                    borderWidth="1px"
                    justifyContent="space-between"
                  >
                    <Center minW="8">
                      <Text as="span" fontWeight="semibold" userSelect="none">
                        {bondingLoading ? (
                          <Spinner size="xs" />
                        ) : (
                          <span>
                            {remainingAmount} / {mintCapNumber || 0}
                          </span>
                        )}
                      </Text>
                    </Center>
                  </Flex>
                </FormControl>
              </Box> }
              <Box flex="1">
                <QuantityPicker
                  defaultValue={1}
                  max={
                    remainingAmount > 0 ? Math.round(remainingAmount / 2) : mintCapNumber ? 0 : Infinity
                  }
                  onChange={(num) => setQty(num)}
                />
              </Box> 
            </HStack>
            <Stack spacing="3">
              {error && (
                <Alert status="error">
                  <Alert status="error">{error.toString()}</Alert>
                </Alert>
              )}
              <Button
                isDisabled={
                  !connected ||
                  notEnoughFunds ||
                  passedMintCap ||
                  !qtyNumber ||
                  qtyNumber <= 0
                }
                isLoading={loading}
                value={qty}
                loadingText={awaitingApproval ? "Awaiting Approval" : "Loading"}
                onClick={() =>
                  qtyNumber &&
                  qtyNumber > 0 &&
                  execute(tokenBondingSdk!, tokenBonding?.publicKey!, qtyNumber)
                }
                w="full"
                size="lg"
                colorScheme="primary"
              >
                {!connected
                  ? "Connect a Wallet"
                  : notEnoughFunds
                  ? `Not Enough ${baseMetadata?.data.symbol || "funds"}`
                  : passedMintCap
                  ? "Sold Out"
                  : "Buy"}
              </Button>
              {isAdmin && tokenBonding && (
                <SaleItemAdmin tokenBondingKey={tokenBonding.publicKey} />
              )}
              <Center>
                <Text>
                  Total: {baseMetadata?.data.symbol}{" "}
                  {pricingLoading ? <Spinner size="xs" /> : total}{" "}
                </Text>
              </Center>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};
