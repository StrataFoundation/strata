import React, { FC } from "react";
import { Box, Container, Stack, Text, useRadioGroup } from "@chakra-ui/react";
import { RadioCard } from "@/components/form/RadioCard";

export enum TokenOptionsSellOption {
  PriceDiscovery = "PriceDiscovery",
  FixedPrice = "FixedPrice",
}

export type TokenOptionsSellProps = {
  onSelect: (option: TokenOptionsSellOption) => void;
};

export const TokenOptionsSell: FC<TokenOptionsSellProps> = ({ onSelect }) => {
  const options: {
    value: string;
    heading: string;
    illustration: string;
    helpText: string;
  }[] = [
    {
      value: TokenOptionsSellOption.PriceDiscovery,
      heading: "Price Discovery",
      illustration: "",
      helpText:
        "You would like to set a price range and let demand dictate the price. This helps to avoid bots.",
    },
    {
      value: TokenOptionsSellOption.FixedPrice,
      heading: "Fixed Price",
      illustration: "",
      helpText: "You would like to sell this token for a predetermined price.",
    },
  ];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "tokenType",
    onChange: onSelect,
  });

  const group = getRootProps();

  return (
    <Box w="full" py={12} bgColor="gray.100">
      <Container maxW="container.lg">
        <Stack spacing={8}>
          <Stack alignItems="center" fontWeight="bold" lineHeight="normal">
            <Text fontSize="2xl">How do you want to handle price?</Text>
            <Text color="gray.400">Please select one below:</Text>
          </Stack>
          <Stack direction="row" {...group} justifyContent="center">
            {options.map(({ value, heading, illustration, helpText }) => {
              const radio = getRadioProps({ value });

              return (
                <RadioCard key={value} helpText={helpText} {...radio}>
                  <Text fontWeight="bold">{heading}</Text>
                </RadioCard>
              );
            })}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};
