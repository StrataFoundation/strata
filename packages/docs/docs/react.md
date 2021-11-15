---
sidebar_position: 1
---

# React

The Strata SDK comes with a suite of useful ReactJS hooks.

## Setup

You'll want to set up [solana-wallet-adapter](https://github.com/solana-labs/wallet-adapter), the Strata SDK Provider, and the Strata AccountProvider (an intelligent caching layer on Solana's rpc).

You can also use our [create-react-app Strata Starter Repo](https://github.com/StrataFoundation/react-strata-starter)

```jsx
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider, WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import {
  getLedgerWallet,
  getPhantomWallet,
  getSlopeWallet,
  getSolflareWallet,
  getSolletExtensionWallet,
  getSolletWallet
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { AccountProvider, StrataSdksProvider, useBondingPricing, useStrataSdks, useTokenBonding, useTokenMetadata, useTokenRef } from "@strata-foundation/react";
import React, { useMemo } from "react";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

export const Wallet: FC = ({ children }) => {
  // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking --
  // Only the wallets you configure here will be compiled into your application
  const wallets = useMemo(
    () => [
      getPhantomWallet(),
      getSlopeWallet(),
      getSolflareWallet(),
      getLedgerWallet(),
      getSolletWallet({ network }),
      getSolletExtensionWallet({ network }),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default ({ children }) => (
  <>
    <Wallet>
      <StrataSdksProvider>
        <AccountProvider>
          {children}
        </AccountProvider>
      </StrataSdksProvider>
    </Wallet>
  </>
);
```

# Displaying a Social Token 

Let's create a simple social token for testing, then display it:

```jsx async name=create_social
var { tokenRef, tokenBonding } = await tokenCollectiveSdk.createSocialToken({
  ignoreIfExists: true, // If a Social Token already exists for this wallet, ignore.
  metadata: {
    name: "My Test Token",
    symbol: "TEST",
    image: "https://i.ibb.co/zxWkRv1/doge.jpg",
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

```js
 import { useTokenMetadata, useTokenRef, useBondingPricing } from "@strata-foundation/react";
```
```jsx live

 function TokenDisplay() {
   const { tokenRef: tokenRefKey, tokenBonding: tokenBondingKey  } = useVariables(); // Getting tokenBonding from above
   const { info: tokenRef, loading } = useTokenRef(tokenRefKey);
   const { info: tokenBonding, loading: loadingTokenBonding } = useTokenBonding(tokenBondingKey);
   const { image, metadata, loading: metaLoading } = useTokenMetadata(tokenRef && tokenRef.mint);
   const { curve, loading: loadingPricing } = useBondingPricing(tokenBondingKey);
   if (loading || metaLoading || loadingPricing || loadingTokenBonding) {
     return <div>Loading...</div>
   }

   return <div>
    <img src={image} />
    { metadata && <div>
      <div><b>{metadata.data.name}</b></div>
      <div>{metadata.data.symbol}</div>
    </div> }
    { curve && <div>
      <div>
        Current Price: { curve.current() }
      </div>
      <div>
        Value Locked: { curve.locked() }
      </div>
      <div>
        Price to buy 10: { curve.buyTargetAmount(10, tokenBonding.buyBaseRoyaltyPercentage, tokenBonding.buyTargetRoyaltyPercentage) }
      </div>
    </div> }
   </div>
 }
```
