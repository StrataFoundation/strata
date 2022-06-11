import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { useLocalStorage } from "@strata-foundation/react";
import { useMemo } from "react";
import { mnemonicToSeedSync } from "bip39";

const storage =
  typeof localStorage !== "undefined"
    ? localStorage
    : require("localstorage-memory");

interface IDelegateWalletStorage {
  getDelegateWalletMnemonic(wallet: PublicKey): string | undefined;
  getDelegateWallet(wallet: PublicKey): Keypair | undefined;
  setDelegateWallet(wallet: PublicKey, mnemonic: string): void;
}

export class LocalDelegateWalletStorage implements IDelegateWalletStorage {
  storageKey(wallet: PublicKey): string {
    return "delegate-wallet-" + wallet?.toBase58();
  }

  getDelegateWallet(wallet: PublicKey): Keypair | undefined {
    const mnemonic = this.getDelegateWalletMnemonic(wallet);
    if (mnemonic) {
      const seed = mnemonicToSeedSync(mnemonic, ""); // (mnemonic, password)
      return Keypair.fromSeed(seed.slice(0, 32));
    }
  }

  getDelegateWalletMnemonic(wallet: PublicKey): string | undefined {
    const item = storage.getItem(this.storageKey(wallet));
    if (item) {
      return item;
    }
  }
  setDelegateWallet(wallet: PublicKey, mnemonic: string): void {
    storage.setItem(this.storageKey(wallet), mnemonic);
  }
}

export const delegateWalletStorage = new LocalDelegateWalletStorage();

export function useDelegateWallet(): { keypair: Keypair | undefined; mnemonic?: string } {
  const { publicKey } = useWallet();
  const [delegateData] = useLocalStorage(
    publicKey ? delegateWalletStorage.storageKey(publicKey) : "",
    undefined
  );
  const delegateWallet = useMemo(() => {
    if (delegateData && publicKey) {
      try {
        if (delegateData) {
          const seed = mnemonicToSeedSync(delegateData, ""); // (mnemonic, password)
          return Keypair.fromSeed(seed.slice(0, 32));
        }
      } catch (e: any) {
        // ignore
        console.error(e);
      }
    }
  }, [delegateData, publicKey?.toBase58()]);

  return {
    keypair: delegateWallet,
    mnemonic: delegateData
  }
}
