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
import { tokenAuthFetchMiddleware } from "@strata-foundation/web3-token-auth";
import React, { useMemo } from "react";
import { SOLANA_URL } from "../constants";
import { useEndpoint } from "../hooks";

export const DEFAULT_ENDPOINT = SOLANA_URL;

export const getToken = async () => {
  const req = await fetch("/api/get-token");
  const { access_token }: { access_token: string } = await req.json();
  return access_token;
};

export const Wallet = ({
  children,
  cluster,
}: {
  children: React.ReactNode;
  cluster?: string;
}) => {
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
      endpoint={cluster || endpoint}
      config={{
        commitment: "confirmed",
        fetchMiddleware: tokenAuthFetchMiddleware({
          getToken,
        }),
      }}
    >
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
