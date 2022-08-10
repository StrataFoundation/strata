import React, { FC, useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-ledger";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { GlowWalletAdapter } from "@solana/wallet-adapter-glow";
import { ExodusWalletAdapter } from "@solana/wallet-adapter-exodus";
import { useEndpoint } from "@strata-foundation/react";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

const config: any = {
  commitment: "confirmed",
};

//@ts-ignore
export const Wallet: FC = ({ children }) => {
  // You can also provide a custom RPC endpoint
  const { endpoint, cluster } = useEndpoint();

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
    [cluster]
  );

  return (
    <ConnectionProvider
      endpoint={endpoint}
      config={config}
    >
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};
