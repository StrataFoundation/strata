import React from "react";
import { Flex, Stack, Text, useRadioGroup } from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import { FormControlWithError } from "./FormControlWithError";
import { RadioCard } from "./RadioCard";

export interface ITokenMintDecimalsFormProps {
  decimals: number;
}

export const TokenMintDecimalsInputs = ({
  maxDecimals = 12,
}: {
  maxDecimals?: number;
}) => {
  const {
    watch,
    formState: { errors },
    setValue,
    clearErrors,
  } = useFormContext<ITokenMintDecimalsFormProps>();

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "decimals",
    onChange: (value) => {
      setValue("decimals", +value);
      clearErrors("decimals");
    },
  });

  const decimals = watch("decimals");
  const group = getRootProps();
  const decimalOptions = Array.from(Array(maxDecimals + 1)).map((_, index) => ({
    value: index,
    heading: index,
  }));

  return (
    <>
      <FormControlWithError
        id="decimals"
        label="Mint Decimals"
        errors={errors}
        help="The number of decimal places this mint will have. For example, SOL has 9 decimal places of precision. 0 is best used for 1:1 items like raffle tickets, collectibles, or something redeemable."
      >
        <Stack {...group} direction="row" flexWrap="wrap" spacing={0}>
          {decimalOptions.map(({ value, heading }) => {
            const radio = getRadioProps({ value });
            return (
              <RadioCard {...radio} isChecked={decimals === value} key={value}>
                <Flex w={10} h={10} justifyContent="center" alignItems="center">
                  <Text fontWeight="bold" fontSize="md">
                    {heading}
                  </Text>
                </Flex>
              </RadioCard>
            );
          })}
        </Stack>
      </FormControlWithError>
    </>
  );
};
