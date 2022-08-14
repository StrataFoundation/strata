---
sidebar_position: 1
slug: /
---

# Getting Started

The Strata Protocol lets you effortlessly create and price tokens and token collectives on Solana!

Looking to launch a token? Check out our launchpad at [app.strataprotocol.com](https://app.strataprotocol.com). The documentation behind the launchpad can be found under the "Launchpad" section of these docs.

Looking to learn more about chat? [Chat Docs](./im/getting_started)

Looking to learn more about tokens, systems of tokens, and bonding curves? Read on.

## Initializing the SDK

Every smart contract on Strata comes with an SDK. The two main smart contracts are `spl-token-collective` and `spl-token-bonding`.

Let's get started by installing the sdks

```bash
yarn add @strata-foundation/spl-token-collective @strata-foundation/spl-token-bonding
```

Now, we can initialize the sdks:

```jsx
import { PublicKey } from "@solana/web3.js"
import * as anchor from "@project-serum/anchor";
import { BN } from "bn.js";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import { getAssociatedAccountBalance, SplTokenMetadata } from "@strata-foundation/spl-utils";

const provider = anchor.getProvider();

const tokenCollectiveSdk = await SplTokenCollective.init(provider);
const tokenBondingSdk = await SplTokenBonding.init(provider);
const tokenMetadataSdk = await SplTokenMetadata.init(provider);
```

## Creating a Social Token

:::info Live Code
You can run and edit all of the code blocks in this tutorial against Solana devnet! The above block contains all of the needed imports.

Use `var` instead of `let` or `const` so that these blocks can be re-run
:::

Let's create a Social Token named TEST within the Open Collective that gives us 10% of every TEST token minted in royalties.

```jsx async name=create_social
var { ownerTokenRef, tokenBonding } =
  await tokenCollectiveSdk.createSocialToken({
    ignoreIfExists: true, // If a Social Token already exists for this wallet, ignore.
    metadata: {
      name: "Learning Strata Token",
      symbol: "luvSTRAT",
      uri: "https://strataprotocol.com/luvSTRAT.json",
    },
    tokenBondingParams: {
      buyBaseRoyaltyPercentage: 0,
      buyTargetRoyaltyPercentage: 10,
      sellBaseRoyaltyPercentage: 0,
      sellTargetRoyaltyPercentage: 0,
    },
  });
```

We can fetch the accounts we just created

```jsx async name=fetch deps=create_social
var ownerTokenRefAcct = await tokenCollectiveSdk.getTokenRef(ownerTokenRef);
var tokenBondingAcct = await tokenBondingSdk.getTokenBonding(tokenBonding);
var curve = await tokenBondingSdk.getCurve(tokenBondingAcct.curve);
```

## Buying a Social Token

To buy a social token, first we should buy into the collective of which that social token is a member. Let's buy 10 Open Collective tokens:

```jsx async name=buy deps=fetch
await tokenBondingSdk.buy({
  tokenBonding: SplTokenCollective.OPEN_COLLECTIVE_BONDING_ID,
  desiredTargetAmount: 10,
  slippage: 0.05,
});
var openBalance = await getAssociatedAccountBalance(
  connection,
  publicKey,
  tokenBondingAcct.baseMint
);
```

Now, we can buy the social token using our 10 OPEN tokens:

```jsx async name=buy_target deps=fetch
await tokenBondingSdk.buy({
  tokenBonding,
  baseAmount: 10,
  slippage: 0.05,
});
```

Now we can check the balance:

```jsx async name=buy_target deps=fetch
var testBalance = await getAssociatedAccountBalance(
  connection,
  publicKey,
  tokenBondingAcct.targetMint
);
```

We can also do the last two steps all at once:

```jsx async name=buy_all deps=fetch
var { targetAmount } = await tokenBondingSdk.swap({
  baseMint: NATIVE_MINT,
  targetMint: tokenBondingAcct.targetMint,
  baseAmount: 0.01,
  slippage: 0.05,
});
```

Now check the balance:

```jsx async name=balance deps=fetch
var testBalance = await getAssociatedAccountBalance(
  connection,
  publicKey,
  tokenBondingAcct.targetMint
);
```

We can also sell those tokens

```jsx async name=sell_target deps=fetch
await tokenBondingSdk.sell({
  tokenBonding,
  targetAmount: 5,
  slippage: 0.05,
});
```

Now check the balance:

```jsx async name=balance deps=fetch
var testBalance = await getAssociatedAccountBalance(
  connection,
  publicKey,
  tokenBondingAcct.targetMint
);
```

## Next Steps

Interested in using Strata with React? Checkout our [React Examples](./react).

To gain a deeper understanding of the API through examples, check out the Learn pages on

- [Bonding Curves](./learn/bonding_curves)
- [Collectives](./learn/collectives)
- [Social Tokens](./learn/social_tokens)
