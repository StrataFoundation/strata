import React, { FC, useState, useEffect } from "react";
import { Container, Button, Center, Stack, Text } from "@chakra-ui/react";

import {
  Landing,
  LandingOption,
  TokenOptionsCreate,
  TokenOptionsCreateOption,
  TokenOptionsSell,
  TokenOptionsSellOption,
} from "@/components/launchpad";

export const LaunchPad: FC = ({ children }) => {
  const [isNextDisabled, setIsNextDisabled] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState<
    LandingOption | TokenOptionsCreateOption | TokenOptionsSellOption | null
  >(null);

  const handleOnBack = () => {
    if (currentStep === 3 || currentStep === 2) {
      setCurrentStep(1);
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOnNext = () => {
    if (selectedOption === LandingOption.CreateToken) {
      setCurrentStep(2);
    } else if (selectedOption === LandingOption.SellToken) {
      setCurrentStep(3);
    } else {
      setCurrentStep(currentStep + 1);
    }
    setSelectedOption(null);
  };

  useEffect(() => {
    if (selectedOption) {
      setIsNextDisabled(false);
    } else {
      setIsNextDisabled(true);
    }
  }, [selectedOption]);

  return (
    <>
      <Center padding="54px" backgroundColor="black.500">
        <Stack spacing={6}>
          <Text fontSize="xl" color="white" textAlign="center">
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
      {currentStep === 1 && <Landing onSelect={setSelectedOption} />}
      {currentStep === 2 && <TokenOptionsCreate onSelect={setSelectedOption} />}
      {currentStep === 3 && <TokenOptionsSell onSelect={setSelectedOption} />}
      <Container
        maxW="container.lg"
        display="flex"
        justifyContent="space-between"
        py={6}
      >
        {currentStep > 1 ? (
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
          disabled={isNextDisabled}
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
export default LaunchPad;
