import { PublicKey } from "@solana/web3.js";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useErrorHandler, useSwap, useTokenBonding } from "../../hooks";
import { Notification } from "../Notification";
import { PluggableSwap } from "./PluggableSwap";

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

    return (
      <PluggableSwap
        tradingMints={tradingMints}
        onTradingMintsChange={setTradingMints}
        loading={loading}
        swap={(args) =>
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
          })
        }
        onConnectWallet={() => {}}
        tokenBondingKey={tokenBondingKey}
      />
    );
  }
);
