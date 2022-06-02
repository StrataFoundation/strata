import { getOrca, OrcaPoolConfig } from "@orca-so/sdk";
import { Provider } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { ShdwDrive, StorageAccount } from "@shadow-drive/sdk";
import { AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { toNumber } from "@strata-foundation/spl-token-bonding";
import { getMintInfo, sendAndConfirmWithRetry, truthy } from "@strata-foundation/spl-utils";
import BN from "bn.js";
import Decimal from "decimal.js";

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

async function getOwnedAmount(
  provider: Provider,
  wallet: PublicKey,
  mint: PublicKey
): Promise<number> {
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
    return toNumber(
      u64.fromBuffer(AccountLayout.decode(acct.data).amount),
      mintAcc
    );
  }

  return 0;
}


export async function uploadFile(
  provider: Provider | undefined,
  file: File,
  delegateWallet: Keypair | undefined
): Promise<string | undefined> {
  if (provider) {
    const pubKey = delegateWallet ? delegateWallet.publicKey : provider.wallet.publicKey;

    const shdwDrive = new ShdwDrive(
      // @ts-ignore
      new Connection(provider.connection._rpcEndpoint, "max"),
      delegateWallet ? new NodeWallet(delegateWallet) : provider.wallet
    );

    const orca = getOrca(provider.connection);
    const orcaSolPool = orca.getPool(OrcaPoolConfig.SHDW_SOL);

    const [accountKey] = await getStorageAccount(
      pubKey,
      new BN(0)
    );
    let storageAccount: StorageAccount | undefined;
    try {
      storageAccount = await shdwDrive.getStorageAccount(accountKey);
    } catch (e: any) {
      // ignore
    }

    // Double storage size every time there's not enough
    let sizeKB = 0;
    if (storageAccount && Number(storageAccount.storageAvailable) < file.size) {
      let sizeToAdd = storageAccount.storageAvailable;
      while (sizeToAdd < file.size) {
        sizeToAdd += sizeToAdd;
      }
      sizeKB = Math.ceil(sizeToAdd / 1024);
    } else if (!storageAccount) {
      sizeKB = Math.ceil(file.size / 1024);
    }

    const shdwNeeded = (sizeKB * 1024) / Math.pow(10, 9);
    const solToken = orcaSolPool.getTokenB();
    const shdwToken = orcaSolPool.getTokenA();
    const shdwOwnedAmount = await getOwnedAmount(provider, pubKey, SHDW);

    if (shdwOwnedAmount < shdwNeeded) {
      console.log("Not enough SHDW, buying some...");
      const quote = await orcaSolPool.getQuote(
        shdwToken,
        new Decimal(Math.max(shdwNeeded * 1.1, Math.pow(10, -9))) // Add 5% more than we need
      );
      const swapPayload = await orcaSolPool.swap(
        pubKey,
        solToken,
        quote.getExpectedOutputAmount(),
        new Decimal(shdwNeeded)
      );
      const tx = swapPayload.transaction;
      tx.recentBlockhash = (
        await provider.connection.getRecentBlockhash()
      ).blockhash;
      tx.feePayer = pubKey;
      const signers = [...swapPayload.signers, delegateWallet].filter(truthy);
      tx.sign(...signers);

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

    const ext = file.name.split(".").slice(1, -1).join(".");
    const name = randomIdentifier() + (ext ? `.${ext}` : "");
    console.log(name);
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
