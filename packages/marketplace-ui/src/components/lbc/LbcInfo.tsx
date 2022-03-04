import { Box, BoxProps, Button, Center, Collapse, Icon, LightMode, Link, Progress, Spinner, Stack, Text, TextProps, Tooltip, useColorModeValue, useDisclosure, useInterval, VStack } from "@chakra-ui/react";
import { PublicKey } from "@solana/web3.js";
import { useCurve, useTokenBonding, useTokenMetadata } from "@strata-foundation/react";
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
    <Center p="26px" rounded="lg" backgroundColor={useColorModeValue("gray.200", "black.500")} {...other}>
      {children}
    </Center>
  );
}

const BigText = ({ children, ...other }: TextProps) => {
  return <Text fontWeight={700} fontSize="24px" {...other}>{ children }</Text>
}

export const LbcInfo = ({ tokenBondingKey, price: inputPrice }: { tokenBondingKey: PublicKey, price?: number }) => {
  const { isOpen, onToggle } = useDisclosure();
  const { info: tokenBonding, loading: loadingBonding } =
    useTokenBonding(tokenBondingKey);
  const { price, loading: loadingPricing } = useLivePrice(tokenBondingKey)
  const { numRemaining, mintCap } = useCapInfo(tokenBondingKey);

  const priceToUse = inputPrice || price;
  
  const { info: curve } = useCurve(tokenBonding?.curve);
  // @ts-ignore
  const maxTime = curve?.definition.timeV0.curves[0].curve.timeDecayExponentialCurveV0.interval;
  const [elapsedTime, setElapsedTime] = useState<number | undefined>()
  useInterval(() => {
    setElapsedTime(
      tokenBonding
        ? (new Date().valueOf() / 1000) - tokenBonding.goLiveUnixTime.toNumber()
        : undefined
    );
  }, 500);
  
  const endDate = new Date(0);
  endDate.setUTCSeconds((tokenBonding?.goLiveUnixTime.toNumber() || 0) + (maxTime || 0))

  const { metadata } = useTokenMetadata(tokenBonding?.baseMint);

  return (
    <VStack spacing={8} align="stretch">
      <Stack direction={["column", "row"]}>
        <VStack flexGrow={2}>
          <BlackBox w="full" position="relative">
            {loadingPricing || typeof priceToUse == "undefined" ? (
              <Spinner size="lg" />
            ) : (
              <BigText>
                {numberWithCommas(priceToUse, 4)} {metadata?.data.symbol}
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
            <Text fontWeight="700">How does Dynamic Pricing work?</Text>
            <Text fontSize="13px">
              Strata uses a price discovery mechanism called a Liquidity
              Bootstrapping Curve (LBC). This functions similar to a dutch
              auction, starting with a high price that lowers over time and
              increases with every purchase.{" "}
              <Link
                color="orange"
                href="https://www.strataprotocol.com/docs/marketplace/lbc"
              >
                Learn More
              </Link>
            </Text>
          </VStack>
          <Text>End Date: {moment(endDate).format("LLL")}</Text>
        </VStack>
      </Collapse>
    </VStack>
  );
}
