import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-ledger";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { GlowWalletAdapter } from "@solana/wallet-adapter-glow";
import { ExodusWalletAdapter } from "@solana/wallet-adapter-exodus";
import React, { useMemo } from "react";
import { SOLANA_URL } from "../constants";
import { useEndpoint } from "@strata-foundation/react";

export const DEFAULT_ENDPOINT = SOLANA_URL;

const config: any = {
  commitment: "confirmed",
};

export const Wallet = ({
  children,
  cluster,
}: {
  children: React.ReactNode;
  cluster?: string;
}) => {
  const { endpoint, cluster: clusterFromUseEndpoint } = useEndpoint();

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      // @ts-ignore
      new SolflareWalletAdapter({ network: cluster }),
      new GlowWalletAdapter(),
      new LedgerWalletAdapter(),
      new ExodusWalletAdapter(),
    ],
    [clusterFromUseEndpoint]
  );

  return (
    <ConnectionProvider
      endpoint={cluster || endpoint}
      config={config}
    >
      <WalletProvider wallets={wallets} autoConnect>
        {/* @ts-ignore */}
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
