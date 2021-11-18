import { PublicKey } from "@solana/web3.js";
import React from "react";
import { PluggableSwap } from "./PluggableSwap";
import { Notification } from "../Notification";
import toast from "react-hot-toast";
import { useTokenBondingFromMint, useTokenBonding } from "../../hooks";

export const Swap = React.memo(({ tokenBondingKey }: { tokenBondingKey: PublicKey }) => {
  const [action, setAction] = React.useState<"buy" | "sell">("buy");
  const [currentTokenBonding, setCurrentTokenBonding] = React.useState<PublicKey>(tokenBondingKey);
  const { info: tokenBonding } = useTokenBonding(tokenBondingKey);
  const { info: baseTokenBonding } = useTokenBondingFromMint(tokenBonding?.baseMint);
  function onBuyBase() {
    if (baseTokenBonding) {
      setCurrentTokenBonding(baseTokenBonding.publicKey)
    }
  }

  return <PluggableSwap
    onConnectWallet={() => {}}
    onBuyBase={onBuyBase}
    onFlipTokens={(bonding, action) => setAction(action)}
    tokenBondingKey={currentTokenBonding}
    action={action}
    onSuccess={({ ticker, mint, amount }) => {
      toast.custom((t) => (
        <Notification
          show={t.visible}
          type="success"
          heading="Transaction Succesful"
          message={`You now own ${Number(amount).toFixed(
            4
          )} of ${ticker}`}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ));
    }}
  />
})
