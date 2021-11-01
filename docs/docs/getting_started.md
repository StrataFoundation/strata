---
sidebar_position: 1
---

# Getting Started

name Protocol lets you effortlessly create Social Tokens and communities of Social Tokens (Collectives) on Solana!

## Initializing the SDK

Every smart contract on name comes with an SDK for easy use. The two main smart contracts are spl-collective and spl-token-bonding.

Let's get started by installing the sdks

```bash
yarn add @wum.bo/spl-collective @wum.bo/spl-token-bonding
```

Now, we can initialize the sdks:

```jsx
import { PublicKey } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor";
import { SplTokenBonding } from "@wum.bo/spl-token-bonding";
import { SplTokenCollective } from "@wum.bo/spl-token-collective";

anchor.setProvider(anchor.Provider.local());
const provider = anchor.getProvider();

let tokenCollective, tokenBonding;
async function getPrograms() {
  tokenCollective = await SplTokenCollective.init(provider);
  tokenBonding = await SplTokenBonding.init(provider);
  return {
    tokenCollective,
    tokenBonding
  }
}
getPrograms().catch(console.error)
```

## Creating a Social Token

:::tip Live Code
You can run and edit all of the code blocks in this tutorial against Solana devnet! The above block contains all of the needed imports.
:::

Let's create a Social Token named TEST within the Open Collective that gives us 10% of every TEST token minted in royalties.

```jsx async
const tokenRef = await tokenCollective.createSocialToken({
  tokenName: "TEST",
  tokenBondingParams: {
    buyBaseRoyaltyPercentage: 0,
    buyTargetRoyaltyPercentage: 10,
    sellBaseRoyaltyPercentage: 0,
    sellTargetRoyaltyPercentage: 0
  }
})
```
