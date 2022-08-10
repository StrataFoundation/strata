import React, { FC } from "react";
import { useRouter } from "next/router";
import { Box, Container, Button, Center, Stack, Text } from "@chakra-ui/react";

export type LaunchpadLayoutProps = {
  heading: string;
  subHeading: string;
  backVisible?: boolean;
  onBack?: () => Promise<void>;
  nextDisabled?: boolean;
  onNext?: () => Promise<void>;
};

export const LaunchpadLayout: FC<React.PropsWithChildren<LaunchpadLayoutProps>> = ({
  heading,
  subHeading,
  backVisible,
  onBack,
  nextDisabled,
  onNext,
  children,
}) => {
  const router = useRouter();

  const handleOnBack = async () => {
    onBack && (await onBack());
    router.back();
  };

  const handleOnNext = async () => {
    onNext && (await onNext());
  };

  return (
    <>
      <Center padding="54px" backgroundColor="black.500">
        <Stack spacing={6}>
          <Text fontSize="2xl" color="white" textAlign="center">
            Welcome to
            <Text
              fontWeight="Bold"
              background="linear-gradient(to right,#FFCD01, #E17E44);"
              backgroundClip="text"
            >
              Strata Launchpad
            </Text>
          </Text>
        </Stack>
      </Center>
      <Box w="full" py={12} bgColor="gray.100">
        <Container maxW="container.lg">
          {/* @ts-ignore */}
          <Stack spacing={8} justifyContent="center">
            <Stack
              alignItems="center"
              textAlign="center"
              fontWeight="bold"
              lineHeight="normal"
            >
              <Text fontSize="2xl">{heading}</Text>
              <Text color="gray.400">{subHeading}</Text>
            </Stack>
            {children}
          </Stack>
        </Container>
      </Box>
      <Container
        maxW="container.lg"
        display="flex"
        justifyContent="space-between"
        py={6}
      >
        {backVisible ? (
          <Button
            colorScheme="primary"
            variant="outline"
            w="full"
            maxW="140px"
            onClick={handleOnBack}
          >
            Back
          </Button>
        ) : (
          <span />
        )}

        <Button
          colorScheme="primary"
          disabled={nextDisabled}
          w="full"
          maxW="140px"
          onClick={handleOnNext}
        >
          Next
        </Button>
      </Container>
    </>
  );
};
