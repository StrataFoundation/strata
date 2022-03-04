import {
  Avatar,
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
  MenuItem,
  MenuList,
  ScaleFade,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react";
import { Spinner } from "../Spinner";
import { yupResolver } from "@hookform/resolvers/yup";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { ITokenBonding, toNumber } from "@strata-foundation/spl-token-bonding";
import { BondingPricing } from "@strata-foundation/spl-token-bonding/dist/lib/pricing";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { BsChevronDown } from "react-icons/bs";
import { RiArrowUpDownFill, RiInformationLine } from "react-icons/ri";
import * as yup from "yup";
import { useFtxPayLink, useMint, useProvider, useTokenMetadata } from "../../hooks";
import { Royalties } from "./Royalties";
import { TransactionInfo, TransactionInfoArgs } from "./TransactionInfo";
import { useTwWrappedSolMint } from "../../hooks/useTwWrappedSolMint";
import { NATIVE_MINT } from "@solana/spl-token";
import { roundToDecimals } from "../../utils";
import BN from "bn.js";

export interface ISwapFormValues {
  topAmount: number;
  bottomAmount: number;
  slippage: number;
  lastSet: "bottom" | "top";
}

const validationSchema = yup
  .object({
    topAmount: yup.number().required().moreThan(0),
    bottomAmount: yup.number().required().moreThan(0),
    slippage: yup.number().required().moreThan(0),
  })
  .required();

export interface ISwapFormProps {
  isLoading?: boolean;
  isSubmitting: boolean;
  onConnectWallet: () => void;
  onTradingMintsChange: (args: { base: PublicKey; target: PublicKey }) => void;
  onBuyBase: (tokenBonding: PublicKey) => void;
  onSubmit: (values: ISwapFormValues) => Promise<void>;
  tokenBonding: ITokenBonding | undefined;
  pricing: BondingPricing | undefined;
  baseOptions: PublicKey[];
  targetOptions: PublicKey[];
  base:
    | {
        name: string;
        ticker: string;
        image: string | undefined;
        publicKey: PublicKey;
      }
    | undefined;
  target:
    | {
        name: string;
        ticker: string;
        image: string | undefined;
        publicKey: PublicKey;
      }
    | undefined;
  ownedBase: number | undefined;
  spendCap: number;
  mintCap?: number;
  numRemaining?: number;
  feeAmount?: number;
  extraTransactionInfo?: Omit<TransactionInfoArgs, "formRef">[];
}

function MintMenuItem({
  mint,
  onClick,
}: {
  mint: PublicKey;
  onClick: () => void;
}) {
  const { image, metadata } = useTokenMetadata(mint);

  return (
    <MenuItem
      onClick={onClick}
      icon={
        <Center w={8} h={8} color="white" bg="primary.500" rounded="full">
          <Avatar w={"100%"} h={"100%"} size="sm" src={image} />
        </Center>
      }
    >
      <Text>{metadata?.data.symbol}</Text>
    </MenuItem>
  );
}

export const SwapForm = ({
  isLoading = false,
  extraTransactionInfo,
  isSubmitting,
  onConnectWallet,
  onTradingMintsChange,
  onBuyBase,
  onSubmit,
  tokenBonding,
  pricing,
  base,
  target,
  ownedBase,
  spendCap,
  feeAmount,
  baseOptions,
  targetOptions,
  mintCap,
  numRemaining
}: ISwapFormProps) => {
  const formRef = useRef() as React.MutableRefObject<HTMLInputElement>;
  const { connected } = useWallet();
  const { awaitingApproval } = useProvider();
  const ftxPayLink = useFtxPayLink();
  const [insufficientLiq, setInsufficientLiq] = useState<boolean>(false);
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
  const wrappedSolMint = useTwWrappedSolMint();
  const isBaseSol =
    wrappedSolMint &&
    (base?.publicKey.equals(wrappedSolMint) ||
      base?.publicKey.equals(NATIVE_MINT));
  const topAmount = watch("topAmount");
  const bottomAmount = watch("bottomAmount");
  const slippage = watch("slippage");
  const hasBaseAmount = (ownedBase || 0) >= +(topAmount || 0);
  const moreThanSpendCap = +(topAmount || 0) > spendCap;

  const lowMint =
    base &&
    target &&
    pricing?.hierarchy.lowest(base.publicKey, target.publicKey);
  const isBuying = lowMint && lowMint.equals(target?.publicKey!);
  const targetBonding = lowMint && pricing?.hierarchy.findTarget(lowMint);
  const passedMintCap =
    typeof numRemaining !== "undefined" && numRemaining < bottomAmount;

  const notLive =
    targetBonding &&
    targetBonding.goLiveUnixTime.toNumber() > new Date().valueOf() / 1000;

  const handleConnectWallet = () => onConnectWallet();
  const manualResetForm = () => {
    reset({ slippage: slippage });
    setInsufficientLiq(false);
    setRate("--");
    setFee("--");
  };
  const [lastSet, setLastSet] = useState<"bottom" | "top">("top");

  function updatePrice() {
    if (lastSet == "bottom" && bottomAmount) {
      handleBottomChange(bottomAmount);
    } else if (topAmount) {
      handleTopChange(topAmount);
    }
  }

  useEffect(() => {
    const interval = setInterval(updatePrice, 1000);
    return () => clearInterval(interval)
  }, [bottomAmount, topAmount])
  
  const handleTopChange = (value: number | undefined = 0) => {
    if (tokenBonding && pricing && base && target && value && +value >= 0) {
      setLastSet("top");
      const amount = pricing.swap(+value, base.publicKey, target.publicKey);
      if (isNaN(amount)) {
        setInsufficientLiq(true);
      } else {
        setInsufficientLiq(false);
        setValue("bottomAmount", +value == 0 ? 0 : roundToDecimals(amount, 9));
        setRate(`${roundToDecimals(amount / value, 9)}`);
        setFee(`${feeAmount}`);
      }
    } else {
      manualResetForm();
    }
  };

  const handleBottomChange = (value: number | undefined = 0) => {
    if (tokenBonding && pricing && base && target && value && +value >= 0) {
      let amount = Math.abs(
        pricing.swapTargetAmount(+value, target.publicKey, base.publicKey)
      );
      setLastSet("bottom");

      if (isNaN(amount)) {
        setInsufficientLiq(true);
      } else {
        setInsufficientLiq(false);
        setValue("topAmount", +value == 0 ? 0 : roundToDecimals(amount, 9));
        setRate(`${roundToDecimals(value / amount, 9)}`);
        setFee(`${feeAmount}`);
      }
    } else {
      manualResetForm();
    }
  };

  const handleUseMax = () => {
    const amount = (ownedBase || 0) >= spendCap ? spendCap : ownedBase || 0;
    setValue("topAmount", amount);
    handleTopChange(amount);
  };

  const handleFlipTokens = () => {
    if (base && target) {
      onTradingMintsChange({
        base: target.publicKey,
        target: base.publicKey,
      });
    }
  };

  const handleBuyBase = () => {
    if (isBaseSol) {
      window.open(ftxPayLink);
    } else {
      onBuyBase(tokenBonding!.publicKey);
    }
  };

  const handleSwap = async (values: ISwapFormValues) => {
    await onSubmit({ ...values, lastSet });
  };

  if (isLoading || !base || !target || (connected && !pricing)) {
    return <Spinner />;
  }

  return (
    <Box ref={formRef} w="full">
      <form onSubmit={handleSubmit(handleSwap)}>
        <VStack spacing={4} padding={4} align="stretch" color="gray.500">
          <Flex flexDir="column">
            <Flex justifyContent="space-between">
              <Text color="gray.600" fontSize="xs">
                You Pay
              </Text>
              {base && (
                <Link color="primary.500" fontSize="xs" onClick={handleBuyBase}>
                  Buy More {base.ticker}
                </Link>
              )}
            </Flex>
            <InputGroup zIndex={100} size="lg">
              <Input
                isInvalid={!!errors.topAmount}
                isDisabled={!connected}
                id="topAmount"
                borderColor="gray.200"
                placeholder="0"
                type="number"
                fontSize="2xl"
                fontWeight="semibold"
                step={0.0000000001}
                min={0}
                _placeholder={{ color: "gray.200" }}
                {...register("topAmount", {
                  onChange: (e) => handleTopChange(e.target.value),
                })}
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
                      cursor="pointer"
                      isDisabled={!connected}
                      as={Button}
                      rightIcon={<BsChevronDown />}
                      leftIcon={
                        <Center
                          w={8}
                          h={8}
                          color="white"
                          bg="primary.500"
                          rounded="full"
                        >
                          <Avatar src={base.image} w="100%" h="100%" />
                        </Center>
                      }
                      borderRadius="20px 6px 6px 20px"
                      paddingX={1.5}
                      bgColor="gray.200"
                    >
                      {base.ticker}
                    </MenuButton>
                    <MenuList borderColor="gray.300">
                      {baseOptions.map((mint) => (
                        <MintMenuItem
                          mint={mint}
                          key={mint.toBase58()}
                          onClick={() =>
                            onTradingMintsChange({
                              base: mint,
                              target:
                                target.publicKey &&
                                mint.equals(target.publicKey)
                                  ? base.publicKey
                                  : target.publicKey,
                            })
                          }
                        />
                      ))}
                    </MenuList>
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
                  colorScheme="primary"
                  variant="ghost"
                  onClick={handleUseMax}
                >
                  Use Max (
                  {(ownedBase || 0) > spendCap ? spendCap : ownedBase || 0}{" "}
                  {base.ticker})
                </Button>
              )}
            </Flex>
            <Divider color="gray.200" />
            <IconButton
              isDisabled={!connected}
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
            <InputGroup zIndex={99} size="lg">
              <Input
                isInvalid={!!errors.bottomAmount}
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
                {...register("bottomAmount", {
                  onChange: (e) => handleBottomChange(e.target.value),
                })}
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
                      rightIcon={<BsChevronDown />}
                      isDisabled={!connected}
                      as={Button}
                      leftIcon={
                        <Center
                          w={8}
                          h={8}
                          color="white"
                          bg="primary.500"
                          rounded="full"
                        >
                          <Avatar src={target.image} w="100%" h="100%" />
                        </Center>
                      }
                      borderRadius="20px 6px 6px 20px"
                      paddingX={1.5}
                      bgColor="gray.200"
                    >
                      {target.ticker}
                    </MenuButton>
                    <MenuList borderColor="gray.300">
                      {targetOptions.map((mint) => (
                        <MintMenuItem
                          mint={mint}
                          key={mint.toBase58()}
                          onClick={() =>
                            onTradingMintsChange({
                              target: mint,
                              base:
                                base.publicKey && mint.equals(base.publicKey)
                                  ? target.publicKey
                                  : base.publicKey,
                            })
                          }
                        />
                      ))}
                    </MenuList>
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
                      _hover={{ color: "primary.500", cursor: "pointer" }}
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
                  zIndex={0}
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
              <Text>Solana Network Fees</Text>
              <Flex>{fee}</Flex>
            </Flex>
            {numRemaining && (
              <Flex justify="space-between" alignItems="center">
                <Text>Remaining</Text>
                <Flex>
                  {numRemaining} / {mintCap}
                </Flex>
              </Flex>
            )}
            {base &&
              target &&
              pricing?.hierarchy
                .path(base.publicKey, target.publicKey)
                .map((h, idx) => (
                  <Royalties
                    key={`royalties-${idx}`}
                    formRef={formRef}
                    tokenBonding={h.tokenBonding}
                    isBuying={!!isBuying}
                  />
                ))}
            {(extraTransactionInfo || []).map((i) => (
              <TransactionInfo formRef={formRef} {...i} key={i.name} />
            ))}
          </VStack>
          <Box position="relative">
            <ScaleFade
              initialScale={0.9}
              in={
                !hasBaseAmount ||
                moreThanSpendCap ||
                notLive ||
                insufficientLiq ||
                passedMintCap
              }
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
                {passedMintCap && (
                  <Text>
                    {numRemaining > 0
                      ? `Only ${numRemaining} left`
                      : "Sold Out"}
                  </Text>
                )}
                {moreThanSpendCap && (
                  <Text>
                    You cannot buy more than {spendCap} {base.ticker} at a time.
                  </Text>
                )}
                {notLive && (
                  <Text>
                    Goes live at{" "}
                    {targetBonding &&
                      new Date(
                        targetBonding.goLiveUnixTime.toNumber() * 1000
                      ).toLocaleString()}
                  </Text>
                )}
                {!hasBaseAmount && (
                  <Text>
                    Insufficient funds for this trade.{" "}
                    <Text as="u">
                      <Link
                        color="primary.100"
                        _hover={{ color: "primary.200" }}
                        onClick={handleBuyBase}
                      >
                        {`Buy more now.`}
                      </Link>
                    </Text>
                  </Text>
                )}
                {insufficientLiq && (
                  <Text>Insufficient Liqidity for this trade.</Text>
                )}
              </Center>
            </ScaleFade>
            <Button
              isDisabled={
                !connected ||
                !hasBaseAmount ||
                moreThanSpendCap ||
                notLive ||
                insufficientLiq ||
                passedMintCap
              }
              w="full"
              colorScheme="primary"
              size="lg"
              type="submit"
              isLoading={awaitingApproval || isSubmitting}
              loadingText={awaitingApproval ? "Awaiting Approval" : "Swapping"}
            >
              Trade
            </Button>
          </Box>
        </VStack>
      </form>
    </Box>
  );
};
