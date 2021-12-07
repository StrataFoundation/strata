import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Menu,
  MenuButton,
  ScaleFade,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  IPricingCurve,
  ITokenBonding,
  SplTokenBonding,
} from "@strata-foundation/spl-token-bonding";
import { BondingPricing } from "@strata-foundation/spl-token-bonding/dist/lib/pricing";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { RiArrowUpDownFill, RiInformationLine } from "react-icons/ri";
import * as yup from "yup";
import { useFtxPayLink, useProvider } from "../../hooks";

export interface ISwapFormValues {
  topAmount: number;
  bottomAmount: number;
  slippage: number;
}

const validationSchema = yup
  .object({
    topAmount: yup.number().required().moreThan(0),
    bottomAmount: yup.number().required().moreThan(0),
    slippage: yup.number().required().moreThan(0),
  })
  .required();

const humanReadablePercentage = (u32: number) => {
  if (u32 && u32 !== 0) {
    return ((u32 / 4294967295) * 100).toFixed(2);
  }
  return 0;
};

export interface ISwapFormProps {
  action: "buy" | "sell";
  isSubmitting: boolean;
  onConnectWallet: () => void;
  onFlipTokens: (tokenBonding: PublicKey, action: "buy" | "sell") => void;
  onBuyBase: (tokenBonding: PublicKey) => void;
  onSubmit: (values: ISwapFormValues) => Promise<void>;
  tokenBonding: ITokenBonding;
  pricing: BondingPricing;
  base: {
    name: string;
    ticker: string;
    icon: React.ReactNode;
    publicKey: PublicKey;
  };
  target: {
    name: string;
    ticker: string;
    icon: React.ReactNode;
    publicKey: PublicKey;
  };
  ownedBase: number;
  spendCap: number;
  feeAmount?: number;
}

