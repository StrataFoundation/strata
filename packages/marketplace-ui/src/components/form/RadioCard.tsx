import React, { FC } from "react";
import {
  Box,
  Flex,
  Stack,
  Text,
  Radio,
  useRadio,
  UseRadioProps,
} from "@chakra-ui/react";

export type RadioCardProps = {
  helpText?: string;
} & UseRadioProps;

export const RadioCard: FC<RadioCardProps> = ({
  children,
  helpText,
  ...props
}) => {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box w="full" maxW="242px" flexGrow={1} flexShrink={1} flexBasis={0}>
      <Box as="label" textAlign="center">
        <input {...input} />
        <Stack
          {...checkbox}
          cursor="pointer"
          borderWidth="1px"
          borderRadius="md"
          h="full"
          bg="white"
          borderColor="white"
          px={4}
          py={4}
          mb={2}
          _hover={{
            borderColor: "orange.400",
          }}
          _checked={{
            borderColor: "orange.400",
            color: "black",
          }}
          flexDirection="column"
          justifyContent="space-between"
        >
          <Flex justifyContent="right">
            <Flex
              w={4}
              h={4}
              rounded="full"
              bg={(input as any).checked ? "orange.500" : "gray.200"}
              _hover={{ bg: "orange.500" }}
              justifyContent="center"
              alignItems="center"
            >
              <Box
                {...((input as any).checked
                  ? { w: 1.5, h: 1.5 }
                  : { w: 3, h: 3 })}
                rounded="full"
                bg="white"
              />
            </Flex>
          </Flex>
          {children}
          <Flex flexGrow={1} alignItems="center">
            {helpText && (
              <Text fontSize="xs" color="gray.500" px={2} textAlign="center">
                {helpText}
              </Text>
            )}
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};
