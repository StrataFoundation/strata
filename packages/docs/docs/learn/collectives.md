---
sidebar_position: 2
---

# Collectives

In [Bonding Curves](./bonding_curves) we discovered the ability to make a market around a token without a liquidity provider. We do this by bonding some `Base` token to a `Target` token.

An interesting result of this bonding is that the `Target` token has a price directly correlated with the `Base` token. When the `Base` token becomes worth more in absolute terms, so does the `Target`

Up until now, Social Tokens have been about the individual. Through a Social Token, content creators, artists, and projects can monetize and provide utility around their token.

*Enter Collectives*

:::info Collective
A Collective is a group of Social Tokens bound to the same `Base` token. A Collective acts as a network of Social Tokens facilitating group cooperation. This allows holders of Social Tokens to pool their resources and align their direction success with the `Base` token.
:::

## Creation

Creating a collective is easy, at minimum you need to provide a mint. 

Most collectives themselves are bonded to SOL. Let's create a simple collective bonded to SOL.

```js async name=create
// Create a simple exponential curve 0.001 sqrt(S)
var curve = await tokenBondingSdk.initializeCurve({
    config: new ExponentialCurveConfig({
    c: 0.001,
    b: 0,
    pow: 1,
    frac: 2
  })
});

// Create a collective around the Target of the above token bonding
var { collective, tokenBonding } = await tokenCollectiveSdk.createCollective({
  metadata: {
    name: "My Collective",
    symbol: "tCOLL",
    uri: "https://strataprotocol.com/tCOLL.json",
  },
  bonding: {
    curve,
    baseMint: new PublicKey("So11111111111111111111111111111111111111112"),
    targetMintDecimals: 2,
    buyBaseRoyaltyPercentage: 5,
    buyTargetRoyaltyPercentage: 5,
    sellBaseRoyaltyPercentage: 0,
    sellTargetRoyaltyPercentage: 0
  },
  authority: publicKey,
  config: {}
});
```

We can fetch that data:

```js async deps=create
var tokenBondingAcct = await tokenBondingSdk.getTokenBonding(tokenBonding);
var collectiveAcct = await tokenCollectiveSdk.getCollective(collective);
```

## Configuration

Collectives contain a rich set of configuration. To understand the configuration, first we must understand some concepts.

### Claimed vs Unclaimed Tokens

A token can exist in either a claimed or unclaimed state. This allows the collective to create tokens for people that have not yet joined strata, and allow them to later claim the token and its associated royalties.

#### Claimed Tokens

A claimed token is associated with a wallet. It is, in effect, owned by a user. That user retains the ability to update their token within the rules of the Collective. This includes changing it's metadata and royalty percentages.

#### Unclaimed Tokens

