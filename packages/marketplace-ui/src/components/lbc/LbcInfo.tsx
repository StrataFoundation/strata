import {
  Box,
  BoxProps,
  Center,
  HStack,
  Icon,
  Progress,
  Spinner,
  Stack,
  Text,
  TextProps,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import {
  useCapInfo,
  useCurve,
  useSolanaUnixTime,
  useTokenSwapFromId,
  useMetaplexTokenMetadata,
} from "@strata-foundation/react";
import React, { useEffect, useState } from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import { useLivePrice } from "../..//hooks/useLivePrice";
import { numberWithCommas } from "../../utils/numberWithCommas";
import { RiInformationFill } from "react-icons/ri";
import ReactCountdown from "react-countdown";

export const BlackBox = ({ children, ...other }: BoxProps) => {
  return (
    <Box
      p={4}
      rounded="lg"
      backgroundColor={useColorModeValue("gray.200", "black.500")}
      {...other}
    >
      {children}
    </Box>
  );
};

export const BigText = ({ children, ...other }: TextProps) => {
  return (
    <Text fontWeight="semibold" fontSize="xl" {...other}>
      {children}
    </Text>
  );
};

export const LbcInfo = ({
  id,
  useTokenOfferingCurve = false,
  price: inputPrice,
}: {
  id: PublicKey;
  useTokenOfferingCurve?: boolean;
  price?: number;
}) => {
  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: false,
  });
  const {
    tokenBonding,
    numRemaining,
    loading: loadingBonding,
  } = useTokenSwapFromId(id);
  const { price, loading: loadingPricing } = useLivePrice(
    tokenBonding?.publicKey
  );
  const { mintCap } = useCapInfo(
    tokenBonding?.publicKey,
    useTokenOfferingCurve
  );

  const priceToUse = inputPrice || price;

  const { info: curve } = useCurve(tokenBonding?.curve);
  const maxTime =
    // @ts-ignore
    curve?.definition.timeV0.curves[0].curve.timeDecayExponentialCurveV0
      .interval;
  const unixTime = useSolanaUnixTime();
  const [elapsedTime, setElapsedTime] = useState<number | undefined>();
  useEffect(() => {
    setElapsedTime(
      tokenBonding
        ? (unixTime || new Date().valueOf() / 1000) -
            tokenBonding.goLiveUnixTime.toNumber()
        : undefined
    );
  }, [unixTime]);

  const endDate = new Date(0);
  endDate.setUTCSeconds(
    (tokenBonding?.goLiveUnixTime.toNumber() || 0) + (maxTime || 0)
  );

  const isLive =
    tokenBonding && unixTime
      ? tokenBonding.goLiveUnixTime.toNumber() < unixTime
      : false;

  const { metadata } = useMetaplexTokenMetadata(tokenBonding?.baseMint);
  const { metadata: targetMeta } = useMetaplexTokenMetadata(
    tokenBonding?.targetMint
  );

  const renderer = ({
    days,
    hours,
    minutes,
    seconds,
    completed,
  }: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    completed: boolean;
  }) => {
    if (completed) {
      return <BigText>Finished</BigText>;
    }
    return (
      <BigText>
        {days ? `${days} Days, ` : ""}
        {`${hours}`.padStart(2, "0")}:{`${minutes}`.padStart(2, "0")}:
        {`${seconds}`.padStart(2, "0")}
      </BigText>
    );
  };

  return (
    <VStack spacing={4} align="stretch" justify="stretch">
      <VStack align="stretch" justify="stretch">
        <BlackBox w="full">
          <VStack align="left" spacing={0}>
            <HStack spacing={1} position="relative">
              <Text fontSize="sm">Time Remaining</Text>
              <Box w="14px" h="14px">
                <CircularProgressbar
                  counterClockwise
                  value={
                    elapsedTime && maxTime
                      ? ((maxTime - elapsedTime) / maxTime) * 100
                      : 0
                  }
                  strokeWidth={50}
                  styles={buildStyles({
                    strokeLinecap: "butt",
                    trailColor: "transparent",
                    pathColor: "rgba(255, 255, 255, 0.36)",
                  })}
                />
              </Box>
            </HStack>
            {isLive ? (
              // @ts-ignore
              <ReactCountdown
                date={endDate}
                now={() => (unixTime ? unixTime * 1000 : new Date().valueOf())}
                renderer={renderer}
              />
            ) : (
              <BigText>Not Started</BigText>
            )}
          </VStack>
        </BlackBox>
        <Stack direction={["column", "row"]} justify="stretch">
          <BlackBox w="full" position="relative">
            <VStack align="left" spacing={0}>
              <HStack spacing={2}>
                <Text fontSize="sm">Price</Text>
                <Tooltip
                  hasArrow
                  label="Dynamic Pricing is similiar to a Dutch Auction. The price starts
              high, lowers gradually, and only increases when people buy. This
              price discovery mechanism is powered by a Strata Liquidity
              Bootstrapping Curve (LBC)"
                >
                  <Center>
                    <Icon w={4} h={4} as={RiInformationFill} />
                  </Center>
                </Tooltip>
              </HStack>
              {loadingPricing || typeof priceToUse == "undefined" ? (
                <Spinner size="lg" />
              ) : (
                <BigText>
                  {isNaN(priceToUse)
                    ? "Not Started"
                    : metadata?.data.symbol === "USDC"
                    ? `$${numberWithCommas(priceToUse, 2)}`
                    : `${numberWithCommas(priceToUse, 4)} ${
                        metadata?.data.symbol
                      }`}
                </BigText>
              )}
            </VStack>
          </BlackBox>
          <BlackBox w="full" position="relative">
            <VStack spacing={0} align="left">
              <Text fontSize="sm">Remaining</Text>
              {loadingBonding ? (
                <Spinner />
              ) : (
                <BigText>
                  {numRemaining ? numberWithCommas(numRemaining, 4) : "0"}{" "}
                  {targetMeta?.data.symbol}
                </BigText>
              )}
              <Progress
                w="88%"
                size="xs"
                h="2px"
                position="absolute"
                bottom="8px"
                colorScheme="primary"
                background="rgba(196, 196, 196, 0.4)"
                value={((numRemaining || 0) / (mintCap || 0)) * 100}
              />
            </VStack>
          </BlackBox>
        </Stack>
      </VStack>
    </VStack>
  );
};
