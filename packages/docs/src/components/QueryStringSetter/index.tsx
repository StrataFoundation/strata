import React, { useEffect } from "react";
import { Text, Input, Box } from "@chakra-ui/react";
import { useQueryString } from "@strata-foundation/react";
import { useVariablesContext } from "../../theme/Root/variables";

export function QueryStringSetter<T>({
  name,
  conv,
  label
}: {
  label: string;
  name: string;
  conv: (value: string) => T;
}) {
  const [passedValue, setPassedValue] = useQueryString(name, "");
  const { setVariables, variables } = useVariablesContext();
  useEffect(() => {
    setVariables((vars) => {
      try {
        return {
          ...vars,
          [name]: conv(passedValue),
        };
      } catch (e: any) {
        console.error(e);
      }
    });
  }, [conv, passedValue, setVariables]);

  return (
    <Box p={1}>
      <Text fontWeight="bold">{label}</Text>
      <Input
        onChange={(e) => setPassedValue(e.target.value)}
        value={passedValue}
      />
    </Box>
  );
}
