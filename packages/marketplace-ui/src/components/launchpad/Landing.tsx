import React, { FC } from "react";
import {
  Box,
  Image,
  Container,
  Stack,
  Text,
  useRadioGroup,
} from "@chakra-ui/react";
import { RadioCard } from "@/components/form/RadioCard";

export enum LandingOption {
  CreateToken = "CreateToken",
  SellToken = "SellToken",
  Fundraise = "Fundraise",
  LBC = "LBC",
}

export type LandingProps = {
  onSelect: (option: LandingOption) => void;
};

export const Landing: FC<LandingProps> = ({ onSelect }) => {
  const options: {
    value: string;
    heading: string;
    illustration: string;
    helpText: string;
  }[] = [
    {
      value: LandingOption.CreateToken,
      heading: "Create a Token",
      illustration: "/undraw_handcrafts_user.svg",
      helpText: "You don’t have a token yet, but would like to create one.",
    },
    {
      value: LandingOption.SellToken,
      heading: "Sell a Token",
      illustration: "undraw_handcrafts_analytics.svg",
      helpText: "You already have a token created that you would like to sell.",
    },
    {
      value: LandingOption.Fundraise,
      heading: "Fundraise",
      illustration: "undraw_handcrafts_tree.svg",
      helpText:
        "You want to collect funds for a cause, where contributors get a token representing their contributions.",
    },
    {
      value: LandingOption.LBC,
      heading: "Dynamic Pricing NFT Mint",
      illustration: "undraw_handcrafts_analytics.svg",
      helpText:
        "Sell NFTs from a Metaplex CandyMachine using Strata’s dynamic price discovery. This allows you to avoid bots without the need of a whitelist.",
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
            <Text fontSize="2xl">What would you like to do?</Text>
            <Text color="gray.400">Please select one below:</Text>
          </Stack>
          <Stack {...group} direction="row" justifyContent="center">
            {options.map(({ value, heading, illustration, helpText }) => {
              const radio = getRadioProps({ value });

              return (
                <RadioCard key={value} helpText={helpText} {...radio}>
                  <Stack>
                    <Image
                      src={illustration}
                      alt={`${value}-illustration`}
                      h={24}
                      mb={4}
                    />
                    <Text fontWeight="bold" fontSize="md">
                      {heading}
                    </Text>
                  </Stack>
                </RadioCard>
              );
            })}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};
