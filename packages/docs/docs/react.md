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
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { Data } from "@strata-foundation/spl-utils";
import { clusterApiUrl } from "@solana/web3.js";
import { ThemeProvider, AccountProvider, StrataSdksProvider, useBondingPricing, useStrataSdks, useTokenBonding, useTokenMetadata, useTokenRef, ErrorHandlerProvider } from "@strata-foundation/react";
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
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({ network }),
      new SolletExtensionWalletAdapter({ network }),
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
  <ThemeProvider>
    <ErrorHandlerProvider>
      <Wallet>
        <StrataSdksProvider>
          <AccountProvider>
            {children}
          </AccountProvider>
        </StrataSdksProvider>
      </Wallet>
    </ErrorHandlerProvider>
  </ThemeProvider>
);
```

# Displaying a Social Token 

Let's create a simple social token for testing, then display it:

```jsx async name=create_social
var { ownerTokenRef, tokenBonding } = await tokenCollectiveSdk.createSocialToken({
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
    sellTargetRoyaltyPercentage: 0
  }
});
```

Now display it in React! We can use an advanced, pre-canned trade form:

```js
 import { Swap } from "@strata-foundation/react";
```

```jsx live
 function TokenDisplay() {
   const { tokenBonding } = useVariables(); // Getting token bonding from above code;
   
   if (tokenBonding) {
      return <Swap tokenBondingKey={tokenBonding} />
   }

   return <div>Please run the code block above</div>
 }
```

Or, we can render it ourselves using hooks:

```js
 import { useTokenMetadata, useTokenRef, useBondingPricing } from "@strata-foundation/react";
```
```jsx live

 function TokenDisplay() {
   const { ownerTokenRef: ownerTokenRefKey, tokenBonding: tokenBondingKey  } = useVariables(); // Getting tokenBonding from above
   const { info: ownerTokenRef, loading } = useTokenRef(ownerTokenRefKey);
   const { info: tokenBonding, loading: loadingTokenBonding } = useTokenBonding(tokenBondingKey);
   const { image, metadata, loading: metaLoading } = useTokenMetadata(ownerTokenRef && ownerTokenRef.mint);
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

We can use the token metadata sdk to update the token symbol, name, and image:

```jsx async name=update deps=create_social
var ownerTokenRefAcct = await tokenCollectiveSdk.getTokenRef(ownerTokenRef);

await tokenMetadataSdk.updateMetadata({
  metadata: ownerTokenRefAcct.tokenMetadata,
  data: new Data({
    name: "Learned Strata Token",
    symbol: "learnStrat",
    uri: "https://strataprotocol.com/learnSTRAT.json",
    sellerFeeBasisPoint: 0,
    creators: null
  })
})
```
