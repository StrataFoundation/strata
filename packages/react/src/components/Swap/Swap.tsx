import { PublicKey } from "@solana/web3.js";
import { useSwapDriver } from "../../hooks/useSwapDriver";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useErrorHandler, useSwap, useTokenBonding } from "../../hooks";
import { Notification } from "../Notification";
import { SwapForm } from "./SwapForm";

const identity = () => {};
export const Swap = React.memo(
  ({ tokenBondingKey }: { tokenBondingKey: PublicKey }) => {
    const { loading, error, execute } = useSwap();
    const { handleErrors } = useErrorHandler();
    handleErrors(error);
    const { info: tokenBonding } = useTokenBonding(tokenBondingKey);
    const [tradingMints, setTradingMints] = useState<{
      base?: PublicKey;
      target?: PublicKey;
    }>({
      base: tokenBonding?.baseMint,
      target: tokenBonding?.targetMint,
    });
    React.useEffect(() => {
      if ((!tradingMints.base || !tradingMints.target) && tokenBonding) {
        setTradingMints({
          base: tokenBonding.baseMint,
          target: tokenBonding.targetMint,
        });
      }
    }, [tokenBonding, tradingMints]);

    const swapProps = useSwapDriver({
      tradingMints: tradingMints,
      onTradingMintsChange: setTradingMints,
      swap: (args) =>
        execute(args).then(({ targetAmount }) => {
          toast.custom((t) => (
            <Notification
              show={t.visible}
              type="success"
              heading="Transaction Succesful"
              message={`Succesfully purchased ${Number(targetAmount).toFixed(
                9
              )} ${args.ticker}!`}
              onDismiss={() => toast.dismiss(t.id)}
            />
          ));
        }),
      onConnectWallet: identity,
      tokenBondingKey: tokenBondingKey,
    });

    return <SwapForm isSubmitting={loading} {...swapProps} />;
  }
);
