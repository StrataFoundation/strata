---
sidebar_position: 2
---

# Collectives

In [Bonding Curves](./bonding_curves) we discovered the ability to make a market around a token without a liquidity provider. We do this by bonding some `Base` token to a `Target` token.

An interesting result of this bonding is that the `Target` token has a price directly correlated with the `Base` token. When the `Base` token becomes worth more in absolute terms, so does the `Target`

Up until now, Social Tokens have been about the individual. Through a Social Token, content creators, artists, and projects can monetize and provide utility around their token.

*Enter Collectives*

:::info Collective
A Collective is a group of Social Tokens bound to the same `Base` token. This means that every Social Token owner is incentive aligned to increase not just the value of their token, but the value/utility of the Collective
:::

# Creation

Creating a collective is easy, at minimum you need to provide a mint. 

Most collectives themselves are bonded to SOL. Let's create a simple collective bonded to SOL.

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
    name: "My Collective",
    symbol: "tCOLL", 
    image: "https://ibb.co/sRpBwYh",
    // Because this is dev, we need to provide the metaplex dev upload file url
    uploadUrl: "https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFile2"
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

var tokenBondingAcct = await tokenBondingSdk.account.tokenBondingV0.fetch(tokenBonding);
var collectiveAcct = await tokenCollectiveSdk.account.collectiveV0.fetch(collective);
```

# Configuration

Collectives contain a rich set of configuration. To understand the configuration, first we must understand some concepts.

## Claimed vs Unclaimed Tokens

A token can exist in either a claimed or unclaimed state. This allows the collective to create tokens for people that have not yet joined the protocol, and allow them to later claim the token and its associated royalties.

### Claimed Tokens

A claimed token is associated with a wallet. It is, in effect, owned by a user. That user retains the ability to update their token within the rules of the Collective. This includes changing it's metadata and royalty percentages.

### Unclaimed Tokens

Unclaimed tokens are associated with an [spl-name-service](https://spl.solana.com/name-service) name. That name may or may not exist yet. A nonexistent name is just a [PDA](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses) that will eventually be filled in when the user owning the name creates this name. 

An example of this is Wum.bo Unclaimed Twitter Tokens. Every twitter handle hashes to a [PDA](https://docs.solana.com/developing/programming-model/calling-between-programs#program-derived-addresses) under a Wum.bo managed Twitter Top Level Domain (TLD). When claiming a token, a user authenticates via oAuth, and the Wum.bo TLD approves the creation of that name with that owner.

The owner of a created name can then issue a call to claim their token. The protocol will ensure that they are the owner of the name, then will migrate the unclaimed token and its royalties to the user.

## Open vs Closed Collectives

An Open collective allows anyone to join, so long as they follow the rules (configuration) of the collective. A Closed collective requires the authority of the collective to sign off on the creation of new social tokens.

### Closed Collective Management

A closed collective allows finer grained control over who may join the collective. This could either be manual, forcing the authority to run commands to create new tokens. This could also be automated via another program or a service that creates pre-signed transactions.

## Example

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
    image: "https://ibb.co/sRpBwYh",
    // Because this is dev, we need to provide the metaplex dev upload file url
    uploadUrl: "https://us-central1-principal-lane-200702.cloudfunctions.net/uploadFile2"
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

var tokenBondingAcct = await tokenBondingSdk.account.tokenBondingV0.fetch(tokenBonding);
var collectiveAcct = await tokenCollectiveSdk.account.collectiveV0.fetch(collective);
```