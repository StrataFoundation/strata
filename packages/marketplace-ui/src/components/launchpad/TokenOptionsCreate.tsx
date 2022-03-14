import React, { FC } from "react";
import { Box, Container, Stack, Text, useRadioGroup } from "@chakra-ui/react";
import { RadioCard } from "@/components/form/RadioCard";

export enum TokenOptionsCreateOption {
  FullyManaged = "FullyManaged",
  SelfManaged = "SelfManaged",
}

export type TokenOptionsCreateProps = {
  onSelect: (option: TokenOptionsCreateOption) => void;
};

export const TokenOptionsCreate: FC<TokenOptionsCreateProps> = ({
  onSelect,
}) => {
  const options: {
    value: string;
    heading: string;
    illustration: string;
    helpText: string;
  }[] = [
    {
      value: TokenOptionsCreateOption.FullyManaged,
      heading: "Fully Managed",
      illustration: "",
      helpText:
        "Create you a token that you can let people buy right now. You don’t want to worry about liquidity providers, supply management, or pricing.",
    },
    {
      value: TokenOptionsCreateOption.SelfManaged,
      heading: "Self Managed",
      illustration: "",
      helpText:
        "You want to manage your own supply and liquidity. You do not need protocol managed liquditity.",
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
            <Text fontSize="2xl">
              How do you want your token to be managed?
            </Text>
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
