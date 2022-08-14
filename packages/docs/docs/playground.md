---
sidebar_position: 3
---

# Playground

A playground to test and work with your strata data.

:::warning
Any changes made here in mainnet (or devnet) are final. Use with care
:::

import { NetworkSelect } from "@site/src/components/NetworkSelect";

<NetworkSelect />


```jsx async allowMainnet

```

## Trade Interface

```jsx async
var tokenBonding = new PublicKey("")
```
```jsx live allowMainnet
 function TokenDisplay() {
   const { targetMint } = useVariables(); // Getting token bonding from above code;
   
   if (tokenBonding) {
      return <Swap id={targetMint} />
   }

   return <div>Please run the code block above</div>
 }
```