import React from "react";
import { Flex, useColorMode, FlexProps } from "@chakra-ui/react";

export const Container = (props: FlexProps) => {
  const { colorMode } = useColorMode();
  const bgColor = { light: "gray.50", dark: "gray.900" };

  const color = { light: "black", dark: "white" };
  return (
    <Flex
      direction="row"
      alignItems="center"
      justifyContent="flex-start"
      width="100vw"
      bg={bgColor[colorMode]}
      color={color[colorMode]}
      {...props}
    />
  );
};
