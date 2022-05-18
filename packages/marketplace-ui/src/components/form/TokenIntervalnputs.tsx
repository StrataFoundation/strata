import React, { useState } from "react";
import {
  Box,
  Button,
  Flex,
  Input,
  Stack,
  Text,
  useRadioGroup,
} from "@chakra-ui/react";
import { useFormContext } from "react-hook-form";
import { FormControlWithError } from "./FormControlWithError";
import { RadioCard } from "./RadioCard";

export interface ITokenIntervalFormProps {
  interval: number;
}

export const TokenIntervalInputs = () => {
  const {
    watch,
    formState: { errors },
    register,
    setValue,
  } = useFormContext<ITokenIntervalFormProps>();
  const [isManualEntry, setIsManualEntry] = useState(false);

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "interval",
    onChange: (value) => setValue("interval", +value),
  });

  const interval = watch("interval");
  const group = getRootProps();
  const intervalOptions = [
    { value: 1800, heading: "30 Minutes" },
    { value: 3600, heading: "1 Hour" },
    { value: 10800, heading: "3 Hours" },
    { value: 43200, heading: "12 Hours" },
    { value: 86400, heading: "1 Day" },
    { value: 259200, heading: "3 Days" },
  ];

  return (
    <>
      <FormControlWithError
        id="interval"
        label="Interval"
        errors={errors}
        help={
          isManualEntry
            ? "How long should this LBC go on for (in seconds)? This period is the time during which the price will fall. We recommend you set this period long enough so that everyone gets a chance to participate. Windows less than 15 Minutes (900 seconds) are not recommended."
            : "How long should this LBC go on for? This period is the time during which the price will fall. We recommend you set this period long enough so that everyone gets a chance to participate."
        }
      >
        <Stack {...group} direction="row" flexWrap="wrap" spacing={0}>
          {intervalOptions.map(({ value, heading }) => {
            const radio = getRadioProps({ value });
            return (
              <RadioCard {...radio} isChecked={interval === value} key={value}>
                <Flex w={24} h={10} justifyContent="center" alignItems="center">
                  <Text fontWeight="bold" fontSize="sm">
                    {heading}
                  </Text>
                </Flex>
              </RadioCard>
            );
          })}
        </Stack>
        <Box mt={3}>
          {!isManualEntry && (
            <Button
              colorScheme="orange"
              variant="link"
              size="sm"
              onClick={() => setIsManualEntry(true)}
            >
              Custom Interval
            </Button>
          )}
          {isManualEntry && (
            <>
              <Input
                type="number"
                min={0}
                step={0.000000000001}
                {...register("interval")}
              />
              <Text color="red.500" fontSize="sm" mt={2}>
                Any value less than 15 Minutes (900 seconds) will result in the
                initial price dropping fast.
              </Text>
            </>
          )}
        </Box>
      </FormControlWithError>
    </>
  );
};
