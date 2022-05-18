import { useVariables } from "../../theme/Root/variables";
import React from "react";
import CodeBlock from "@theme-init/CodeBlock";

export const UrlDisplay = ({ subs, value }: { value: string, subs: string[] }) => {
  const variables = useVariables();

  const subbed = subs.reduce((currValue, name) => {
    return currValue.replace(new RegExp(":" + name, 'g'), variables[name])
  }, value)

  return <CodeBlock>
    { subbed }
  </CodeBlock>
}
