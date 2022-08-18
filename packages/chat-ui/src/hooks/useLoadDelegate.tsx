import { Keypair, Signer, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useSolOwnedAmount } from "@strata-foundation/react";
import { sendInstructions } from "@strata-foundation/spl-utils";
import { useAsyncCallback } from "react-async-hook";
import { useChatSdk } from "../contexts/chatSdk";
import { getKeypairFromMnemonic, useDelegateWallet } from "./useDelegateWallet";
import { useDelegateWalletStruct } from "./useDelegateWalletStruct";
import { useDelegateWalletStructKey } from "./useDelegateWalletStructKey";
import { generateMnemonic } from "bip39";

async function runLoadDelegate(
  delegateWalletKeypair: Keypair | undefined,
  chatSdk: ChatSdk | undefined,
  sol: number
) {
  if (chatSdk) {
    const structKey =
      delegateWalletKeypair &&
      (await ChatSdk.delegateWalletKey(delegateWalletKeypair.publicKey))[0];
    const structExists =
      structKey &&
      (await chatSdk.provider.connection.getAccountInfo(structKey));

    const instructions: TransactionInstruction[] = [];
    const signers: Signer[] = [];
    if (!structExists) {
      if (!delegateWalletKeypair) {
        const mnemonic = generateMnemonic();

        delegateWalletKeypair = getKeypairFromMnemonic(mnemonic);
        const { instructions: settingsInstructions, signers: settingsSigners } =
          await chatSdk.initializeSettingsInstructions({
            settings: {
              delegateWalletSeed: mnemonic,
            },
          });
        instructions.push(...settingsInstructions);
        signers.push(...settingsSigners);
      }

      const { instructions: delInstructions, signers: delSigners } =
        await chatSdk.initializeDelegateWalletInstructions({
          delegateWalletKeypair,
        });
      instructions.push(...delInstructions);
      signers.push(...delSigners);
    }
    const balance = (
      await chatSdk.provider.connection.getAccountInfo(
        delegateWalletKeypair!.publicKey
      )
    )?.lamports;
    const solLamports = sol * Math.pow(10, 9);
    if (balance || 0 < solLamports) {
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: chatSdk.wallet.publicKey,
          toPubkey: delegateWalletKeypair!.publicKey,
          lamports: solLamports,
        })
      );
    }

    await sendInstructions(
      chatSdk.errors || new Map(),
      chatSdk.provider,
      instructions,
      signers
    );
  }
}

export function useLoadDelegate() {
  const {
    keypair: delegateWallet,
    mnemonic,
    loading: loadingDelegate,
    error: delError,
  } = useDelegateWallet();
  const { key: structKey, loading: loadingKey } = useDelegateWalletStructKey(
    delegateWallet?.publicKey
  );
  const { account, loading: loadingStruct } =
    useDelegateWalletStruct(structKey);
  const { amount: balance, loading: loadingBalance } = useSolOwnedAmount(
    delegateWallet?.publicKey
  );
  const {
    execute: loadDelegate,
    error,
    loading,
  } = useAsyncCallback(runLoadDelegate);
  const { chatSdk } = useChatSdk();

  return {
    delegateWallet,
    mnemonic,
    loadingNeeds:
      loadingDelegate || loadingStruct || loadingBalance || loadingKey,
    needsInit: !loadingDelegate && !loadingStruct && !loadingKey && !account,
    needsTopOff:
      !loadingDelegate &&
      delegateWallet &&
      !loadingBalance &&
      balance < 0.001,
    loadDelegate: (sol: number) => {
      return loadDelegate(delegateWallet, chatSdk, sol);
    },
    loading,
    error: error || delError,
  };
}
