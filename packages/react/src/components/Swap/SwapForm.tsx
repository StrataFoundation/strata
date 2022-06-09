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
  useColorModeValue,
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
import { useFtxPayLink, useMint, useProvider, useSolanaUnixTime, useTokenMetadata, useTokenSwapFromId } from "../../hooks";
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
  onBuyBase?: (tokenBonding: PublicKey) => void;
  onSubmit: (values: ISwapFormValues) => Promise<void>;
  id: PublicKey | undefined;
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
  showAttribution?: boolean;
  extraTransactionInfo?: Omit<TransactionInfoArgs, "formRef">[];
  swapBaseWithTargetEnabled?: boolean;
}

function MintMenuItem({
  mint,
  onClick,
}: {
  mint: PublicKey;
  onClick: () => void;
}) {
  const { image, metadata } = useTokenMetadata(mint);
  const dropdownVariant = useColorModeValue("solid", "ghost");

  return (
    <MenuItem
      onClick={onClick}
      variant={dropdownVariant}
      icon={
        <Center w={8} h={8} rounded="full">
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
  id,
  pricing,
  base,
  target,
  ownedBase,
  spendCap,
  feeAmount,
  baseOptions,
  targetOptions,
  mintCap,
  numRemaining,
  showAttribution = true,
  swapBaseWithTargetEnabled = true,
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
  const unixTime = useSolanaUnixTime();

  const {
    tokenBonding,
    childEntangler,
    parentEntangler,
  } = useTokenSwapFromId(id);

  const lowMint = pricing?.hierarchy.lowest(base!.publicKey, target!.publicKey, childEntangler?.childMint, parentEntangler?.parentMint);
  const isBuying = pricing?.isBuying(lowMint!, target!.publicKey, childEntangler?.childMint, parentEntangler?.parentMint);

  const targetBonding = lowMint && pricing?.hierarchy.findTarget(lowMint);
  const passedMintCap =
    typeof numRemaining !== "undefined" && numRemaining < bottomAmount;

  const targetMintAcc = useMint(target?.publicKey);
  const baseMintAcc = useMint(base?.publicKey);

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
    updatePrice()
  }, [pricing, bottomAmount, topAmount, targetMintAcc, baseMintAcc, unixTime]);

  const handleTopChange = (value: number | undefined = 0) => {
    if (tokenBonding && pricing && base && target && value && +value >= 0) {
      setLastSet("top");
      const amount = pricing.swap(
        +value,
        base.publicKey,
        target.publicKey,
        true,
        unixTime,
        childEntangler?.childMint,
        parentEntangler?.parentMint,
      );
      if (isNaN(amount)) {
        setInsufficientLiq(true);
      } else {
        setInsufficientLiq(false);
        setValue(
          "bottomAmount",
          +value == 0
            ? 0
            : roundToDecimals(
                amount,
                targetMintAcc ? targetMintAcc.decimals : 9
              )
        );
        setRate(
          `${roundToDecimals(
            amount / value,
            targetMintAcc ? targetMintAcc.decimals : 9
          )}`
        );
        setFee(`${feeAmount}`);
      }
    } else {
      manualResetForm();
    }
  };

  const handleBottomChange = (value: number | undefined = 0) => {
    if (tokenBonding && pricing && base && target && value && +value >= 0) {
      let amount = Math.abs(
        pricing.swapTargetAmount(+value, target.publicKey, base.publicKey, true, unixTime, childEntangler?.childMint, parentEntangler?.parentMint)
      );
      setLastSet("bottom");

      if (isNaN(amount)) {
        setInsufficientLiq(true);
      } else {
        setInsufficientLiq(false);
        setValue(
          "topAmount",
          +value == 0
            ? 0
            : roundToDecimals(amount, baseMintAcc ? baseMintAcc.decimals : 9)
        );
        setRate(
          `${roundToDecimals(
            value / amount,
            baseMintAcc ? baseMintAcc.decimals : 9
          )}`
        );
        setFee(`${feeAmount}`);
      }
    } else {
      manualResetForm();
    }
  };

  const attColor = useColorModeValue("gray.400", "gray.200");
  const dropdownVariant = useColorModeValue("solid", "ghost");
  const swapBackground = useColorModeValue("gray.200", "gray.500");
  const color = useColorModeValue("gray.500", "gray.200");
  const inputBorderColor = useColorModeValue("gray.200", "gray.500");
  const useMaxBg = useColorModeValue("primary.200", "black.500");

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

  const handleBuyBase = onBuyBase
    ? () => onBuyBase(tokenBonding!.publicKey)
    : isBaseSol
    ? () => window.open(ftxPayLink)
    : undefined;

  const handleSwap = async (values: ISwapFormValues) => {
    await onSubmit({ ...values, lastSet });
  };

  if (isLoading || !base || !target) {
    return <Spinner />;
  }

  return (
    <Box ref={formRef} w="full" color={color}>
      <form onSubmit={handleSubmit(handleSwap)}>
        <VStack spacing={4} align="stretch">
          <VStack spacing={1} align="left">
            <Flex justifyContent="space-between">
              <Text fontSize="xs">You Pay</Text>
              {base && handleBuyBase && (
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
                borderColor={inputBorderColor}
                placeholder="0"
                type="number"
                fontSize="2xl"
                fontWeight="semibold"
                step={
                  1 * Math.pow(10, baseMintAcc ? -baseMintAcc.decimals : -9)
                }
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
                      variant={dropdownVariant}
                      cursor="pointer"
                      isDisabled={!connected}
                      as={Button}
                      rightIcon={
                        targetOptions.length > 0 ? <BsChevronDown /> : null
                      }
                      leftIcon={
                        <Center w={6} h={6} rounded="full">
                          <Avatar src={base.image} w="100%" h="100%" />
                        </Center>
                      }
                      borderRadius="20px 6px 6px 20px"
                      paddingX={1.5}
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
          </VStack>
          <HStack
            justify="center"
            alignItems="center"
            position="relative"
            paddingY={2}
          >
            <Divider borderColor={swapBackground} />
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
                  _hover={{ bgColor: useMaxBg }}
                >
                  Use Max (
                  {(ownedBase || 0) > spendCap ? spendCap : ownedBase || 0}{" "}
                  {base.ticker})
                </Button>
              )}
            </Flex>
            <Divider borderColor={swapBackground} />
            {swapBaseWithTargetEnabled && (
              <IconButton
                isDisabled={!connected}
                aria-label="Flip Tokens"
                size="sm"
                bgColor={swapBackground}
                color="white"
                rounded="full"
                position="absolute"
                right={2}
                onClick={handleFlipTokens}
                icon={<Icon as={RiArrowUpDownFill} w={5} h={5} />}
              />
            )}
          </HStack>
          <VStack align="left" spacing={1}>
            <Text fontSize="xs">You Receive</Text>
            <InputGroup zIndex={99} size="lg">
              <Input
                isInvalid={!!errors.bottomAmount}
                isDisabled={!connected}
                id="bottomAmount"
                borderColor={inputBorderColor}
                placeholder="0"
                type="number"
                fontSize="2xl"
                fontWeight="semibold"
                step={
                  1 * Math.pow(10, targetMintAcc ? -targetMintAcc.decimals : -9)
                }
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
                      variant={dropdownVariant}
                      rightIcon={
                        targetOptions.length > 0 ? <BsChevronDown /> : null
                      }
                      isDisabled={!connected}
                      as={Button}
                      leftIcon={
                        <Center w={6} h={6} rounded="full">
                          <Avatar src={target.image} w="100%" h="100%" />
                        </Center>
                      }
                      borderRadius="20px 6px 6px 20px"
                      paddingX={1.5}
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
          </VStack>
          <VStack
            spacing={1}
            padding={4}
            align="stretch"
            borderColor={inputBorderColor}
            borderWidth="1px"
            rounded="lg"
            fontSize="sm"
            opacity={connected ? 1 : 0.6}
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
                  borderColor={inputBorderColor}
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
                {/* Make sure this doesn't render at the same time as the above insufficient funds */}
                {insufficientLiq && hasBaseAmount && (
                  <Text>Insufficient Liqidity for this trade.</Text>
                )}
              </Center>
            </ScaleFade>
            {!connected && (
              <Button
                w="full"
                colorScheme="primary"
                size="lg"
                onClick={onConnectWallet}
              >
                Connect Wallet
              </Button>
            )}
            {connected && (
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
                loadingText={
                  awaitingApproval ? "Awaiting Approval" : "Swapping"
                }
              >
                Trade
              </Button>
            )}
          </Box>
          {showAttribution && (
            <Center>
              <HStack spacing={1} fontSize="14px">
                <Text color={attColor}>Powered by</Text>
                <Link
                  color="primary.500"
                  fontWeight="medium"
                  href="https://strataprotocol.com"
                >
                  Strata
                </Link>
              </HStack>
            </Center>
          )}
        </VStack>
      </form>
    </Box>
  );
};
