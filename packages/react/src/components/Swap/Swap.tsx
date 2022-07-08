import { PublicKey } from "@solana/web3.js";
import { useSwapDriver } from "../../hooks/useSwapDriver";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useErrorHandler, useSwap, useTokenSwapFromId, useMint } from "../../hooks";
import { Notification } from "../Notification";
import { SwapForm } from "./SwapForm";


const identity = () => {};
export const Swap = ({ id, onConnectWallet }: { 
  id: PublicKey;
  onConnectWallet?: () => void;
}) => {

  const { loading, error, execute } = useSwap();
  const { handleErrors } = useErrorHandler();
  handleErrors(error);

  const { 
    tokenBonding, 
    numRemaining, 
    childEntangler, 
    parentEntangler,
  } = useTokenSwapFromId(id);

  const [tradingMints, setTradingMints] = useState<{
    base?: PublicKey;
    target?: PublicKey;
  }>({
    base: tokenBonding?.baseMint,
    target: (parentEntangler && childEntangler) ? parentEntangler.parentMint : tokenBonding?.targetMint,
  });

  React.useEffect(() => {
    if ((!tradingMints.base || !tradingMints.target) && tokenBonding) {
      if (childEntangler && parentEntangler) {
        setTradingMints({
          base: tokenBonding.baseMint,
          target: parentEntangler.parentMint,
        });
        return;
      }
      setTradingMints({
        base: tokenBonding.baseMint,
        target: tokenBonding.targetMint,
      });
    }
  }, [tokenBonding, tradingMints]);

  const { loading: driverLoading, ...swapProps } = useSwapDriver({
    tradingMints,
    onConnectWallet: onConnectWallet || identity,
    onTradingMintsChange: setTradingMints,
    swap: (args) =>
      execute({
        entangled: parentEntangler?.parentMint,
        ...args
      }).then(({ targetAmount }) => {
        toast.custom((t) => (
          <Notification
            show={t.visible}
            type="success"
            heading="Transaction Successful"
            message={`Succesfully purchased ${Number(targetAmount).toFixed(
              9
            )} ${args.ticker}!`}
            onDismiss={() => toast.dismiss(t.id)}
          />
        ));
      }).catch(console.error),
    id,
  });

  return (
    <SwapForm isLoading={driverLoading} isSubmitting={loading} {...swapProps} />
  );
};
