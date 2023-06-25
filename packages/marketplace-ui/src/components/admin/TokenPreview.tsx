import {
  Image,
  Stack,
  Text,
  Flex,
} from "@chakra-ui/react";
import { IMetadataExtension } from "@strata-foundation/spl-utils";
import React from 'react';

interface TokenPreviewProps {
  data: IMetadataExtension | undefined;
  image: string | undefined;
}

export const TokenPreview = ({ data, image }: TokenPreviewProps) => {
  return (
    <Flex>
      {image && (
        <Image
          alt="Token logo"
          w="70px"
          h="70px"
          borderRadius="50%"
          src={image}
        />
      )}
      {data?.name && data?.symbol && (
        <Stack paddingLeft="10px">
          <Text 
            fontSize="2xl" 
            color="white" 
            textAlign="left" 
            fontWeight="bold"
          >
            {data?.name}
          </Text>
          <Text 
            fontSize="md" 
            color="white" 
            marginTop="0 !important"
          >
              ${data?.symbol}
            </Text>
        </Stack>
      )}
    </Flex>
  );
};
  