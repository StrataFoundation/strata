import { Tag, Image, VStack, Button, Center, Text, Heading, HStack, useColorModeValue, Badge, Circle } from "@chakra-ui/react";
import React from "react";
import { Carousel } from "react-responsive-carousel";

import "react-responsive-carousel/lib/styles/carousel.min.css"; // requires a loader
import { ActiveUsers } from "./ActiveUsers";

const COMMUNITIES = [{
  
}]

const Community = () => {
  return (
    <HStack
      p="0"
      rounded="2xl"
      borderColor={useColorModeValue("gray.100", "gray.700")}
      borderWidth="1px"
    >
      <Center p={8} flexGrow={1}>
        <VStack align="start" spacing={6}>
          <VStack align="start" w="full" spacing={2}>
            <Text
              lineHeight="120%"
              fontWeight="extrabold"
              noOfLines={2}
              textAlign="left"
              fontSize="4xl"
            >
              Famous Fox Federation
            </Text>
            <Text
              align="left"
              color={useColorModeValue("gray.600", "gray.200")}
            >
              A community of foxes building cool shit
            </Text>
          </VStack>
          <HStack spacing={2}>
            <ActiveUsers num={20} />
          </HStack>
          <Button colorScheme="primary">Join Now!</Button>
        </VStack>
      </Center>
      <Image
        roundedRight="2xl"
        style={{ width: "60%" }}
        objectFit="cover"
        alt="famous"
        src="https://source.unsplash.com/random/800x600"
      />
    </HStack>
  );
}

export const FeaturedCommunities = () => {
  return (
    <Carousel interval={10000} swipeable emulateTouch infiniteLoop autoPlay>
      <Community />
      <Community />
    </Carousel>
  );
}