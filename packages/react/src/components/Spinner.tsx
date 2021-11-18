import React from "react";
import { Flex, Spinner as ChakraSpinner, SpinnerProps } from "@chakra-ui/react";

export const Spinner = ({
  size = "lg",
  thickness = "2px",
  emptyColor = "gray.400",
  color = "gray.700",
  speed = "0.65s",
  ...props
}: SpinnerProps) => (
  <Flex w="full" h="full" alignItems="center" justifyContent="center">
    <ChakraSpinner
      size={size}
      thickness={thickness}
      emptyColor={emptyColor}
      color={color}
      speed={speed}
      {...props}
    />
  </Flex>
);
