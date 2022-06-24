import { useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey } from "@solana/web3.js";
import { ISettings } from "@strata-foundation/chat";
import { useLocalStorage } from "@strata-foundation/react";
import { mnemonicToSeedSync } from "bip39";
import { useMemo } from "react";
import { useAsync } from "react-async-hook";
import { useWalletSettings } from "./useWalletSettings";

const storage =
  typeof localStorage !== "undefined"
    ? localStorage
    : require("localstorage-memory");

interface IDelegateWalletStorage {
  getDelegateWalletMnemonic(wallet: PublicKey): string | undefined;
  getDelegateWallet(wallet: PublicKey): Keypair | undefined;
  setDelegateWallet(wallet: PublicKey, mnemonic: string): void;
}

const mnemonicCache: Record<string, Keypair> = {};

export function getKeypairFromMnemonic(mnemonic: string): Keypair {
  if (!mnemonicCache[mnemonic]) {
    const seed = mnemonicToSeedSync(mnemonic, ""); // (mnemonic, password)
    const ret = Keypair.fromSeed(seed.slice(0, 32));

    mnemonicCache[mnemonic] = ret;
  }

  return mnemonicCache[mnemonic];
}

export class LocalDelegateWalletStorage implements IDelegateWalletStorage {
  storageKey(wallet: PublicKey): string {
    return "delegate-wallet-" + wallet?.toBase58();
  }

  getDelegateWallet(wallet: PublicKey): Keypair | undefined {
    const mnemonic = this.getDelegateWalletMnemonic(wallet);
    if (mnemonic) {
      return getKeypairFromMnemonic(mnemonic);
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

interface DelegateWalletReturn {
  loading: boolean;
  error?: Error;
  legacyKeypair?: Keypair;
  keypair: Keypair | undefined;
  legacyMnemonic?: string;
  mnemonic?: string;
}
export function useDelegateWallet(): DelegateWalletReturn {
  const { publicKey } = useWallet();
  const [legacyDelegateData] = useLocalStorage(
    publicKey ? delegateWalletStorage.storageKey(publicKey) : "",
    undefined
  );
  const delegateWalletLegacy = useMemo(() => {
    if (legacyDelegateData && publicKey) {
      try {
        if (legacyDelegateData) {
          return delegateWalletStorage.getDelegateWallet(publicKey);
        }
      } catch (e: any) {
        // ignore
        console.error(e);
      }
    }
  }, [legacyDelegateData, publicKey?.toBase58()]);
  const { info: settings, account, loading } = useWalletSettings();
  const {
    loading: loadingMnemonic,
    result: mnemonic,
    error,
  } = useAsync(async (settings: ISettings | undefined) => {
    if (settings) {
      return settings?.getDelegateWalletSeed()
    }
    return undefined;
  }, [settings]);
  const keypair = useMemo(
    () => (mnemonic ? getKeypairFromMnemonic(mnemonic) : undefined),
    [mnemonic]
  );
  
  return {
    error,
    loading: loadingMnemonic || loading || Boolean(!settings && account),
    legacyKeypair: delegateWalletLegacy,
    mnemonic: mnemonic,
    keypair,
    legacyMnemonic: legacyDelegateData,
  };
}
