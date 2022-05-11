import React, { FC, useMemo } from "react";
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
import { useEndpoint } from "@strata-foundation/marketplace-ui";
import { tokenAuthFetchMiddleware } from "@strata-foundation/web3-token-auth";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

export const getToken = (getTokenEndpoint: string, endpoint: string) => async () => {
  if (endpoint.includes("genesysgo")) {
    const req = await fetch(getTokenEndpoint);
    const { access_token }: { access_token: string } = await req.json();
    return access_token;
  }

  return ""
};

export const Wallet: FC = ({ children }) => {
  // You can also provide a custom RPC endpoint
  const { endpoint } = useEndpoint();

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SolletWalletAdapter({}),
      new SolletExtensionWalletAdapter({}),
    ],
    []
  );

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={{
        fetchMiddleware: tokenAuthFetchMiddleware({
          // @ts-ignore
          getToken: getToken(process.env.GET_TOKEN_ENDPOINT, endpoint),
        }),
        commitment: "confirmed"
      }}
    >
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
