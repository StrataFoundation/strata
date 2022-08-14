import React from "react";
import { Badge, Circle, HStack, Text } from "@chakra-ui/react";

import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader

export const ActiveUsers = ({
  num,
  fontSize = "15px",
}: {
  num: number;
  fontSize?: string;
}) => (
  <Badge
    color="white"
    position="absolute"
    top="16px"
    left="16px"
    rounded="full"
    p="10px"
    background="gray.600"
    fontSize={fontSize}
    lineHeight={fontSize}
    fontWeight="bold"
  >
    <HStack spacing={1}>
      <Circle background={"#67FF92"} size="8px" />
      <Text>{num} Active</Text>
    </HStack>
  </Badge>
);
