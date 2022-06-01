import { Icon, IconButton } from "@chakra-ui/react";
import { getOrca, OrcaPoolConfig } from "@orca-so/sdk";
import { Provider } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { ShdwDrive, StorageAccount } from "@shadow-drive/sdk";
import { AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { useErrorHandler, useProvider } from "@strata-foundation/react";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { getMintInfo, sendAndConfirmWithRetry } from "@strata-foundation/spl-utils";
import BN from "bn.js";
import Decimal from "decimal.js";
import React from "react";
import { useAsyncCallback } from "react-async-hook";
import { IoMdAttach } from "react-icons/io";
import { useDelegateWallet } from "../hooks";

const PROGRAM_ID = new PublicKey(
  "2e1wdyNhUvE76y6yUCvah2KaviavMJYKoRun8acMRBZZ"
);
const SHDW = new PublicKey("SHDWyBxihqiCj6YekG2GUr7wqKLeLAMK1gHZck9pL6y");

function getStorageAccount(
  key: PublicKey,
  accountSeed: BN
): Promise<[PublicKey, number]> {
  return PublicKey.findProgramAddress(
    [
      Buffer.from("storage-account"),
      key.toBytes(),
      accountSeed.toTwos(2).toArrayLike(Buffer, "le", 4),
    ],
    PROGRAM_ID
  );
}

async function getOwnedAmount(provider: Provider, wallet: PublicKey, mint: PublicKey): Promise<number> {
  const ata = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint,
    wallet,
    true
  );
  const mintAcc = await getMintInfo(provider, mint);
  const acct = await provider.connection.getAccountInfo(ata, "confirmed");
  if (acct) {
    return toNumber(u64.fromBuffer(AccountLayout.decode(acct.data).amount), mintAcc);
  }

  return 0;
}

const START_SIZE_KB = 1024

async function uploadFile(
  provider: Provider | undefined,
  delegateWallet: Keypair | undefined,
  file: File
): Promise<string | undefined> {
  if (provider && delegateWallet) {
    const shdwDrive = new ShdwDrive(
      // @ts-ignore
      new Connection(provider.connection._rpcEndpoint, "max"),
      new NodeWallet(delegateWallet)
    );
    
    const orca = getOrca(provider.connection);
    const orcaSolPool = orca.getPool(OrcaPoolConfig.SHDW_SOL);

    const [accountKey] = await getStorageAccount(
      delegateWallet.publicKey,
      new BN(0)
    );
    let storageAccount: StorageAccount | undefined;
    try {
      const storageAccount = await shdwDrive.getStorageAccount(accountKey);
    } catch(e: any) {
      // ignore
    }

    // Double storage size every time there's not enough
    let sizeKB = 0;
    if (storageAccount && storageAccount.storageAvailable < file.size) {
      let sizeToAdd = storageAccount.storageAvailable;
      while (sizeToAdd < file.size) {
        sizeToAdd += sizeToAdd
      }
      sizeKB = Math.ceil(sizeToAdd / 1024);
    } else if (!storageAccount) {
      sizeKB = START_SIZE_KB
    }

    const shdwNeeded = (sizeKB * 1024 / Math.pow(10, 9));
    const solToken = orcaSolPool.getTokenB();
    const shdwToken = orcaSolPool.getTokenA();
    const shdwOwnedAmount = await getOwnedAmount(provider, delegateWallet.publicKey, SHDW)

    if (shdwOwnedAmount < shdwNeeded) {
      console.log("Not enough SHDW, buying some...")
      const quote = await orcaSolPool.getQuote(
        shdwToken,
        new Decimal(Math.max(shdwNeeded * 1.1, Math.pow(10, -9))) // Add 5% more than we need
      );
      const swapPayload = await orcaSolPool.swap(
        delegateWallet,
        solToken,
        quote.getExpectedOutputAmount(),
        new Decimal(shdwNeeded)
      );
      const tx = swapPayload.transaction;
      tx.recentBlockhash = (
        await provider.connection.getLatestBlockhash()
      ).blockhash;
      tx.feePayer = delegateWallet.publicKey;
      tx.sign(...swapPayload.signers, delegateWallet);

      await sendAndConfirmWithRetry(
        provider.connection,
        tx.serialize(),
        {},
        "confirmed"
      );
    }

    await shdwDrive.init();

    if (storageAccount && sizeKB) {
      await shdwDrive.addStorage(accountKey, sizeKB + "KB");
    } else if (!storageAccount) {
      await shdwDrive.createStorageAccount("chat", sizeKB + "KB");
    }

    const ext = file.name.split(".").slice(-1)[0];
    const name = randomIdentifier() + (ext ? `.${ext}` : "");
    console.log(name)
    Object.defineProperty(file, "name", {
      writable: true,
      value: name,
    });
    const res = await shdwDrive.uploadFile(accountKey, file);
    return res.finalized_location;
  }
}

function randomIdentifier(): string {
  return Math.random().toString(32).slice(2);
}


export function ShdwAttachment({
  onUpload,
}: {
  onUpload: (url: string) => void;
}) {
  const hiddenFileInput = React.useRef<HTMLInputElement>(null);
  const { provider } = useProvider();
  const delegateWallet = useDelegateWallet();
  const { execute, loading, error } = useAsyncCallback(uploadFile);
  const { handleErrors } = useErrorHandler();
  handleErrors(error);
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    try {
      const url = await execute(provider, delegateWallet, file);
      if (url) {
        onUpload(url);
      }
    } finally {
      if (hiddenFileInput.current) {
        hiddenFileInput.current.value = ""
      }
    }
  };

  return (
    <>
      <input
        id="image"
        type="file"
        accept=".png,.jpg,.gif,.mp4,.svg"
        multiple={false}
        onChange={handleImageChange}
        ref={hiddenFileInput}
        style={{ display: "none" }}
      />
      <IconButton
        isLoading={loading}
        size="lg"
        aria-label="Select Image"
        variant="outline"
        onClick={() => hiddenFileInput.current!.click()}
        icon={<Icon w="24px" h="24px" as={IoMdAttach} />}
      />
    </>
  );
}
