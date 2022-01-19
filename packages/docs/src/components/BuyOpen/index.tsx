import React from "react";
import BrowserOnly from "@docusaurus/BrowserOnly";
import { useEndpoint } from "@site/src/contexts/Endpoint";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { Swap } from "@strata-foundation/react";
import { SplTokenCollective } from "@strata-foundation/spl-token-collective";
import styles from "./styles.module.css";

const MainnetGuard = ({ children = null as any }) => {
  const { endpoint, setEndpoint } = useEndpoint();

  if (endpoint.includes("devnet")) {
    return (
      <div className={styles.container}>
        <button
          onClick={() => {
            setEndpoint(clusterApiUrl(WalletAdapterNetwork.Mainnet));
          }}
          className="white button button--primary"
        >
          Switch to Mainnet
        </button>
      </div>
    );
  }

  return children;
};

export const Buy = () => {
  const tokenBondingKey = SplTokenCollective.OPEN_COLLECTIVE_BONDING_ID;
  const { connected, publicKey } = useWallet();

  return (
    <div className={styles.container}>
      {!connected && (
        <WalletModalProvider>
          <WalletMultiButton />
        </WalletModalProvider>
      )}
      {connected && <Swap tokenBondingKey={tokenBondingKey} />}
    </div>
  );
};

export const BuyOpen: React.FC = () => (
  <BrowserOnly fallback={<div>...</div>}>
    {() => (
      <MainnetGuard>
        <Buy />
      </MainnetGuard>
    )}
  </BrowserOnly>
);
