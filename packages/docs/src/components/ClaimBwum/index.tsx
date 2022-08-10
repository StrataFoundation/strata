//@ts-ignore
import BrowserOnly from "@docusaurus/BrowserOnly";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  useAssociatedAccount,
  useBondingPricing,
  useErrorHandler,
  useMint,
  usePublicKey,
  useSwap,
  useTokenBonding,
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import React from "react";
import { useEndpoint } from "@strata-foundation/react";
//@ts-ignore
import styles from "./styles.module.css";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

const TOKEN_BONDING = "B8kzSwXLfmZMeLzekExz2e8vefoU1UqgGnZ8NZRYkeou";

const MainnetGuard = ({ children = null as any }) => {
  const { endpoint, setClusterOrEndpoint } = useEndpoint();

  if (endpoint.includes("devnet")) {
    return (
      <div className={styles.container}>
        <h3>Net bWUM Exchange</h3>
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

export const Claim = React.memo(() => {
  const tokenBondingKey = usePublicKey(TOKEN_BONDING);
  const { connected, publicKey } = useWallet();
  const { info: tokenBonding, loading } = useTokenBonding(tokenBondingKey);
  const { pricing, loading: loadingPricing } =
    useBondingPricing(tokenBondingKey);
  const { associatedAccount: netBwumAccount, loading: assocAccountLoading } =
    useAssociatedAccount(publicKey, tokenBonding?.targetMint);
  const targetMint = useMint(tokenBonding?.targetMint);
  const netTotal =
    netBwumAccount &&
    targetMint &&
    toNumber(netBwumAccount.amount, targetMint) / Math.pow(10, 9);
  const solTotal = netTotal && pricing?.sellTargetAmount(netTotal);
  const connectedNotLoading =
    !(loading || loadingPricing || assocAccountLoading) && connected;

  const { execute, loading: executing, error } = useSwap();
  const { handleErrors } = useErrorHandler();
  handleErrors(error);

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
      {connectedNotLoading && !netTotal && !solTotal && (
        <span>
          No Net bWUM Found. Make sure you have the wallet that participated in
          the Wum.bo beta connected, then refresh this page.
        </span>
      )}
      {error && <span style={{ color: "red" }}>{error.toString()}</span>}
      {connectedNotLoading && netTotal && solTotal && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p>
            Exchange {netTotal.toFixed(4)} Net bWUM for {solTotal.toFixed(4)}{" "}
            SOL
          </p>
          <button
            disabled={executing}
            onClick={() => {
              if (tokenBonding) {
                execute({
                  baseMint: tokenBonding.targetMint,
                  targetMint: tokenBonding.baseMint,
                  baseAmount: netTotal,
                  slippage: 0.05,
                });
              }
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
    <BrowserOnly fallback={<div>...</div>}>
      {() => (
        <MainnetGuard>
          <Claim />
        </MainnetGuard>
      )}
    </BrowserOnly>
  );
};
