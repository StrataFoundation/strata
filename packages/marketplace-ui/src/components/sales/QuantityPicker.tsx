import {
  Center,
  Flex,
  FormControl,
  FormControlProps,
  FormLabel,
  IconButton,
  IconButtonProps,
  Text,
  useControllableState,
  UseControllableStateProps,
} from "@chakra-ui/react";
import * as React from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

interface QuantityPickerProps extends UseControllableStateProps<number> {
  max?: number;
  min?: number;
  rootProps?: FormControlProps;
}

export const QuantityPicker = (props: QuantityPickerProps) => {
  const { min = 0, max, rootProps, ...rest } = props;

  const [value, setValue] = useControllableState(rest);
  const handleDecrement = () => setValue(value === min ? value : value - 1);
  const handleIncrement = () => setValue(value === max ? value : value + 1);

  return (
    <FormControl {...rootProps}>
      <FormLabel fontSize="sm" fontWeight="medium">
        Quantity
      </FormLabel>
      <Flex
        borderRadius="base"
        px="2"
        py="0.4375rem"
        borderWidth="1px"
        justifyContent="space-between"
      >
        <QuantityPickerButton
          onClick={handleDecrement}
          icon={<FiMinus />}
          isDisabled={value === min}
          aria-label="Decrement"
        />
        <Center minW="8">
          <Text as="span" fontWeight="semibold" userSelect="none">
            {value}
          </Text>
        </Center>
        <QuantityPickerButton
          onClick={handleIncrement}
          icon={<FiPlus />}
          isDisabled={value === max}
          aria-label="Increment"
        />
      </Flex>
    </FormControl>
  );
};

const QuantityPickerButton = (props: IconButtonProps) => (
  <IconButton
    size="sm"
    fontSize="md"
    _focus={{ boxShadow: "none" }}
    _focusVisible={{ boxShadow: "outline" }}
    {...props}
  />
);
