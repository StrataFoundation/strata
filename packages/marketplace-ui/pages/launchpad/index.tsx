import React, { FC, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Stack, Text, useRadioGroup } from "@chakra-ui/react";
import { LaunchpadLayout } from "@/components/launchpad";
import { RadioCard } from "@/components/form";

export enum LandingOption {
  CreateToken = "CreateToken",
  SellToken = "SellToken",
  Fundraise = "Fundraise",
  LBC = "LBC",
}

export const LaunchPad: FC = ({ children }) => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const options: {
    value: string;
    heading: string;
    illustration: string;
    helpText: string;
  }[] = [
    {
      value: LandingOption.CreateToken,
      heading: "Create a Token",
      illustration: "/create-a-token.svg",
      helpText: "You don’t have a token yet, but would like to create one.",
    },
    {
      value: LandingOption.SellToken,
      heading: "Sell a Token",
      illustration: "/sell-a-token.svg",
      helpText: "You already have a token created that you would like to sell.",
    },
    {
      value: LandingOption.Fundraise,
      heading: "Fundraise",
      illustration: "/fundraise.svg",
      helpText:
        "You want to collect funds for a cause, where contributors get a token representing their contributions.",
    },
    {
      value: LandingOption.LBC,
      heading: "Dynamic Pricing NFT Mint",
      illustration: "/dynamic-pricing-mint.svg",
      helpText:
        "Sell NFTs from a Metaplex CandyMachine using Strata’s dynamic price discovery. This allows you to avoid bots without the need of a whitelist.",
    },
  ];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "options",
    onChange: setSelectedOption,
  });

  const group = getRootProps();

  const handleOnNext = async () => {
    if (selectedOption === LandingOption.CreateToken)
      router.push("/launchpad/create-token-options");

    if (selectedOption === LandingOption.SellToken)
      router.push("/launchpad/sell-token-options");

    if (selectedOption === LandingOption.Fundraise) alert("Fundraise");

    if (selectedOption === LandingOption.LBC) alert("LBC");
  };

  return (
    <LaunchpadLayout
      heading="What would you like to launch?"
      subHeading="Please select one below:"
      nextDisabled={!selectedOption}
      onNext={handleOnNext}
    >
      <Stack {...group} direction="row" justifyContent="center">
        {options.map(({ value, heading, illustration, helpText }) => {
          const radio = getRadioProps({ value });

          return (
            <RadioCard key={value} helpText={helpText} {...radio}>
              <Stack>
                <Image
                  src={illustration}
                  alt={`${value}-illustration`}
                  height="100px"
                  width="100%"
                />
                <Text fontWeight="bold" fontSize="md">
                  {heading}
                </Text>
              </Stack>
            </RadioCard>
          );
        })}
      </Stack>
    </LaunchpadLayout>
  );
};
export default LaunchPad;
