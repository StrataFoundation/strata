import {
  Box,
  BoxProps,
  Button,
  Center,
  Collapse,
  Icon,
  LightMode,
  Link,
  Progress,
  Spinner,
  Stack,
  Text,
  TextProps,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useInterval,
  VStack,
} from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import {
  useCurve,
  useTokenBonding,
  useTokenMetadata,
} from "@strata-foundation/react";
import moment from "moment";
import React, { useState } from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import { useLivePrice } from "../..//hooks/useLivePrice";
import { useCapInfo } from "../../hooks/useCapInfo";
import { numberWithCommas } from "../../utils/numberWithCommas";
import { BondingPlot } from "./BondingPlot";

const BlackBox = ({ children, ...other }: BoxProps) => {
  return (
    <Center
      p="26px"
      rounded="lg"
      backgroundColor={useColorModeValue("gray.200", "black.500")}
      {...other}
    >
      {children}
    </Center>
  );
};

const BigText = ({ children, ...other }: TextProps) => {
  return (
    <Text fontWeight={700} fontSize="24px" {...other}>
      {children}
    </Text>
  );
};

export const LbcInfo = ({
  tokenBondingKey,
  price: inputPrice,
}: {
  tokenBondingKey: PublicKey;
  price?: number;
}) => {
  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: true,
  });
  const { info: tokenBonding, loading: loadingBonding } =
    useTokenBonding(tokenBondingKey);
  const { price, loading: loadingPricing } = useLivePrice(tokenBondingKey);
  const { numRemaining, mintCap } = useCapInfo(tokenBondingKey);

  const priceToUse = inputPrice || price;

  const { info: curve } = useCurve(tokenBonding?.curve);
  const maxTime =
    // @ts-ignore
    curve?.definition.timeV0.curves[0].curve.timeDecayExponentialCurveV0
      .interval;
  const [elapsedTime, setElapsedTime] = useState<number | undefined>();
  useInterval(() => {
    setElapsedTime(
      tokenBonding
        ? new Date().valueOf() / 1000 - tokenBonding.goLiveUnixTime.toNumber()
        : undefined
    );
  }, 500);

  const endDate = new Date(0);
  endDate.setUTCSeconds(
    (tokenBonding?.goLiveUnixTime.toNumber() || 0) + (maxTime || 0)
  );

  const { metadata } = useTokenMetadata(tokenBonding?.baseMint);

  return (
    <VStack spacing={4} align="stretch">
      <Stack direction={["column", "row"]}>
        <VStack flexGrow={2}>
          <BlackBox w="full" position="relative">
            {loadingPricing || typeof priceToUse == "undefined" ? (
              <Spinner size="lg" />
            ) : (
              <BigText>
                {isNaN(priceToUse)
                  ? "Not Started"
                  : `${numberWithCommas(priceToUse, 4)} ${
                      metadata?.data.symbol
                    }`}
              </BigText>
            )}
            <Tooltip
              label={`${moment
                .duration(maxTime - (elapsedTime || 0), "seconds")
                .humanize()} Remaining`}
            >
              <Box
                position="absolute"
                top="14px"
                right="14px"
                w="14px"
                h="14px"
              >
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
            </Tooltip>
          </BlackBox>
          <Button
            color={useColorModeValue("black", "white")}
            variant="link"
            fontWeight={700}
            onClick={onToggle}
            rightIcon={
              <Icon
                mb="-3px"
                color="gray.300"
                as={isOpen ? BsChevronUp : BsChevronDown}
              />
            }
          >
            Price
          </Button>
        </VStack>
        <VStack flexGrow={1}>
          <BlackBox w="full" position="relative">
            {loadingBonding ? (
              <Spinner />
            ) : (
              <BigText>{numRemaining || "0"}</BigText>
            )}
            <LightMode>
              <Progress
                w="95%"
                size="xs"
                h="2px"
                position="absolute"
                bottom="-1px"
                colorScheme="primary"
                background="rgba(196, 196, 196, 0.4)"
                value={((numRemaining || 0) / (mintCap || 0)) * 100}
              />
            </LightMode>
          </BlackBox>
          <Text fontWeight={700}>Remaining</Text>
        </VStack>
      </Stack>
      <Collapse in={isOpen} animateOpacity>
        <VStack align="left" spacing={4} padding={4}>
          {isOpen && <BondingPlot tokenBondingKey={tokenBondingKey} />}
          <VStack spacing={1} align="left">
            <Text fontSize="14px" fontWeight="700">
              How does Dynamic Pricing work?
            </Text>
            <Text fontSize="12px">
              Dynamic Pricing is similiar to a Dutch Auction. The price starts
              high, lowers gradually, and only increases when people buy. This
              price discovery mechanism is powered by a Strata Liquidity
              Bootstrapping Curve (LBC).{" "}
              <Link
                color="primary.500"
                href="https://docs.strataprotocol.com/marketplace/lbc"
              >
                Learn More
              </Link>
            </Text>
          </VStack>
          <Text fontSize="14px">End Date: {moment(endDate).format("LLL")}</Text>
        </VStack>
      </Collapse>
    </VStack>
  );
};
