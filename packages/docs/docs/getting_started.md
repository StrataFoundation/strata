---
sidebar_position: 1
---

# Getting Started

Strata Protocol lets you effortlessly create Social Tokens and communities of Social Tokens (Collectives) on Solana!

## Initializing the SDK

Every smart contract on Strata comes with an SDK. The two main smart contracts are `spl-collective` and `spl-token-bonding`.

Let's get started by installing the sdks

```bash
yarn add @strata-foundation/spl-collective @strata-foundation/spl-token-bonding
```

Now, we can initialize the sdks:

```jsx
import { PublicKey } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { getAssociatedAccountBalance } from "@strata-foundation/spl-utils";

anchor.setProvider(anchor.Provider.local());
const provider = anchor.getProvider();

const tokenCollectiveSdk, tokenBondingSdk;
async function getPrograms() {
  tokenCollectiveSdk = await SplTokenCollective.init(provider);
  tokenBondingSdk = await SplTokenBonding.init(provider);
  return {
    tokenCollectiveSdk,
    tokenBondingSdk
  }
}
getPrograms().catch(console.error);
```

## Creating a Social Token

:::tip Live Code
You can run and edit all of the code blocks in this tutorial against Solana devnet! The above block contains all of the needed imports.

Use `var` instead of `let` or `const` so that these blocks can be re-run
:::

Let's create a Social Token named TEST within the Open Collective that gives us 10% of every TEST token minted in royalties.

```jsx async name=create_social
var { tokenRef, tokenBonding } = await tokenCollectiveSdk.createSocialToken({
  ignoreIfExists: true, // If a Social Token already exists for this wallet, ignore.
  metadata: {
    tokenName: "My Test Token",
    symbol: "TEST",
    image: "https://ibb.co/sRpBwYh",
    // Because this is dev, we need to provide the metaplex dev upload file url
    uploadUrl: "https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFile2"
  },
  tokenBondingParams: {
    buyBaseRoyaltyPercentage: 0,
    buyTargetRoyaltyPercentage: 10,
    sellBaseRoyaltyPercentage: 0,
    sellTargetRoyaltyPercentage: 0
  }
});
```

We can fetch the accounts we just created

```jsx async name=fetch deps=create_social
var tokenRefAcct = await tokenCollectiveSdk.account.tokenRefV0.fetch(tokenRef);
var tokenBondingAcct = await tokenBondingSdk.account.tokenBondingV0.fetch(tokenBonding);
var curve = await tokenBondingSdk.account.curveV0.fetch(tokenBondingAcct.curve);
```

## Buying a Social Token

To buy a social token, first we should buy into the collective of which that social token is a member. Let's buy 10 Open Collective tokens:

```jsx async name=buy deps=fetch
await tokenBondingSdk.buy({
  tokenBonding: SplTokenCollective.OPEN_COLLECTIVE_BONDING_ID,
  desiredTargetAmount: 10,
  slippage: 0.05
});
var openBalance = await getAssociatedAccountBalance(connection, publicKey, tokenBondingAcct.baseMint);
```

Now, we can buy the social token using our 10 OPEN tokens:

```jsx async name=buy_target deps=fetch
await tokenBondingSdk.buy({
  tokenBonding,
  baseAmount: 10,
  slippage: 0.05
});
var testBalance = await getAssociatedAccountBalance(connection, publicKey, tokenBondingAcct.targetMint);
```

We can also sell those tokens

```jsx async name=sell_target deps=fetch
await tokenBondingSdk.sell({
  tokenBonding,
  targetAmount: 5,
  slippage: 0.05
});
var testBalance = await getAssociatedAccountBalance(connection, publicKey, tokenBondingAcct.targetMint);
```

## Next Steps

Interested in Learning More? Continue on with the rest of the tutorial take a deeper dive with more examples!