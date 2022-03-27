import React, { FC, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { Flex, Stack, Text, useRadioGroup } from "@chakra-ui/react";
import { LaunchpadLayout } from "@/components/launchpad";
import { RadioCard } from "@/components/form/RadioCard";
import { routes } from "@/utils/routes";

export enum CreateTokenOption {
  FullyManaged = "FullyManaged",
  SelfManaged = "SelfManaged",
}

export const CreateToken: FC = () => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const options: {
    value: string;
    heading: string;
    illustration: string;
    helpText: string;
  }[] = [
    {
      value: CreateTokenOption.FullyManaged,
      heading: "Fully Managed",
      illustration: "/fully-managed.svg",
      helpText:
        "Create you a token that you can let people buy right now. You do not need to worry about liquidity providers, supply management, or pricing.",
    },
    {
      value: CreateTokenOption.SelfManaged,
      heading: "Self Managed",
      illustration: "/self-managed.svg",
      helpText:
        "You want to manage your own supply and liquidity. You do not need protocol managed liquditity.",
    },
  ];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "options",
    onChange: setSelectedOption,
  });

  const group = getRootProps();

  const handleOnNext = async () => {
    if (selectedOption === CreateTokenOption.FullyManaged)
      router.push(routes.newFullyManaged.path);

    if (selectedOption === CreateTokenOption.SelfManaged)
      router.push(routes.newManual.path);
  };

  return (
    <LaunchpadLayout
      heading="How do you want your token to be managed?"
      subHeading="Please select one below:"
      backVisible
      nextDisabled={!selectedOption}
      onNext={handleOnNext}
    >
      <Stack
        {...group}
        direction={{ base: "column", md: "row" }}
        justifyContent="center"
        alignItems={{ base: "center", md: "normal" }}
      >
        {options.map(({ value, heading, illustration, helpText }) => {
          const radio = getRadioProps({ value });

          return (
            <RadioCard key={value} helpText={helpText} {...radio}>
              <Flex
                h="full"
                direction={{ base: "row", md: "column" }}
                textAlign={{ base: "left", md: "center" }}
              >
                <Flex justifyContent="center" alignItem="center" flexShrink={0}>
                  <Image
                    src={illustration}
                    alt={`${value}-illustration`}
                    height="70px"
                    width="100%"
                  />
                </Flex>
                <Flex
                  flexGrow={1}
                  h="full"
                  direction="column"
                  alignItems={{ base: "start", md: "center" }}
                  justifyContent={{ base: "center", md: "initial" }}
                >
                  <Text fontWeight="bold" fontSize="md" pt={{ base: 0, md: 4 }}>
                    {heading}
                  </Text>
                  <Flex
                    w="full"
                    flexGrow={{ base: 0, md: 1 }}
                    alignItems={{ base: "start", md: "center" }}
                  >
                    <Text fontSize="xs" color="gray.500">
                      {helpText}
                    </Text>
                  </Flex>
                </Flex>
              </Flex>
            </RadioCard>
          );
        })}
      </Stack>
    </LaunchpadLayout>
  );
};

export default CreateToken;
