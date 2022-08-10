import React, { FC } from "react";
import { Box, Flex, Stack, useRadio, UseRadioProps } from "@chakra-ui/react";

export type RadioCardProps = React.PropsWithChildren<{
  helpText?: string;
  disabled?: boolean;
} & UseRadioProps>;

export const RadioCard: FC<RadioCardProps> = ({
  children,
  disabled = false,
  ...props
}) => {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <Box as="label">
        <input {...input} />
        <Box
          {...checkbox}
          mt={{ base: 2, md: 0 }}
          mr={2}
          cursor="pointer"
          borderWidth="1px"
          borderRadius="md"
          bg="gray.200"
          _checked={{
            bg: "orange.600",
            color: "white",
            borderColor: "orange.600",
          }}
        >
          {/* @ts-ignore */}
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export const RadioCardWithAffordance: FC<RadioCardProps> = ({
  children,
  disabled = false,
  ...props
}) => {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box
      w="full"
      maxW={{ base: "auto", md: "242px" }}
      flexGrow={1}
      flexShrink={1}
      flexBasis={0}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <Box as="label" textAlign="center">
        <input {...input} />
        {/* @ts-ignore */}
        <Stack
          {...checkbox}
          cursor={disabled ? "inherit" : "pointer"}
          opacity={disabled ? 0.4 : 1}
          borderWidth="1px"
          borderRadius="md"
          h="full"
          bg="white"
          borderColor="white"
          position="relative"
          px={4}
          py={4}
          mb={2}
          _hover={
            disabled
              ? {}
              : {
                  borderColor: "orange.400",
                }
          }
          _checked={{
            borderColor: "orange.400",
            color: "black",
          }}
          flexDirection="column"
          justifyContent="space-between"
        >
          <Flex justifyContent="right" position="absolute" top={2} right={2}>
            <Flex
              w={4}
              h={4}
              rounded="full"
              bg={(input as any).checked ? "orange.500" : "gray.200"}
              _hover={disabled ? {} : { bg: "orange.500" }}
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
        </Stack>
      </Box>
    </Box>
  );
};
