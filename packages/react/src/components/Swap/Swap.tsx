import { PublicKey } from "@solana/web3.js";
import { useSwapDriver } from "../../hooks/useSwapDriver";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useErrorHandler, useSwap, useStrataSdks, useTokenSwapFromId, useMint } from "../../hooks";
import { Notification } from "../Notification";
import { SwapForm } from "./SwapForm";
import { BN, Instruction } from "@project-serum/anchor";
import { toNumber, IExtraInstructionArgs, IPostInstructionArgs } from "@strata-foundation/spl-token-bonding";
import { InstructionResult } from "@strata-foundation/spl-utils";

const identity = () => {};
export const Swap = ({ id }: { id: PublicKey }) => {
  const { fungibleEntanglerSdk } = useStrataSdks()

  const { loading, error, execute } = useSwap();
  const { handleErrors } = useErrorHandler();
  handleErrors(error);

  const { 
    tokenBonding, 
    numRemaining, 
    childEntangler, 
    parentEntangler,
  } = useTokenSwapFromId(id);

  const childMint = useMint(childEntangler?.childMint);

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
    onTradingMintsChange: setTradingMints,
    swap: (args) =>
      execute({
        async extraInstructions({isFirst, amount, isBuy}: IExtraInstructionArgs): Promise<InstructionResult<null>> {
          if (!isFirst || !childEntangler || !parentEntangler || isBuy) {
            return {
              instructions: [],
              signers: [],
              output: null,
            }
          }

          let numAmount = toNumber(amount!, childMint)
          const instr = await fungibleEntanglerSdk?.swapParentForChildInstructions({
            parentEntangler: parentEntangler.publicKey,
            childEntangler: childEntangler.publicKey,
            amount: numAmount,
          })
          return instr ? instr : {
            instructions: [],
            signers: [],
            output: null,
          }
        },
        async postInstructions({isLast, amount, isBuy}: IPostInstructionArgs): Promise<InstructionResult<null>> {
          if (!isLast || !childEntangler || !parentEntangler || !isBuy) {
            return {
              instructions: [],
              signers: [],
              output: null,
            }
          }
          const numAmount = toNumber(amount!, childMint)
          const instr = await fungibleEntanglerSdk?.swapChildForParentInstructions({
              parentEntangler: parentEntangler.publicKey,
              childEntangler: childEntangler.publicKey,
              amount: numAmount,
            })
          return instr ? instr : {
            instructions: [],
            signers: [],
            output: null,
          }
        },
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
    onConnectWallet: identity,
    id,
  });

  return (
    <SwapForm isLoading={driverLoading} isSubmitting={loading} {...swapProps} />
  );
};
