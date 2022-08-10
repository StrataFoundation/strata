import React, { FC } from "react";
import {
  Box,
  BoxProps,
  Stack,
  useColorModeValue,
  useRadio,
  UseRadioProps,
  Flex,
} from "@chakra-ui/react";

export type RadioCardProps = {
  helpText?: string;
  disabled?: boolean;
  containerProps?: BoxProps;
} & UseRadioProps;

export const RadioCard: FC<React.PropsWithChildren<RadioCardProps>> = ({
  //@ts-ignore
  children,
  disabled = false,
  ...props
}) => {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();
  const bg = useColorModeValue("gray.200", "gray.800");

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
        {/* @ts-ignore */}
        <input {...input} />
        <Box
          {...checkbox}
          mt={{ base: 2, md: 0 }}
          mr={2}
          cursor="pointer"
          borderWidth="1px"
          borderRadius="md"
          bg={bg}
          _checked={{
            bg: "orange.600",
            color: "white",
            borderColor: "orange.600",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export const RadioCardWithAffordance: FC<RadioCardProps> = ({
  //@ts-ignore
  children,
  disabled = false,
  containerProps = {},
  ...props
}) => {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();
  const bg = useColorModeValue("gray.200", "gray.800");

  return (
    <Box
      w="full"
      maxW={{ base: "auto", md: "242px" }}
      flexGrow={1}
      flexShrink={1}
      flexBasis={0}
      {...containerProps}
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <Box as="label" textAlign="center">
        {/* @ts-ignore */}
        <input {...input} />
        <Stack
          {...checkbox}
          cursor={disabled ? "inherit" : "pointer"}
          opacity={disabled ? 0.4 : 1}
          borderWidth="1px"
          borderRadius="md"
          borderColor="gray.500"
          position="relative"
          mb={2}
          _hover={
            disabled
              ? {}
              : {
                  borderColor: "white",
                }
          }
          _checked={{
            bg: bg,
            borderColor: "white",
          }}
          flexDirection="column"
          justifyContent="space-between"
        >
          <Flex justifyContent="right" position="absolute" top={4} right={2}>
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
