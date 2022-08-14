import React, { useEffect } from "react";
import { Text, Input, Box } from "@chakra-ui/react";
import { useQueryString } from "@strata-foundation/react";
import { useVariablesContext } from "../../theme/Root/variables";

export function QueryStringSetter({
  name,
  label,
  conv = (v) => v,
}: {
  label: string;
  name: string;
  conv: (input: any) => any;
}) {
  const [passedValue, setPassedValue] = useQueryString(name, "");
  const { setVariables, variables } = useVariablesContext();
  useEffect(() => {
    setVariables((vars) => {
      try {
        return {
          ...vars,
          [name]: conv(passedValue),
          [name + "Raw"]: passedValue,
        };
      } catch (e: any) {
        console.error(e);
      }
    });
  }, [passedValue, setVariables]);

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
