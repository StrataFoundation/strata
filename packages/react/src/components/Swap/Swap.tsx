import { PublicKey } from "@solana/web3.js";
import { ISwapArgs } from "@strata-foundation/spl-token-bonding";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { useSwap } from "../../hooks/useSwap";
import { useTokenSwapFromId } from "../../hooks/useTokenSwapFromId";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useSwapDriver } from "../../hooks/useSwapDriver";
import { Notification } from "../Notification";
import { MemodSwapForm } from "./SwapForm";


const identity = () => {};
export const Swap = ({
  id,
  onConnectWallet,
  onSuccess = (values) => {
    toast.custom((t) => (
      <Notification
        show={t.visible}
        type="success"
        heading="Transaction Successful"
        message={`Succesfully purchased ${Number(values.targetAmount).toFixed(
          9
        )}!`}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ));
  },
}: {
  id: PublicKey;
  onConnectWallet?: () => void;
  onSuccess?: (values: ISwapArgs & { targetAmount: number }) => void;
}) => {
  const { loading, error, execute } = useSwap();
  const { handleErrors } = useErrorHandler();
  handleErrors(error);

  const { tokenBonding, numRemaining, childEntangler, parentEntangler } =
    useTokenSwapFromId(id);

  const [tradingMints, setTradingMints] = useState<{
    base?: PublicKey;
    target?: PublicKey;
  }>({
    base: tokenBonding?.baseMint,
    target:
      parentEntangler && childEntangler
        ? parentEntangler.parentMint
        : tokenBonding?.targetMint,
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
        ...args,
      })
        .then((values) => {
          onSuccess({...args, ...values });
        })
        .catch(console.error),
    id,
  });

  return (
    <MemodSwapForm isLoading={driverLoading} isSubmitting={loading} {...swapProps} />
  );
};

export const MemodSwap = React.memo(Swap);