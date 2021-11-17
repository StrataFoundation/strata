import { Wallet } from "@site/src/contexts/Wallet";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  useSell,
  AccountProvider,
  StrataSdksProvider,
  useAssociatedAccount,
  useBondingPricing,
  usePublicKey,
  useTokenBonding,
} from "@strata-foundation/react";
import React from "react";
import styles from "./styles.module.css";

const TOKEN_BONDING = "B8kzSwXLfmZMeLzekExz2e8vefoU1UqgGnZ8NZRYkeou";

export const Claim = React.memo(() => {
  const tokenBondingKey = usePublicKey(TOKEN_BONDING);
  const { connected, publicKey } = useWallet();
  const { info: tokenBonding, loading } = useTokenBonding(tokenBondingKey);
  const { curve, loading: loadingPricing } = useBondingPricing(tokenBondingKey);
  const { associatedAccount: netBwumAccount, loading: assocAccountLoading } =
    useAssociatedAccount(publicKey, tokenBonding?.targetMint);
  const netTotal = netBwumAccount && netBwumAccount.amount / Math.pow(10, 9);
  const solTotal = curve?.sellTargetAmount(netTotal, 0, 0);
  const connectedNotLoading =
    !(loading || loadingPricing || assocAccountLoading) && connected;
  const [sell, { loading: exchanging, error }] = useSell();
  if (error) {
    console.error(error);
  }
  console.log(tokenBonding?.targetMint.toBase58());

  return (
    <div className={styles.container}>
      <h3>Net bWUM Exchange</h3>
      {!connected && (
        <WalletModalProvider>
          <WalletMultiButton />
        </WalletModalProvider>
      )}
      {(loadingPricing || loading || assocAccountLoading) && (
        <span>Loading...</span>
      )}
      {connectedNotLoading && !netTotal && (
        <span>
          No Net bWUM Found. Make sure you have the wallet that participated in
          the Wum.bo beta connected, then refresh this page.
        </span>
      )}
      {error && <span style={{ color: "red" }}>{error.toString()}</span>}
      {connectedNotLoading && netTotal && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p>
            Exchange {netTotal.toFixed(4)} Net bWUM for {solTotal.toFixed(4)}{" "}
            SOL
          </p>
          <button
            disabled={exchanging}
            onClick={() => {
              sell(tokenBondingKey, netTotal, 0.05);
            }}
            className="white button button--primary"
          >
            Exchange
          </button>
        </div>
      )}
    </div>
  );
});

export const ClaimBwum: React.FC = () => {
  return (
    <Wallet network={WalletAdapterNetwork.Mainnet}>
      <StrataSdksProvider>
        <AccountProvider>
          <Claim />
        </AccountProvider>
      </StrataSdksProvider>
    </Wallet>
  );
};
