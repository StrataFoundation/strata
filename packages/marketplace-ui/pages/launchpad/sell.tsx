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
  Fade,
} from "@chakra-ui/react";
import { LaunchpadLayout } from "@/components/launchpad";
import { RadioCard } from "@/components/form/RadioCard";
import { routes } from "@/utils/routes";

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
        "You would like to set a price range and let demand dictate the price. This helps to avoid bots.",
    },
    {
      value: SellTokenOption.FixedPrice,
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
    if (selectedOption === SellTokenOption.PriceDiscovery)
      router.push(routes.newLbc.path + (mint ? "?mint=" + mint : ""));

    if (selectedOption === SellTokenOption.FixedPrice)
      router.push(routes.newSale.path + (mint ? "?mint=" + mint : ""));
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
      </>
    </LaunchpadLayout>
  );
};

export default SellToken;
