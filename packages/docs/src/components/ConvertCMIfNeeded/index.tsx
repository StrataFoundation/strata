import { useVariables } from "../../theme/Root/variables";
import React from "react";
import BN from "bn.js";
import {
  useErrorHandler,
  useProvider,
  useTokenBonding,
} from "@strata-foundation/react";
import {
  ICandyMachine,
  useCandyMachine,
} from "@strata-foundation/marketplace-ui";
import { AnchorProvider } from "@project-serum/anchor";
import { Button } from "@chakra-ui/react";

import { sendInstructions } from "@strata-foundation/spl-utils";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  Token,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey, TransactionInstruction } from "@solana/web3.js";
import { useAsyncCallback } from "react-async-hook";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { usePublicKey } from "@strata-foundation/react";

async function convertToLBC(
  provider: AnchorProvider | undefined,
  targetMint: PublicKey | undefined,
  cm: ICandyMachine | undefined
): Promise<void> {
  console.log(provider, targetMint, cm);
  if (provider && targetMint && cm) {
    const instructions: TransactionInstruction[] = [];
    const incinerator = new PublicKey(
      "gravk12G8FF5eaXaXSe4VEC8BhkxQ7ig5AHdeVdPmDF"
    );
    const incineratorAta = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      targetMint,
      incinerator,
      true
    );
    if (!(await provider.connection.getAccountInfo(incineratorAta))) {
      instructions.push(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          targetMint,
          incineratorAta,
          incinerator,
          provider.wallet.publicKey
        )
      );
    }
    const updateIX = await cm.program.instruction.updateCandyMachine(
      {
        // @ts-ignore
        ...cm.data,
        price: new BN(1),
      },
      {
        accounts: {
          candyMachine: cm.publicKey,
          authority: provider.wallet.publicKey,
          wallet: incineratorAta,
        },
      }
    );
    updateIX.keys.push({
      pubkey: targetMint,
      isWritable: false,
      isSigner: false,
    });
    instructions.push(updateIX);

    await sendInstructions(new Map(), provider, instructions, []);
  }
}

export const ConvertCMIfNeeded = () => {
  const { connected } = useWallet();
  const { provider } = useProvider();
  const variables = useVariables();
  const tokenBondingKey = usePublicKey(variables?.tokenBondingKey);
  const candyMachineKey = usePublicKey(variables?.candyMachineId);
  const { info: bonding, loading: loadingBonding } = useTokenBonding(
    tokenBondingKey
  );
  const { info: cm, loading: loadingCM } = useCandyMachine(candyMachineKey);
  const { setVisible } = useWalletModal();
  const isConverted = bonding && cm && cm.tokenMint && cm.tokenMint.equals(bonding.targetMint);
  const {
    execute: convert,
    loading: converting,
    error,
  } = useAsyncCallback(convertToLBC);
  const { handleErrors } = useErrorHandler();
  handleErrors(error);
  const loading = loadingBonding || loadingCM || converting;

  if (!connected) {
    return (
      <Button
        variant="outline"
        colorScheme="primary"
        onClick={() => setVisible(true)}
        mb={2}
      >
        Connect Wallet
      </Button>
    );
  }

  return (
    <Button
      mb={2}
      variant="outline"
      colorScheme="primary"
      isDisabled={isConverted}
      isLoading={loading}
      disabledText={"Already using LBC"}
      onClick={() => convert(provider, bonding?.targetMint, cm)}
    >
      {isConverted ? "Already using LBC" : "Convert back to LBC"}
    </Button>
  );
};
