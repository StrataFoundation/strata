import React from 'react'
import { VStack, Heading, HStack, FormControl, FormLabel, Input, FormHelperText } from '@chakra-ui/react'

interface IRoyaltiesInputsProps {
  symbol: string;
  baseSymbol: string | undefined;
  register: (field: any) => any;
  minBuyTargetRoyaltyPercentage: number | undefined;
  maxBuyTargetRoyaltyPercentage: number | undefined; 
  minSellTargetRoyaltyPercentage: number | undefined; 
  maxSellTargetRoyaltyPercentage: number | undefined;
  minBuyBaseRoyaltyPercentage: number | undefined;
  maxBuyBaseRoyaltyPercentage: number | undefined;
  minSellBaseRoyaltyPercentage: number | undefined;
  maxSellBaseRoyaltyPercentage: number | undefined;
}

export const humanReadablePercentage = (u32: number) => {
  if (u32 && u32 !== 0) {
    return ((u32 / 4294967295) * 100).toFixed(2);
  }
  return 0;
};

export function percentOr(percentu32: number | undefined, def: number) {
  return percentu32 ? Number(humanReadablePercentage(percentu32)) : def;
}

export const RoyaltiesInputs = ({
  symbol,
  baseSymbol,
  register,
  minBuyTargetRoyaltyPercentage, 
  maxBuyTargetRoyaltyPercentage, 
  minSellTargetRoyaltyPercentage, 
  maxSellTargetRoyaltyPercentage,
  minBuyBaseRoyaltyPercentage,
  maxBuyBaseRoyaltyPercentage,
  minSellBaseRoyaltyPercentage,
  maxSellBaseRoyaltyPercentage,
}: IRoyaltiesInputsProps) => {
  return (
    <VStack align="left" w="full">
      <Heading fontSize="xl" mb={4}>
        Royalties
      </Heading>
      <HStack>
        <FormControl
          id="buyTargetRoyaltyPercentage"
          borderColor="gray.200"
        >
          <FormLabel>{symbol || "Managed Token"} (Buy)</FormLabel>
          <Input
            isRequired
            type="number"
            min={percentOr(
              minBuyTargetRoyaltyPercentage,
              0
            )}
            max={percentOr(
              maxBuyTargetRoyaltyPercentage,
              100
            )}
            placeholder="5"
            defaultValue={5}
            step={0.00001}
            {...register("buyTargetRoyaltyPercentage")}
          />
        </FormControl>
        <FormControl
          id="sellTargetRoyaltyPercentage"
          borderColor="gray.200"
        >
          <FormLabel>{symbol || "Managed Token"} (Sell)</FormLabel>
          <Input
            isRequired
            type="number"
            min={percentOr(
              minSellTargetRoyaltyPercentage,
              0
            )}
            max={percentOr(
              maxSellTargetRoyaltyPercentage,
              100
            )}
            placeholder="0"
            defaultValue={0}
            step={0.00001}
            {...register("sellTargetRoyaltyPercentage")}
          />
        </FormControl>
      </HStack>
      <HStack>
        <FormControl
          id="buyBaseRoyaltyPercentage"
          borderColor="gray.200"
        >
          <FormLabel>
            {baseSymbol || "Base Token"} (Buy)
          </FormLabel>
          <Input
            isRequired
            type="number"
            min={percentOr(
              minBuyBaseRoyaltyPercentage,
              0
            )}
            max={percentOr(
              maxBuyBaseRoyaltyPercentage,
              100
            )}
            placeholder="0"
            defaultValue={0}
            step={0.00001}
            {...register("buyBaseRoyaltyPercentage")}
          />
        </FormControl>
        <FormControl
          id="sellBaseRoyaltyPercentage"
          borderColor="gray.200"
        >
          <FormLabel>
            {baseSymbol || "Base Token"} (Sell)
          </FormLabel>
          <Input
            isRequired
            type="number"
            min={percentOr(
              minSellBaseRoyaltyPercentage,
              0
            )}
            max={percentOr(
              maxSellBaseRoyaltyPercentage,
              100
            )}
            placeholder="0"
            defaultValue={0}
            step={0.00001}
            {...register("sellBaseRoyaltyPercentage")}
          />
        </FormControl>
      </HStack>
      <FormControl>
        <FormHelperText>
          A Percentage of coin buys/sales that will be sent to your
          wallet. We recommend to keep this less than a combined 10% for
          buys/sales.
        </FormHelperText>
      </FormControl>
    </VStack>
  )
}
