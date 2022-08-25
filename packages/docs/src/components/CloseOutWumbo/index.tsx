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
  useCollective,
  useErrorHandler,
  useMint,
  usePublicKey,
  useSwap,
  useTokenBonding,
  useTokenBondingFromMint,
  useUserTokensWithMeta,
} from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { useEndpoint } from "@strata-foundation/react";
//@ts-ignore
import styles from "./styles.module.css";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ITokenWithMetaAndAccount } from "@strata-foundation/spl-token-collective";
import { token } from "@project-serum/anchor/dist/esm/utils";

const OPEN_COLLECTIVE = "3cYa5WvT2bgXSLxxu9XDJSHV3x5JZGM91Nc3B7jYhBL7";
const OPEN_MINT = "openDKyuDPS6Ak1BuD3JtvkQGV3tzCxjpHUfe1mdC79";
const OPEN_BONDING = "9Zse7YX2mPQFoyMuz2Gk2K8WcH83FY1BLfu34vN4sdHi";

const MainnetGuard = ({ children = null as any }) => {
  const { endpoint, setClusterOrEndpoint } = useEndpoint();

  if (endpoint.includes("devnet")) {
    return (
      <div className={styles.container}>
        <h3>Recoup SOL from Wumbo</h3>
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

interface ITokenHandlerProps {
  token: ITokenWithMetaAndAccount;
  incrementRedeemable: (arg0: number) => void;
}

export const TokenHandler = React.memo<ITokenHandlerProps>(
  ({ token, incrementRedeemable }) => {
    const tokenBondingKey = token.tokenBonding.publicKey;

    const { pricing, loading: loadingPricing } =
      useBondingPricing(tokenBondingKey);

    const solTotal = pricing?.sellTargetAmount(
      toNumber(token.account.amount, token.mint)
    );

    useEffect(() => {
      incrementRedeemable(solTotal);
    }, [solTotal, incrementRedeemable]);

    return (
      <div>
        {token.metadata.data.name} {solTotal}
      </div>
    );
  }
);

interface IRecoupState {
  isRedeaming: boolean;
  amounts: number[];
}

export const Recoup = () => {
  const [amounts, setAmounts] = useState([]);

  const incrementRedeemable = useCallback((amount: number) => {
    if (amount) {
      setAmounts((old) => [...old, amount]);
    }
  }, []);

  const { connected, publicKey } = useWallet();
  const { handleErrors } = useErrorHandler();
  const openCollectiveKey = usePublicKey(OPEN_COLLECTIVE);
  const { info: openCollective } = useCollective(openCollectiveKey);
  const {
    data: tokens,
    loading,
    error,
  } = useUserTokensWithMeta(publicKey || undefined);

  const open = useMemo(
    () =>
      tokens.find(({ account }) => account.mint.equals(openCollective.mint)),
    [tokens]
  );

  const openCollectiveTokens = useMemo(
    () =>
      tokens.filter(
        (token) =>
          !!token.tokenRef &&
          token.tokenRef.collective.equals(openCollectiveKey) &&
          toNumber(token.account.amount, token.mint) > 0
      ),
    [tokens]
  );

  const { execute, loading: executing, error: error2 } = useSwap();

  handleErrors(error);

  const connectedNotLoading = !loading && connected;
  const hasOpenAmount = open && toNumber(open.account.amount, open.mint) > 0;

  return (
    <div className={styles.container}>
      <h3>Recoup SOL from Wumbo</h3>
      {!connected && (
        <WalletModalProvider>
          <WalletMultiButton />
        </WalletModalProvider>
      )}
      {loading && <span>Loading...</span>}
      {connectedNotLoading && !(open || openCollectiveTokens.length) && (
        <span>
          No tokens relating to Wumbo/OPEN found. Make sure you have the wallet
          that you used with Wumbo/OPEN, then refresh this page.
        </span>
      )}
      {error && <span style={{ color: "red" }}>{error.toString()}</span>}
      {connectedNotLoading && (
        <>
          {hasOpenAmount && (
            <TokenHandler
              token={open}
              incrementRedeemable={incrementRedeemable}
            />
          )}
          {openCollectiveTokens.map((token) => (
            <TokenHandler
              key={token.publicKey.toBase58()}
              token={token}
              incrementRedeemable={incrementRedeemable}
            />
          ))}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <p>
              {amounts.reduce((acc, amount) => acc + amount, 0)} SOL Redeemable
            </p>
            <button disabled={false} className="white button button--primary">
              Redeem SOL
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const CloseOutWumbo: React.FC = () => (
  <BrowserOnly fallback={<div>...</div>}>
    {() => (
      <MainnetGuard>
        <Recoup />
      </MainnetGuard>
    )}
  </BrowserOnly>
);
