import React, { useEffect } from "react";
import { useCandyMachine } from "@strata-foundation/marketplace-ui";
import { Spinner } from "@chakra-ui/react";
import { useVariables, useVariablesContext, VariablesProvider } from "../../theme/Root/variables";
import { recursiveTransformBN } from "../../theme/ReactLiveScope/AsyncButton";
import BrowserOnly from "@docusaurus/BrowserOnly";

function BrowserOnlyReactJson(props) {
  return (
    <BrowserOnly fallback={<div>...</div>}>
      {() => {
        const Component = require("react-json-view").default;
        return <Component {...props} />;
      }}
    </BrowserOnly>
  );
}

export function CandyMachineConfig() {
  const { setVariables } = useVariablesContext();
  const variables = useVariables();
  const { info, loading } = useCandyMachine(variables?.candyMachineId);

  useEffect(() => {
    setVariables((vars) => ({
      ...vars,
      candyMachine: info,
    }));
  }, [variables.candyMachineId]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <BrowserOnlyReactJson
      theme="bright:inverted"
      collapsed={1}
      displayDataTypes={false}
      name={false}
      src={recursiveTransformBN(info || {})}
    />
  );
}