function roundToDecimals(num: number, decimals: number): number {
  return Math.trunc(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export const SwapForm = ({
  action,
  isSubmitting,
  onConnectWallet,
  onFlipTokens,
  onBuyBase,
  onSubmit,
  tokenBonding,
  pricing,
  base,
  target,
  ownedBase,
  spendCap,
  feeAmount,
}: ISwapFormProps) => {
  const formRef = useRef() as React.MutableRefObject<HTMLInputElement>;
  const { connected } = useWallet();
  const { awaitingApproval } = useProvider();
  const ftxPayLink = useFtxPayLink();
  const [rate, setRate] = useState<string>("--");
  const [fee, setFee] = useState<string>("--");
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ISwapFormValues>({
    defaultValues: {
      topAmount: undefined,
      bottomAmount: undefined,
      slippage: 1,
    },
    resolver: yupResolver(validationSchema),
  });

  const isBaseSol = base.publicKey.equals(SplTokenBonding.WRAPPED_SOL_MINT);
  const isBuying = action === "buy";
  const topAmount = watch("topAmount");
  const slippage = watch("slippage");
  const hasBaseAmount = ownedBase >= +(topAmount || 0);
  const moreThanSpendCap = +(topAmount || 0) > spendCap;

  const handleConnectWallet = () => onConnectWallet();

  const handleUseMax = () =>
    setValue("topAmount", ownedBase >= spendCap ? spendCap : ownedBase);

  const handleFlipTokens = () => {
    onFlipTokens(tokenBonding.publicKey, isBuying ? "sell" : "buy");
    reset();
  };

  const handleBuyBase = () => {
    if (isBaseSol) {
      window.open(ftxPayLink);
    } else {
      onBuyBase(tokenBonding.publicKey);
    }
  };

  const handleSwap = async (values: ISwapFormValues) => {
    await onSubmit(values);
    reset();
  };

  useEffect(() => {
    if (topAmount && topAmount >= 0 && tokenBonding && pricing) {
      if (isBuying) {
        const buyMax = pricing.buyWithBaseAmount(
          +topAmount
        );

        setValue("bottomAmount", roundToDecimals(buyMax, 9));
        setRate(`${roundToDecimals(buyMax / topAmount, 9)}`);
      } else {
        const sellMax = pricing.sellTargetAmount(
          +topAmount
        );

        setValue("bottomAmount", roundToDecimals(sellMax, 9));
        setRate(`${roundToDecimals(sellMax / topAmount, 9)}`);
      }

      setFee(`${feeAmount}`);
    } else {
      reset({ slippage: slippage });
      setRate("--");
      setFee("--");
    }
  }, [topAmount, feeAmount, setValue, setRate, tokenBonding, pricing, slippage]);

  return (
    <Box ref={formRef} w="full">
      <form onSubmit={handleSubmit(handleSwap)}>
        <VStack spacing={4} padding={4} align="stretch" color="gray.500">
          <Flex flexDir="column">
            <Flex justifyContent="space-between">
              <Text color="gray.600" fontSize="xs">
                You Pay
              </Text>
              <Link color="indigo.500" fontSize="xs" onClick={handleBuyBase}>
                Buy More {base.ticker}
              </Link>
            </Flex>
            <InputGroup size="lg">
              <Input
                isInvalid={!!errors.topAmount}
                isDisabled={!connected}
                id="topAmount"
                borderColor="gray.200"
                placeholder="0"
                type="number"
                fontSize="2xl"
                fontWeight="semibold"
                _placeholder={{ color: "gray.200" }}
                step={0.0000000001}
                min={0}
                {...register("topAmount")}
              />
              <InputRightElement
                w="auto"
                justifyContent="end"
                paddingX={1.5}
                rounded="lg"
              >
                {connected && (
                  <Menu>
                    <MenuButton
                      isDisabled={!connected}
                      as={Button}
                      leftIcon={
                        <Center
                          w={8}
                          h={8}
                          color="white"
                          bg="indigo.500"
                          rounded="full"
                        >
                          {base.icon}
                        </Center>
                      }
                      borderRadius="20px 6px 6px 20px"
                      paddingX={1.5}
                      bgColor="gray.200"
                      _hover={{ cursor: "default" }}
                    >
                      {base.ticker}
                    </MenuButton>
                  </Menu>
                )}
              </InputRightElement>
            </InputGroup>
          </Flex>
          <HStack
            justify="center"
            alignItems="center"
            position="relative"
            paddingY={2}
          >
            <Divider color="gray.200" />
            <Flex>
              {!connected && (
                <Button
                  size="xs"
                  colorScheme="gray"
                  variant="outline"
                  onClick={handleConnectWallet}
                >
                  Connect Wallet
                </Button>
              )}
              {connected && (
                <Button
                  size="xs"
                  colorScheme="indigo"
                  variant="ghost"
                  onClick={handleUseMax}
                >
                  Use Max ({ownedBase > spendCap ? spendCap : ownedBase}{" "}
                  {base.ticker})
                </Button>
              )}
            </Flex>
            <Divider color="gray.200" />
            {/* flipping to wum (Selling wum to sol) is disabled in beta*/}
            <IconButton
              isDisabled={!connected || isBaseSol}
              aria-label="Flip Tokens"
              size="sm"
              colorScheme="gray"
              rounded="full"
              position="absolute"
              right={2}
              onClick={handleFlipTokens}
              icon={<Icon as={RiArrowUpDownFill} w={5} h={5} />}
            />
          </HStack>
          <Flex flexDir="column">
            <Text color="gray.600" fontSize="xs">
              You Receive
            </Text>
            <InputGroup size="lg">
              <Input
                isInvalid={!!errors.bottomAmount}
                isReadOnly
                isDisabled={!connected}
                id="bottomAmount"
                borderColor="gray.200"
                placeholder="0"
                type="number"
                fontSize="2xl"
                fontWeight="semibold"
                step={0.0000000001}
                min={0}
                _placeholder={{ color: "gray.200" }}
                _hover={{ cursor: "not-allowed" }}
                _focus={{ outline: "none", borderColor: "gray.200" }}
                {...register("bottomAmount")}
              />
              <InputRightElement
                w="auto"
                justifyContent="end"
                paddingX={1.5}
                rounded="lg"
              >
                {connected && (
                  <Menu>
                    <MenuButton
                      isDisabled={!connected}
                      as={Button}
                      leftIcon={
                        <Center
                          w={8}
                          h={8}
                          color="white"
                          bg="indigo.500"
                          rounded="full"
                        >
                          {target.icon}
                        </Center>
                      }
                      borderRadius="20px 6px 6px 20px"
                      paddingX={1.5}
                      bgColor="gray.200"
                      _hover={{ cursor: "default" }}
                    >
                      {target.ticker}
                    </MenuButton>
                  </Menu>
                )}
              </InputRightElement>
            </InputGroup>
          </Flex>
          <VStack
            spacing={1}
            padding={4}
            align="stretch"
            color="gray.400"
            borderColor="gray.200"
            borderWidth="1px"
            rounded="lg"
            fontSize="sm"
          >
            <Flex justify="space-between" alignItems="center">
              <Text>Rate</Text>
              <Text>
                {rate !== "--"
                  ? `1 ${base.ticker} ≈ ${rate} ${target.ticker}`
                  : rate}
              </Text>
            </Flex>
            <Flex justify="space-between" alignItems="center">
              <HStack>
                <Text>Slippage</Text>
                <Tooltip
                  isDisabled={!connected}
                  placement="top"
                  label="Your transaction will fail if the price changes unfavorably more than this percentage."
                  portalProps={{ containerRef: formRef }}
                >
                  <Flex>
                    <Icon
                      w={5}
                      h={5}
                      as={RiInformationLine}
                      _hover={{ color: "indigo.500", cursor: "pointer" }}
                    />
                  </Flex>
                </Tooltip>
              </HStack>
              <InputGroup size="sm" w="60px">
                <Input
                  isInvalid={!!errors.slippage}
                  isDisabled={!connected}
                  id="slippage"
                  borderColor="gray.200"
                  textAlign="right"
                  rounded="lg"
                  placeholder="0"
                  type="number"
                  fontWeight="semibold"
                  step={1}
                  min={1}
                  max={90}
                  paddingRight={5}
                  paddingLeft={1}
                  {...register("slippage")}
                />
                <InputRightElement
                  w={4}
                  justifyContent="end"
                  paddingRight={1.5}
                  rounded="lg"
                >
                  <Text margin={0}>%</Text>
                </InputRightElement>
              </InputGroup>
            </Flex>
            <Flex justify="space-between" alignItems="center">
              <Text>Estimated Fees</Text>
              <Flex>{fee}</Flex>
            </Flex>
            <Flex justify="space-between" alignItems="center">
              <HStack>
                <Text>{isBuying ? base.ticker : target.ticker} Royalties</Text>
                <Tooltip
                  isDisabled={!connected}
                  placement="top"
                  label={`A purchase fee in ${base.ticker} that is split amongst stakers of ${target.ticker}`}
                  portalProps={{ containerRef: formRef }}
                >
                  <Flex>
                    <Icon
                      w={5}
                      h={5}
                      as={RiInformationLine}
                      _hover={{ color: "indigo.500", cursor: "pointer" }}
                    />
                  </Flex>
                </Tooltip>
              </HStack>
              <Flex>
                {humanReadablePercentage(
                  isBuying
                    ? tokenBonding.buyBaseRoyaltyPercentage
                    : tokenBonding.sellBaseRoyaltyPercentage
                )}
                %
              </Flex>
            </Flex>
            <Flex justify="space-between" alignItems="center">
              <HStack>
                <Text>{isBuying ? target.ticker : base.ticker} Royalties</Text>
                <Tooltip
                  isDisabled={!connected}
                  placement="top"
                  label={`A percentage of every ${target.ticker} token minted goes to the person who has claimed this token`}
                  portalProps={{ containerRef: formRef }}
                >
                  <Flex>
                    <Icon
                      w={5}
                      h={5}
                      as={RiInformationLine}
                      _hover={{ color: "indigo.500", cursor: "pointer" }}
                    />
                  </Flex>
                </Tooltip>
              </HStack>
              <Flex>
                {humanReadablePercentage(
                  isBuying
                    ? tokenBonding.buyTargetRoyaltyPercentage
                    : tokenBonding.sellTargetRoyaltyPercentage
                )}
                %
              </Flex>
            </Flex>
          </VStack>
          <Box position="relative">
            <ScaleFade
              initialScale={0.9}
              in={!hasBaseAmount || moreThanSpendCap}
            >
              <Center
                bgColor="gray.500"
                rounded="md"
                paddingY={2}
                color="white"
                w="full"
                position="absolute"
                top={-10}
                fontSize="sm"
              >
                {moreThanSpendCap && (
                  <Text>
                    Spend Cap is {spendCap} {base.ticker}. Please adjust amount
                  </Text>
                )}
                {!moreThanSpendCap && (
                  <Text>
                    Insufficent funds for this trade.{" "}
                    <Text as="u">
                      <Link
                        color="indigo.100"
                        _hover={{ color: "indigo.200" }}
                        onClick={handleBuyBase}
                      >
                        {`Buy more now.`}
                      </Link>
                    </Text>
                  </Text>
                )}
              </Center>
            </ScaleFade>
            <Button
              isDisabled={!connected || !hasBaseAmount || moreThanSpendCap}
              w="full"
              colorScheme="indigo"
              size="lg"
              type="submit"
              isLoading={awaitingApproval || isSubmitting}
              loadingText={
                awaitingApproval
                  ? "Awaiting Approval"
                  : action === "buy"
                  ? "Buying"
                  : "Selling"
              }
            >
              Trade
            </Button>
          </Box>
        </VStack>
      </form>
    </Box>
  );
};
