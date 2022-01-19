import BrowserOnly from "@docusaurus/BrowserOnly";
import { useEndpoint } from "@site/src/contexts/Endpoint";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import {
  useBondingPricing,
  useOwnedAmount,
  usePublicKey,
  useTokenBonding,
  useSwap,
  Spinner,
} from "@strata-foundation/react";
import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";

// TODO: add the new netbWUM => OPEN here;
const TOKEN_BONDING = "";

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

const roundToDecimals = (num: number, decimals: number): number =>
  Math.trunc(num * Math.pow(10, decimals)) / Math.pow(10, decimals);

export const ClaimO = () => {
  const [success, setSuccess] = useState(false);
  const [internalError, setInternalError] = useState<Error>();
  const [claimableOPEN, setClaimableOPEN] = useState<number>();
  const { loading: swapping, error, execute: swap } = useSwap();
  const tokenBondingKey = usePublicKey(TOKEN_BONDING);
  const { connected, publicKey } = useWallet();
  const { info: tokenBonding, loading: loadingBonding } =
    useTokenBonding(tokenBondingKey);
  const { pricing, loading: loadingPricing } =
    useBondingPricing(tokenBondingKey);
  const ownedBase = useOwnedAmount(tokenBonding?.baseMint);

  useEffect(() => {
    if (ownedBase && ownedBase >= 0 && tokenBonding && pricing) {
      const claimable = pricing.swap(
        +ownedBase,
        tokenBonding.baseMint,
        tokenBonding.targetMint
      );

      setClaimableOPEN(ownedBase == 0 ? 0 : roundToDecimals(claimable, 9));
    }
  }, [tokenBonding, pricing, ownedBase, setClaimableOPEN]);

  const handleExchange = async () => {
    try {
      await swap({
        baseAmount: +ownedBase!,
        baseMint: tokenBonding!.baseMint,
        targetMint: tokenBonding!.targetMint,
        slippage: 0.05,
      });

      setSuccess(true);
    } catch (e) {
      setInternalError(e);
    }
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
      {connectedNotLoading && !success && !ownedBase && !claimableOPEN && (
        <span>
          No netbWUM Found. Make sure you have the wallet that participated in
          the Wum.bo beta connected, then refresh this page.
        </span>
      )}
      {error ||
        (internalError && (
          <span style={{ color: "red" }}>
            {(error || internalError).toString()}
          </span>
        ))}
      {success && <span>Successfully swapped netbWUM to OPEN!</span>}
      {connectedNotLoading && !success && ownedBase && claimableOPEN && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p>
            Exchange {ownedBase.toFixed(4)} netbWUM for{" "}
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
