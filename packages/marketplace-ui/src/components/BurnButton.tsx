import React from "react";
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useProvider, useAssociatedAccount } from "@strata-foundation/react";
import { AsyncButton } from "./AsyncButton";

export const BurnButton = ({ mintKey }: { mintKey: PublicKey }) => {
  const { provider } = useProvider();
  const { publicKey } = useWallet();
  const { associatedAccount: account, associatedAccountKey } =
    useAssociatedAccount(publicKey, mintKey);
  const hasTokens = account && account.amount.toNumber() > 0;

  return (
    <AsyncButton
      isDisabled={!hasTokens}
      colorScheme="red"
      action={async () => {
        if (account && publicKey && provider && associatedAccountKey) {
          const tx = new Transaction();
          tx.add(
            Token.createBurnInstruction(
              TOKEN_PROGRAM_ID,
              account.mint,
              associatedAccountKey,
              account.owner,
              [],
              account.amount
            ),
            Token.createCloseAccountInstruction(
              TOKEN_PROGRAM_ID,
              associatedAccountKey,
              publicKey,
              publicKey,
              []
            )
          );
          await provider.send(tx);
        }
      }}
    >
      {hasTokens ? "Burn my Bounty Tokens" : "No Bounty Tokens Found"}
    </AsyncButton>
  );
};
