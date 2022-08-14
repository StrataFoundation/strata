import { PublicKey } from "@solana/web3.js";
import { useSwapDriver } from "../../hooks/useSwapDriver";
import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Notification } from "../Notification";
import { SwapForm } from "./SwapForm";
import { SplTokenBonding, toNumber } from "@strata-foundation/spl-token-bonding";
import { IManyToOneSwapDriverArgs, useManyToOneSwapDriver } from "../../hooks/useManyToOneSwapDriver";
import { useSwap } from "../../hooks/useSwap";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { useStrataSdks } from "../../hooks/useStrataSdks";
import { useTokenMetadata } from "../../hooks/useTokenMetadata";
import { useMint } from "../../hooks/useMint";
import { useCapInfo } from "../../hooks/useCapInfo";
import { roundToDecimals } from "@strata-foundation/spl-utils";

interface IManyToOneSwapProps
  extends Pick<
    IManyToOneSwapDriverArgs,
    "onConnectWallet" | "extraTransactionInfo" | "inputs"
  > {
  targetMint: PublicKey;
}
export const ManyToOneSwap = ({
  onConnectWallet,
  extraTransactionInfo,
  inputs,
  targetMint,
}: IManyToOneSwapProps) => {
  const { loading, error, execute } = useSwap();
  const { handleErrors } = useErrorHandler();
  const { tokenBondingSdk } = useStrataSdks();
  handleErrors(error);
  const { metadata: targetMintMeta } = useTokenMetadata(targetMint);
  const [baseMint, setBaseMint] = useState<PublicKey>(inputs[0]!.baseMint);
  const targetMintAcc = useMint(targetMint);
  const currBonding = useMemo(() => inputs.find(i => i.baseMint.equals(baseMint))?.tokenBonding, [inputs, baseMint])
  const { numRemaining } = useCapInfo(currBonding, true);

  const { loading: driverLoading, ...swapProps } = useManyToOneSwapDriver({
    onConnectWallet,
    extraTransactionInfo,
    inputs,
    baseMint,
    targetMint,
    onTradingMintsChange: ({ base }) => setBaseMint(base),
    swap: async (args) => {
      try {
        const amount = args.desiredTargetAmount || args.expectedOutputAmount;
        await execute({
          ...args,
          balanceCheckTries: 0,
        });
        toast.custom((t) => (
          <Notification
            show={t.visible}
            type="success"
            heading="Transaction Successful"
            message={`Succesfully purchased ${roundToDecimals(
              toNumber(amount!, targetMintAcc!),
              targetMintAcc ? targetMintAcc.decimals : 9
            )} ${targetMintMeta?.data.symbol}!`}
            onDismiss={() => toast.dismiss(t.id)}
          />
        ));
      } catch (e: any) {
        console.error(e);
      }
    },
  });

  return (
    <SwapForm
      isLoading={driverLoading}
      isSubmitting={loading}
      {...swapProps}
      numRemaining={numRemaining}
    />
  );
};
