import BrowserOnly from "@docusaurus/BrowserOnly";
import { useEndpoint } from "@strata-foundation/marketplace-ui";
import { u64 } from "@solana/spl-token";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl, PublicKey } from "@solana/web3.js";
import {
  Spinner, useAssociatedAccount, useBondingPricing,
  useErrorHandler,
  useOwnedAmount,
  usePublicKey, useStrataSdks, useTokenBonding
} from "@strata-foundation/react";
import { SplTokenBonding } from "@strata-foundation/spl-token-bonding";
import React, { useEffect, useState } from "react";
import { useAsyncCallback } from "react-async-hook";
import styles from "./styles.module.css";

const TOKEN_BONDING = "BBZ6tFH5b6tWxWebUe7xyWLZ3PHVCLAdRArAEACuJKHe";

const MainnetGuard = ({ children = null as any }) => {
  const { endpoint, setClusterOrEndpoint } = useEndpoint();

  if (endpoint.includes("devnet")) {
    return (
      <div className={styles.container}>
        <button
          onClick={() => {
            setClusterOrEndpoint(WalletAdapterNetwork.Mainnet);
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

const roundToDecimals = (num: number, decimals: number): number =>
  Math.trunc(num * Math.pow(10, decimals)) / Math.pow(10, decimals);

async function exchange(tokenBondingSdk: SplTokenBonding, amount: u64): Promise<void> {
  await tokenBondingSdk.sell({
    tokenBonding: new PublicKey(TOKEN_BONDING),
    targetAmount: amount,
    slippage: 0.05
  })
}

export const ClaimO = () => {
  const [success, setSuccess] = useState(false);
  const [claimableOPEN, setClaimableOPEN] = useState<number>();
  const tokenBondingKey = usePublicKey(TOKEN_BONDING);
  const { connected, publicKey } = useWallet();
  const { info: tokenBonding, loading: loadingBonding } =
    useTokenBonding(tokenBondingKey);

  const { tokenBondingSdk } = useStrataSdks();

  const { execute: swap, loading: swapping, error } = useAsyncCallback(exchange)
  const { handleErrors } = useErrorHandler();
  handleErrors(error);

  const { pricing, loading: loadingPricing } =
    useBondingPricing(tokenBondingKey);
  const ownedTarget = useOwnedAmount(tokenBonding?.targetMint);
  const { associatedAccount } = useAssociatedAccount(publicKey, tokenBonding?.targetMint);

  useEffect(() => {
    if (ownedTarget && ownedTarget >= 0 && tokenBonding && pricing) {
      const claimable = pricing.swap(
        +ownedTarget,
        tokenBonding.targetMint,
        tokenBonding.baseMint,
      );

      setClaimableOPEN(ownedTarget == 0 ? 0 : roundToDecimals(claimable, 9));
    }
  }, [tokenBonding, pricing, ownedTarget, setClaimableOPEN]);

  const handleExchange = async () => {
    await swap(tokenBondingSdk!, associatedAccount!.amount);

    setSuccess(true);
  };

  const isLoading = loadingPricing || loadingBonding;
  const connectedNotLoading = connected && !isLoading;

  return (
    <div className={styles.container}>
      <h3>netbWUM to OPEN Exchange</h3>
      {!connected && (
        <WalletModalProvider>
          <WalletMultiButton />
        </WalletModalProvider>
      )}
      {isLoading && <Spinner />}
      {connectedNotLoading && !success && !ownedTarget && !claimableOPEN && (
        <span>
          No netbWUM Found. Make sure you have the wallet that participated in
          the Wum.bo beta connected, then refresh this page.
        </span>
      )}
      {success && <span>Successfully swapped netbWUM to OPEN!</span>}
      {connectedNotLoading && !success && ownedTarget && claimableOPEN && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p>
            Exchange {ownedTarget.toFixed(4)} netbWUM for{" "}
            {claimableOPEN.toFixed(4)} OPEN
          </p>
          <button
            disabled={swapping}
            onClick={handleExchange}
            className="white button button--primary"
          >
            Exchange
          </button>
        </div>
      )}
    </div>
  );
};

export const ClaimOpen: React.FC = () => {
  return (
    <BrowserOnly fallback={<div>...</div>}>
      {() => (
        <MainnetGuard>
          <ClaimO />
        </MainnetGuard>
      )}
    </BrowserOnly>
  );
};
