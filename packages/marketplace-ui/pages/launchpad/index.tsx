import { RadioCardWithAffordance } from "../../src/components/form";
import { LaunchpadLayout } from "../../src/components/launchpad";
import { route, routes } from "../../src/utils/routes";
import {
  Box,
  Flex,
  Stack,
  Text, useMediaQuery, useRadioGroup
} from "@chakra-ui/react";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { FC, useState } from "react";

export enum LandingOption {
  CreateToken = "CreateToken",
  SellToken = "SellToken",
  Fundraise = "Fundraise",
  LBC = "LBC",
}

export const LaunchPad: FC = ({ children }) => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLargerThanBase] = useMediaQuery(`(min-width: 768px)`);

  const options: {
    value: string;
    heading: string;
    illustration: string;
    disabled?: boolean;
    helpText: string;
  }[] = [
    {
      value: LandingOption.CreateToken,
      heading: "Create New Token",
      illustration: "/create-a-token.svg",
      helpText: "You don’t have a token yet, but would like to create one.",
    },
    {
      value: LandingOption.SellToken,
      heading: "Sell Existing Token",
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
      router.push(route(routes.create));

    if (selectedOption === LandingOption.SellToken)
      router.push(route(routes.sell));

    if (selectedOption === LandingOption.Fundraise)
      router.push(route(routes.newBounty));

    if (selectedOption === LandingOption.LBC)
      router.push(route(routes.newLbc, { candymachine: "true" }));
  };

  return (
    <LaunchpadLayout
      heading="What would you like to do?"
      subHeading="Please select one below:"
      nextDisabled={!selectedOption}
      onNext={handleOnNext}
    >
      <Stack
        {...group}
        direction={{ base: "column", md: "row" }}
        justifyContent="center"
        alignItems={{ base: "center", md: "normal" }}
      >
        {options.map(
          ({ value, heading, illustration, helpText, disabled = false }) => {
            const radio = getRadioProps({ value });

            return (
              <RadioCardWithAffordance
                key={value}
                {...radio}
                disabled={disabled}
              >
                <Flex
                  h="full"
                  direction={{ base: "row", md: "column" }}
                  textAlign={{ base: "left", md: "center" }}
                >
                  <Flex
                    justifyContent="center"
                    alignItems="center"
                    flexShrink={0}
                  >
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
                    <Text
                      fontWeight="bold"
                      fontSize="md"
                      pt={{ base: 0, md: 4 }}
                    >
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
              </RadioCardWithAffordance>
            );
          }
        )}
      </Stack>
      <Stack 
        w="full"
        spacing={2} 
        direction={{ base: "column", md: "row" }}
        justifyContent={{ base: "stretch", md: "center" }}
        alignItems={{ base: "center", md: "stretch" }}
      >
        <Box
          bg="white"
          position="relative"
          rounded="lg"
          borderWidth="1px"
          borderColor="white"
          _hover={{ borderColor: "orange.500" }}
          py={4}
          px={2}
          w="100%"
          maxW="492px"
          cursor="pointer"
          onClick={() =>
            window.open(
              "https://twitter.com/messages/compose?recipient_id=1455566541941006345"
            )
          }
        >
          <Stack direction="row">
            <Flex flexShrink={0} justifyContent="center" alignItems="center">
              <Image
                src="/sell-token-later.svg"
                height="50px"
                width="100%"
                alt="Check Back Later"
              />
            </Flex>
            <Stack flexGrow={1} spacing={0}>
              <Text fontWeight="bold" fontSize="sm">
                Dont see what you want to do?
              </Text>
              <Text color="gray.500" fontSize="xs">
                Check back later as we will be adding more options to this page.
              </Text>
              <Text color="gray.500" fontSize="xs" pt={2}>
                Or feel free to reach out to us via{" "}
                <Text as="span" color="orange.500">
                  Twitter
                </Text>{" "}
                and we can brainstorm something with you together!
              </Text>
            </Stack>
          </Stack>
        </Box>
        <Box
          bg="white"
          position="relative"
          rounded="lg"
          borderWidth="1px"
          borderColor="white"
          _hover={{ borderColor: "orange.500" }}
          py={4}
          px={2}
          w="100%"
          maxW="492px"
          cursor="pointer"
          onClick={() => router.push(route(routes.editMetadata))}
        >
          <Stack direction="row">
            <Flex flexShrink={0} justifyContent="center" alignItems="center">
              <Image
                src="/update-metadata.svg"
                height="50px"
                width="100%"
                alt="Update Metadata"
              />
            </Flex>
            <Stack flexGrow={1} spacing={0}>
              <Text fontWeight="bold" fontSize="sm">
                Edit my Token&apos;s Name, Symbol, or Image
              </Text>
              <Text color="gray.500" fontSize="xs">
                Update the name, symbol, or image of an existing token using the
                Metaplex Token Metadata Standard. You can also use this to
                convert token-list tokens to be Metaplex standard compliant.
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </LaunchpadLayout>
  );
};
export default LaunchPad;
