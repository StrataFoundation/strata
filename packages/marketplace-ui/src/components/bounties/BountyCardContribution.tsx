import React from "react";
import { HStack, VStack, Text, Spinner } from "@chakra-ui/react";
import { roundToDecimals } from "@strata-foundation/react";
import { numberWithCommas } from "../../utils/numberWithCommas";

export const BountyCardContribution = ({
  amount,
  symbol,
  text = "Contributed",
}: {
  amount: number | undefined;
  symbol: string | undefined;
  text?: string;
}) => {
  return (
    <VStack
      spacing={2}
      rounded="lg"
      padding={4}
      border="1px solid"
      borderColor="gray.200"
    >
      <HStack spacing={2} justify="center" flexWrap="wrap">
        <Text fontWeight={800} color="gray.700">
          {typeof amount != "undefined" ? (
            numberWithCommas(roundToDecimals(amount, 4))
          ) : (
            <Spinner size="sm" />
          )}
        </Text>
        <Text color="gray.700">{symbol}</Text>
      </HStack>
      <Text color="gray.500">{text}</Text>
    </VStack>
  );
};
