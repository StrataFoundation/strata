---
sidebar_position: 1
---

# React

The Strata SDK comes with a suite of useful ReactJS hooks.

## Setup

You'll want to set up [solana-wallet-adapter](https://github.com/solana-labs/wallet-adapter), the Strata SDK Provider, and the Strata AccountProvider (an intelligent caching layer on Solana's rpc).

You can also use one of our starter repos!

[Next.js Strata Starter](https://github.com/StrataFoundation/react-strata-nextjs-starter)

[Create React App Strata Starter](https://github.com/StrataFoundation/react-strata-starter)

First, setup Solana wallet adapters:

```jsx
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  LedgerWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  SolletExtensionWalletAdapter,
  SolletWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import React, { FC, useMemo } from "react";

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
```

Then, setup Strata:

```jsx
import { StrataProviders } from "@strata-foundation/react";
import { Wallet } from "./Wallet";

export const App: FC = ({ children }) => (
  <Wallet>
    <StrataProviders>{children}</StrataProviders>
  </Wallet>
);
```

# Displaying a Social Token

Let's create a simple social token for testing, then display it:

```jsx async name=create_social
var { ownerTokenRef, tokenBonding, targetMint } =
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

Now display it in React! We can use an advanced, pre-canned trade form:

```js
import { Swap, StrataProviders } from "@strata-foundation/react";
import ReactShadow from "react-shadow/emotion";
import { CSSReset } from "@chakra-ui/react";
```

```jsx live
function TokenDisplay() {
  const { targetMint } = useVariables(); // Getting token bonding from above code;

  if (tokenBonding) {
    // Shadow div and css reset are not required, but will make sure our styles do not conflict with yours
    return <ReactShadow.div>
      <StrataProviders resetCSS onError={e => console.error(e)}>
        <Swap id={targetMint} />
      </StrataProviders>
    </ReactShadow.div>
  }

  return <div>Please run the code block above</div>;
}
```

Or, we can render it ourselves using hooks:

```js
import {
  useBondedTokenPrice,
  useTokenMetadata,
  useTokenRef,
  useBondingPricing,
  useErrorHandler,
} from "@strata-foundation/react";
import { NATIVE_MINT } from "@solana/spl-token";
```

```jsx live
function TokenDisplay() {
  const { tokenBonding: tokenBondingKey } = useVariables(); // Getting tokenBonding from above

  const {
    pricing,
    tokenBonding,
    loading: loadingPricing,
    error,
  } = useBondingPricing(tokenBondingKey);
  const {
    image,
    metadata,
    loading: metaLoading,
  } = useTokenMetadata(tokenBonding && tokenBonding.targetMint);
  const { metadata: baseMetadata, loading: baseMetaLoading } = useTokenMetadata(
    tokenBonding && tokenBonding.baseMint
  );
  const baseSymbol = baseMetadata && baseMetadata.data.symbol;
  const solPrice = useBondedTokenPrice(
    tokenBonding && tokenBonding.targetMint,
    NATIVE_MINT
  );

  // Use strata error handler to show toast notifications
  const { handleErrors } = useErrorHandler();
  handleErrors(error);

  if (metaLoading || loadingPricing || baseMetaLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <img src={image} />
      {metadata && (
        <div>
          <div>
            <b>{metadata.data.name}</b>
          </div>
          <div>{metadata.data.symbol}</div>
        </div>
      )}
      {pricing && (
        <div>
          <div>
            Current Price: {pricing.current()} {baseSymbol}, or {solPrice} SOL
          </div>
          <div>
            Value Locked: {pricing.locked()} {baseSymbol}
          </div>
          <div>
            Price to buy 10: {pricing.buyTargetAmount(10)} {baseSymbol}
          </div>
        </div>
      )}
    </div>
  );
}
```

We can use the token metadata sdk to update the token symbol, name, and image:

```jsx async name=update deps=create_social
var ownerTokenRefAcct = await tokenCollectiveSdk.getTokenRef(ownerTokenRef);

await tokenMetadataSdk.updateMetadata({
  metadata: ownerTokenRefAcct.tokenMetadata,
  data: new DataV2({
    name: "Learned Strata Token",
    symbol: "learnStrat",
    uri: "https://strataprotocol.com/learnSTRAT.json",
    sellerFeeBasisPoint: 0,
    creators: null,
    uses: null,
    collection: null,
  }),
});
```
