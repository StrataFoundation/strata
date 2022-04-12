import React from "react";
import {
  Box,
  Flex,
  Stack,
  Text,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import { FormControlWithError } from "./FormControlWithError";

export interface ITokenMintDecimalsFormProps {
  decimals: number;
}

const DecimalsRadioCard = (props: any) => {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box as="label">
      <input {...input} />
      <Box
        {...checkbox}
        mt={{ base: 2, md: 0 }}
        mr={2}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="md"
        bg="gray.200"
        _checked={{
          bg: "orange.600",
          color: "white",
          borderColor: "orange.600",
        }}
      >
        {props.children}
      </Box>
    </Box>
  );
};

export const TokenMintDecimalsInputs = ({
  maxDecimals = 12,
}: {
  maxDecimals?: number;
}) => {
  const {
    watch,
    formState: { errors },
    setValue,
  } = useFormContext<ITokenMintDecimalsFormProps>();

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "decimals",
    onChange: (value) => setValue("decimals", +value),
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
        help="The number of decimal places this mint will have. For example, SOL has 9 decimal places of precision. Zero is best used for 1:1 items like raffle tickets, collectibles, or something redeemable."
      >
        <Stack {...group} direction="row" flexWrap="wrap" spacing={0}>
          {decimalOptions.map(({ value, heading }) => {
            const radio = getRadioProps({ value });
            return (
              <DecimalsRadioCard
                {...radio}
                isChecked={decimals === value}
                key={value}
              >
                <Flex w={10} h={10} justifyContent="center" alignItems="center">
                  <Text fontWeight="bold" fontSize="md">
                    {heading}
                  </Text>
                </Flex>
              </DecimalsRadioCard>
            );
          })}
        </Stack>
      </FormControlWithError>
    </>
  );
};
