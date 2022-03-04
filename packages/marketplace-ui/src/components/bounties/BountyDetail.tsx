import {
  Alert,
  Box,
  Button,
  ButtonProps,
  Center,
  Divider,
  Heading,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputProps,
  InputRightElement, SimpleGrid,
  Spinner,
  Text,
  VStack
} from "@chakra-ui/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { MarketplaceSdk } from "@strata-foundation/marketplace-sdk";
import {
  useBondingPricing,
  useGovernance,
  useMint,
  useOwnedAmount,
  useReserveAmount,
  useStrataSdks,
  useTokenBondingFromMint,
  useTokenMetadata
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { SplTokenMetadata } from "@strata-foundation/spl-utils";
import debounce from "lodash/debounce";
import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
import { RiPencilFill } from "react-icons/ri";
import { AsyncButton } from "../AsyncButton";
import { AuthorityAndTokenInfo } from "./AuthorityAndTokenInfo";
import { BountyCardContribution } from "./BountyCardContribution";
import { DisburseFunds } from "./DisburseFunds";
import { TopHolders } from "./TopHolders";

export const AsyncQtyButton = ({
  inputProps = {},
  buttonProps = {},
  action,
  children,
  validate,
  symbol,
}: {
  symbol?: string;
  children: React.ReactNode;
  inputProps?: InputProps;
  buttonProps?: ButtonProps;
  action: (args: { quantity: number }) => Promise<void> | undefined;
  validate?: (args: { quantity: number }) => string | null;
}) => {
  const [qty, setQty] = useState("");
  const validation = React.useMemo(
    () => validate && validate({ quantity: Number(qty) }),
    [validate, qty]
  );

  return (
    <HStack w="full" justify="flex-start">
      <Box flexGrow={1}>
        <InputGroup>
          <Input
            type="number"
            value={qty}
            onChange={(e) => {
              setQty(e.target.value);
            }}
            {...inputProps}
          />
          <InputRightElement
            pr={"6px"}
            fontSize="16px"
            fontWeight={700}
            color="gray.500"
            justifyContent="flex-end"
            width="120px"
          >
            {symbol}
          </InputRightElement>
        </InputGroup>
      </Box>

      <AsyncButton
        {...buttonProps}
        action={() => action({ quantity: Number(qty) })}
        isDisabled={validation ? true : false}
      >
        {validation ? validation : children}
      </AsyncButton>
    </HStack>
  );
};

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
  onEdit?: () => void
}) => {
  const { info: tokenBonding, loading: bondingLoading } =
    useTokenBondingFromMint(mintKey);
  const { connected, publicKey } = useWallet();
  const targetMint = useMint(tokenBonding?.targetMint);
  const {
    image: targetImage,
    metadata: targetMetadata,
    metadataKey,
    data: targetData,
    loading: targetMetaLoading,
    displayName,
  } = useTokenMetadata(mintKey);
  const { metadata: baseMetadata, loading: metadataLoading } = useTokenMetadata(
    tokenBonding?.baseMint
  );
  const { pricing, loading: pricingLoading } = useBondingPricing(
    tokenBonding?.publicKey
  );
  const { tokenBondingSdk } = useStrataSdks();
  const baseBalance = useOwnedAmount(tokenBonding?.baseMint);
  const targetBalance = useOwnedAmount(tokenBonding?.targetMint);
  const reserveAmount = useReserveAmount(tokenBonding?.publicKey);
  const [isWithdraw, setIsWithdraw] = useState(false);
  const baseMint = useMint(tokenBonding?.baseMint);
  // Debounce because this can cause it to flash a notification when reserves change at the
  // same time as bonding, but one comes through before the other.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fundsHaveBeenUsed = useMemo(
    debounce(
      () =>
        tokenBonding &&
        baseMint &&
        reserveAmount &&
        toNumber(tokenBonding.reserveBalanceFromBonding, baseMint) !==
          reserveAmount,
      500
    ),
    [tokenBonding, baseMint, reserveAmount]
  );

  const bountyClosed = useMemo(
    () => debounce(() => !tokenBonding && !bondingLoading, 200),
    [tokenBonding, bondingLoading]
  );

  // Stop the invocation of the debounced function
  // after unmounting
  useEffect(() => {
    return () => {
      bountyClosed.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [topHolderKey, setTopHolderKey] = useState(0);
  const refreshTopHolders = () => setTopHolderKey((k) => k + 1);

  const attributes = React.useMemo(
    () => SplTokenMetadata.attributesToRecord(targetData?.attributes),
    [targetData]
  );

  const { info: governance } = useGovernance(
    tokenBonding?.reserveAuthority as PublicKey | undefined
  );

  const isAdmin =
    (publicKey &&
      (tokenBonding?.reserveAuthority as PublicKey | undefined)?.equals(
        publicKey
      )) ||
    governance;
  name = displayName || name;
  image = targetImage || image;
  description = targetData?.description || description;

  const dataMissing = useMemo(() => !name && !image && !description, [name, image, description]);

  if (
    (!targetMetaLoading && dataMissing) ||
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

  const editVisible =
    targetMetadata?.updateAuthority &&
    targetMetadata.updateAuthority == publicKey?.toBase58();

  return (
    <VStack p={2} spacing={2} w="full">
      { editVisible && (
          <Button
            color="gray.400"
            // __hover={{ rounded: "lg", borderColor: "gray.200", backgroundColor: "gray.100" }}
            leftIcon={<Icon as={RiPencilFill} mr="-1px" />}
            variant="ghost"
            marginLeft="auto"
            onClick={() =>
              onEdit && onEdit()
            }
          >
            Edit
          </Button>
        )
      }

      <VStack w="full" p={6} pt={editVisible ? 0 : 8} spacing={8}>
        <VStack spacing={4}>
          <Heading textAlign="center">{name}</Heading>
          <AuthorityAndTokenInfo mintKey={mintKey} />
          {tokenBonding && (
            <Text fontSize="15px" color="gray.400">
              Created{" "}
              {moment(tokenBonding.goLiveUnixTime.toNumber() * 1000).fromNow()}
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

        {!MarketplaceSdk.isNormalBounty(tokenBonding) && (
          <Alert status="warning">
            This bounty does not have normal bonding curve parameters. It may
            have royalties set, or be using a non fixed price curve. Buyer
            beware.
          </Alert>
        )}
        {bountyClosed() && (
          <>
            <Alert status="info">This bounty has been closed.</Alert>
            <Divider color="gray.200" />
            <Heading mb={"-6px"} alignSelf="flex-start" size="sm">
              Top Contributors
            </Heading>
            <TopHolders key={topHolderKey} mintKey={mintKey} />
          </>
        )}
        {!bountyClosed() && (
          <>
            <SimpleGrid
              w="full"
              justify="stretch"
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
              <AsyncQtyButton
                buttonProps={{
                  colorScheme: "primary",
                  w: "180px",
                }}
                symbol={baseMetadata?.data.symbol}
                validate={({ quantity }) => {
                  if (isWithdraw) {
                    if (pricing) {
                      const actualQuantity = -pricing.buyWithBaseAmount(
                        -quantity
                      );
                      if (!targetBalance || targetBalance < actualQuantity) {
                        return "Insufficient funds";
                      }

                      if (!connected) {
                        return "Connect Wallet";
                      }
                    }

                    return null;
                  } else {
                    if (!baseBalance || baseBalance < quantity) {
                      return "Insufficient funds";
                    }

                    if (!connected) {
                      return "Connect Wallet";
                    }
                  }

                  return null;
                }}
                action={async ({ quantity }) => {
                  if (isWithdraw && pricing) {
                    await tokenBondingSdk?.sell({
                      targetAmount: -pricing.buyWithBaseAmount(-quantity),
                      tokenBonding: tokenBonding?.publicKey!,
                      slippage: 0,
                    });
                  } else if (!isWithdraw) {
                    await tokenBondingSdk?.buy({
                      baseAmount: quantity,
                      tokenBonding: tokenBonding?.publicKey!,
                      slippage: 0,
                    });
                  }

                  refreshTopHolders();
                }}
              >
                {isWithdraw ? "Withdraw Funds" : "Contribute Funds"}
              </AsyncQtyButton>
              <Button
                onClick={() => setIsWithdraw(!isWithdraw)}
                fontWeight={400}
                w="180px"
                variant="link"
                size="sm"
                colorScheme="primary"
              >
                {isWithdraw ? "Contribute Funds" : "Withdraw Funds"}
              </Button>
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
