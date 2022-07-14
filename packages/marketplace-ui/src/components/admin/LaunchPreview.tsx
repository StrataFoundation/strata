import {
  Image,
  Stack,
  Text,
  Flex,
} from "@chakra-ui/react";

interface LaunchPreviewProps {
  name: string | undefined;
  amountRaised: number | undefined;
  image: string | undefined;
  baseTokenName: string | undefined;
}

export const LaunchPreview = ({ name, amountRaised, image, baseTokenName }: LaunchPreviewProps) => {
  return (
    <Flex>
      <Image
        alt="Token logo"
        w="70px"
        h="70px"
        borderRadius="50%"
        src={image}
      />
      <Stack paddingLeft="10px">
        <Text 
          fontSize="2xl" 
          color="white" 
          textAlign="left" 
          fontWeight="bold"
        >
          {name}
        </Text>
        <Text 
          fontSize="md" 
          color="white" 
          marginTop="0 !important"
        >
          Amount raised: {amountRaised} {baseTokenName}
          </Text>
      </Stack>
    </Flex>
  );
};
    