Unclaimed tokens are associated with an [spl-name-service](https://spl.solana.com/name-service) name. That name may or may not exist yet. A nonexistent name is just a [PDA](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses) that will eventually be filled in when the user owning the name creates this name. 

An example of this is Wum.bo Unclaimed Twitter Tokens. Every twitter handle hashes to a [PDA](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses) under a Wum.bo managed Twitter Top Level Domain (TLD). When claiming a token, a user authenticates via oAuth, and the Wum.bo TLD approves the creation of that name with that owner.

The owner of a created name can then issue a call to claim their token. The protocol will ensure that they are the owner of the name, then will migrate the unclaimed token and its royalties to the user.

### Open vs Closed Collectives

An Open collective allows anyone to join, so long as they follow the rules (configuration) of the collective. A Closed collective requires the authority of the collective to sign off on the creation of new social tokens.

#### Closed Collective Management

A closed collective allows finer grained control over who may join the collective. This could either be manual, forcing the authority to run commands to create new tokens. This could also be automated via another program or a service that creates pre-signed transactions.

### Example

Let's create a collective with a more fine-grained config:

```js async
// Create a simple exponential curve 0.001 sqrt(S)
var curve = await tokenBondingSdk.initializeCurve({
    config: new ExponentialCurveConfig({
    c: 0.001,
    b: 0,
    pow: 1,
    frac: 2
  })
});

// Create a collective around the Target of the above token bonding
var { collective, tokenBonding } = await tokenCollectiveSdk.createCollective({
  metadata: {
    name: "My Restrictive Collective",
    symbol: "tCOLL", 
    uri: "https://strataprotocol.com/tCOLL.json"
  },
  bonding: {
    curve,
    baseMint: new PublicKey("So11111111111111111111111111111111111111112"),
    targetMintDecimals: 2,
    buyBaseRoyaltyPercentage: 0,
    buyTargetRoyaltyPercentage: 0,
    sellBaseRoyaltyPercentage: 0,
    sellTargetRoyaltyPercentage: 0
  },
  authority: publicKey,
  config: {
    isOpen: true, // Anyone can join this collective
    unclaimedTokenBondingSettings: {
      curve: curve, // All unclaimed tokens must lay on this curve
      buyBaseRoyalties: {
        // This account is owned by the name service name, and will be transferred to the person who claims this token
        ownedByName: true, 
      },
      sellBaseRoyalties: {
        // This account is owned by the name service name, and will be transferred to the person who claims this token
        ownedByName: true,
      },
      buyTargetRoyalties: {
        // This account is owned by the name service name, and will be transferred to the person who claims this token
        ownedByName: true,
      },
      sellTargetRoyalties: {
        // This account is owned by the name service name, and will be transferred to the person who claims this token
        ownedByName: true,
      },
      minBuyBaseRoyaltyPercentage: 0,
      maxBuyBaseRoyaltyPercentage: 0,
      minSellBaseRoyaltyPercentage: 0,
      maxSellBaseRoyaltyPercentage: 0,
      // The only royalties allowed to be taken are a 5% target royalty
      minBuyTargetRoyaltyPercentage: 5,
      maxBuyTargetRoyaltyPercentage: 5,
      minSellTargetRoyaltyPercentage: 0,
      maxSellTargetRoyaltyPercentage: 0,
    },
    unclaimedTokenMetadataSettings: {
      symbol: "UNCLAIMED", // All unclaimed tokens will have symbol UNCLAIMED
      nameIsNameServiceName: true // The name of the token must match the name service name
    },
    // Much less restrictive on users that own their token
    claimedTokenBondingSettings: {
      maxSellBaseRoyaltyPercentage: 20, // Sell fees are capped at 20% to prevent rugging
      maxSellTargetRoyaltyPercentage: 20,
    }
  }
});
```

## Movement and Curve Changes (not yet implemented)

Social tokens are bound to a collective via the collective's base token. But what if you want to leave one collective for another? How can this happen in a way that is fair to both token holders and the token owner?

Let's take an example of a token `A` on `OPEN` collective with 1000 tokens and 100 `OPEN` tokens in the `Reserve`. The owner is switching to `COOL` collective, where they estimate `1 COOL = 2 OPEN`.

The process is as follows:

### Step 1. Initiating the Transition

The Token Owner opens an account with an equal worth of the new collective token to the reserves of their bonding curve. This means they open an account with 50 `COOL`.

### Step 2. Grace Period

The original curve is swapped with a fixed curve. This mean all holders can now exchange tokens at a rate of 

$$
\frac{\textrm{amount}}{\textrm{supply}} * \textrm{reserves} = \frac{1}{1000} * 100 = 0.1 \textrm{ OPEN per A}
$$

Note that this may be a lower price than the curve before the transition. This is the strictest "fair" distribution of what's in the reserves.

For 1 week, users can either 

  * Exit the bonding curve at 0.1 OPEN per A
  * Wait 1 week to have their token change basis to `COOL` under the new curve

### Step 3. Migration

The owner of the token is given control of the original reserve account, and the `COOL` reserve is put in its place. If it were true that `1 COOL = 2 OPEN` and nobody sold during the grace period, the owner of the token would receive `100 OPEN` which they could then sell to recoup the cost of the `COOL` tokens.

### Market Mechanics

There is no way to tell if 50 `COOL` is actually worth 100 `OPEN`, or if holders want to be part of the new collective. Throughout the grace period, a fair market value will be discovered. If `COOL` is not worth the amount proposed, users will exit during the grace period. The token owner will get less than `100 OPEN` even though they put in `50 COOL`. 


### Same Collective Curve Changes

A token owner may choose to initiate a transition within the same collective to change the shape of the curve. Maybe they would like to increase or decrease the slope, or change growth characteristics.

In this case, no collateral is required; however the grace period still functions the same. Users have the opportunity to exit the curve for a week for their fair share.

This prevents rugging by changing the curve shape. For example, a malicious token owner could change the curve to a steep exonential then sell all of their tokens.
