import React, { FC, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Stack, Text, useRadioGroup } from "@chakra-ui/react";
import { LaunchpadLayout } from "@/components/launchpad";
import { RadioCard } from "@/components/form/RadioCard";

export enum SellOptionsOption {
  Now = "Now",
  Later = "Later",
}

export const SellOptions: FC = () => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const options: {
    value: string;
    heading: string;
    illustration: string;
    helpText: string;
  }[] = [
    {
      value: SellOptionsOption.Now,
      heading: "Sell Token Now",
      illustration: "/sell-token-now.svg",
      helpText:
        "We'll help you discover the best pricing mechanic for your tokens specific needs.",
    },
    {
      value: SellOptionsOption.Later,
      heading: "Sell Token Later",
      illustration: "/sell-token-later.svg",
      helpText:
        "Copy the mint address and all other info needed to launch later.",
    },
  ];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "options",
    onChange: setSelectedOption,
  });

  const group = getRootProps();

  const handleOnNext = async () => {
    if (selectedOption === SellOptionsOption.Now)
      router.push("/launchpad/sell");

    if (selectedOption === SellOptionsOption.Later)
      alert(`handlOnNext with selectedOption : ${selectedOption}`);
  };

  return (
    <LaunchpadLayout
      heading="When would you like to begin the token sale?"
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

export default SellOptions;
