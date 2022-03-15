import React, { FC, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Stack, Text, useRadioGroup } from "@chakra-ui/react";
import { LaunchpadLayout } from "@/components/launchpad";
import { RadioCard } from "@/components/form/RadioCard";

export enum SellTokenOptionsOption {
  PriceDiscovery = "PriceDiscovery",
  FixedPrice = "FixedPrice",
}

export const SellTokenOptions: FC = () => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const options: {
    value: string;
    heading: string;
    illustration: string;
    helpText: string;
  }[] = [
    {
      value: SellTokenOptionsOption.PriceDiscovery,
      heading: "Price Discovery",
      illustration: "/price-discovery.svg",
      helpText:
        "You would like to set a price range and let demand dictate the price. This helps to avoid bots.",
    },
    {
      value: SellTokenOptionsOption.FixedPrice,
      heading: "Fixed Price",
      illustration: "/fixed-price.svg",
      helpText: "You would like to sell this token for a predetermined price.",
    },
  ];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "options",
    onChange: setSelectedOption,
  });

  const group = getRootProps();

  const handleOnNext = async () => {
    alert(`handlOnNext with selectedOption : ${selectedOption}`);
  };

  return (
    <LaunchpadLayout
      heading="How do you want to handle price?"
      subHeading="Please select one below:"
      backVisible
      nextDisabled={!selectedOption}
      onNext={handleOnNext}
    >
      <Stack direction="row" {...group} justifyContent="center">
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

export default SellTokenOptions;
