
import { Keypair, SystemProgram } from "@solana/web3.js";
import { ChatSdk } from "@strata-foundation/chat";
import { useSolOwnedAmount } from "@strata-foundation/react";
import { sendInstructions } from "@strata-foundation/spl-utils";
import { useAsyncCallback } from "react-async-hook";
import { useChatSdk } from "../contexts";
import { delegateWalletStorage, useDelegateWallet } from "./useDelegateWallet";
import { useDelegateWalletStruct } from "./useDelegateWalletStruct";
import { useDelegateWalletStructKey } from "./useDelegateWalletStructKey";
import { generateMnemonic } from "bip39";

async function runLoadDelegate(chatSdk: ChatSdk | undefined, sol: number) {
  if (chatSdk) {
    let delegateWalletKeypair = delegateWalletStorage.getDelegateWallet(
      chatSdk.wallet.publicKey!
    );
    const structKey = delegateWalletKeypair && (await ChatSdk.delegateWalletKey(delegateWalletKeypair.publicKey))[0]
    const structExists =
      structKey &&
      (await chatSdk.provider.connection.getAccountInfo(structKey));

    const instructions = [];
    const signers = [];
    if (!structExists) {
      if (!delegateWalletKeypair) {
        const mnemonic = generateMnemonic();
        delegateWalletStorage.setDelegateWallet(
          chatSdk.provider.wallet.publicKey,
          mnemonic!
        );
        delegateWalletKeypair = delegateWalletStorage.getDelegateWallet(
          chatSdk.provider.wallet.publicKey
        );
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
  const { keypair: delegateWallet, mnemonic } = useDelegateWallet();
  const { key: structKey, loading: loadingKey } = useDelegateWalletStructKey(delegateWallet?.publicKey);
  const { account, loading: loadingStruct } = useDelegateWalletStruct(structKey);
  const { amount: balance, loading: loadingBalance } = useSolOwnedAmount(delegateWallet?.publicKey)
  const {
    execute: loadDelegate,
    error,
    loading,
  } = useAsyncCallback(runLoadDelegate);
  const { chatSdk } = useChatSdk();

  return {
    delegateWallet,
    mnemonic,
    loadingNeeds: loadingStruct || loadingBalance || loadingKey,
    needsInit: !loadingStruct && !loadingKey && !account,
    needsTopOff: !delegateWallet || (!loadingBalance && balance < 0.00001),
    loadDelegate: (sol: number) => {
      return loadDelegate(chatSdk, sol)
    },
    loading,
    error,
  };
}
