import React, { FC, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  Box,
  Flex,
  Stack,
  Text,
  useRadioGroup,
  useClipboard,
} from "@chakra-ui/react";
import { LaunchpadLayout } from "../../src/components/launchpad";
import { RadioCardWithAffordance } from "../../src/components/form/RadioCard";
import { route, routes } from "../../src/utils/routes";

export enum SellTokenOption {
  PriceDiscovery = "PriceDiscovery",
  FixedPrice = "FixedPrice",
}

export const SellToken: FC = () => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const mint = router.query["mint"] as string | undefined;
  const { hasCopied, onCopy } = useClipboard(mint || "");

  const options: {
    value: string;
    heading: string;
    illustration: string;
    helpText: string;
  }[] = [
    {
      value: SellTokenOption.PriceDiscovery,
      heading: "Price Discovery",
      illustration: "/price-discovery.svg",
      helpText:
        "Set a price range and let demand dictate the price. This helps to avoid bots.",
    },
    {
      value: SellTokenOption.FixedPrice,
      heading: "Fixed Price",
      illustration: "/fixed-price.svg",
      helpText: "Sell this token for a predetermined price.",
    },
  ];

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "options",
    onChange: setSelectedOption,
  });

  const group = getRootProps();

  const handleOnNext = async () => {
    if (selectedOption === SellTokenOption.PriceDiscovery)
      router.push(route(routes.newLbc, { mint }), undefined, { shallow: true });

    if (selectedOption === SellTokenOption.FixedPrice)
      router.push(route(routes.newFixedPrice, { mint }), undefined, {
        shallow: true,
      });
  };

  return (
    <LaunchpadLayout
      heading="How do you want to handle price?"
      subHeading="Please select one below:"
      backVisible
      nextDisabled={!selectedOption}
      onNext={handleOnNext}
    >
      <>
        {mint && (
          <Flex w="full" justifyContent="center">
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
              onClick={onCopy}
              cursor="pointer"
            >
              <Stack direction="row" spacing={6}>
                <Image
                  src="/sell-token-now.svg"
                  height="60px"
                  width="100%"
                  alt="Token Created"
                />
                <Stack flexGrow={1} spacing={0}>
                  <Text fontWeight="bold" fontSize="sm">
                    Token Succesfully Created!
                  </Text>
                  <Text color="gray.500" fontSize="xs">
                    If you would like to launch this token at a future date,
                    please take note of the mint address.
                  </Text>
                  <Text color="gray.500" fontSize="xs" pt={2}>
                    Check your wallet for the token. In wallets that don’t
                    support the Metaplex metadata standard v2, it may show in
                    collectibles.
                  </Text>
                  <Stack spacing={0} pt={2}>
                    <Text fontWeight="semibold" fontSize="xs">
                      Mint Address:
                      {hasCopied && (
                        <>
                          {" "}
                          <Text as="span" color="orange.500">
                            (Copied)
                          </Text>{" "}
                        </>
                      )}
                      <Text color="gray.500">{mint}</Text>
                    </Text>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          </Flex>
        )}
        <Stack
          {...group}
          direction={{ base: "column", md: "row" }}
          justifyContent="center"
          alignItems={{ base: "center", md: "normal" }}
        >
          {options.map(({ value, heading, illustration, helpText }) => {
            const radio = getRadioProps({ value });

            return (
              <RadioCardWithAffordance
                key={value}
                helpText={helpText}
                {...radio}
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
          })}
        </Stack>
      </>
    </LaunchpadLayout>
  );
};

export default SellToken;
