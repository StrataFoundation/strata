import { getOrca, OrcaPoolConfig } from "@orca-so/sdk";
import { AnchorProvider } from "@project-serum/anchor";
import NodeWallet from "@project-serum/anchor/dist/cjs/nodewallet";
import { ShdwDrive, StorageAccount } from "@shadow-drive/sdk";
import { AccountLayout, ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  toNumber,
  getMintInfo,
  sendAndConfirmWithRetry,
  truthy,
  sleep,
} from "@strata-foundation/spl-utils";
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
  provider: AnchorProvider,
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

function getEndpoint(connection: Connection) {
  // @ts-ignore
  const endpoint = connection._rpcEndpoint

  // Gengo only works on mainnet
  if (endpoint.includes("dev")) {
    return "https://ssc-dao.genesysgo.net";
  }

  return endpoint;
}

export async function initStorageIfNeeded(
  provider: AnchorProvider | undefined,
  delegateWallet: Keypair | undefined,
  sizeBytes: number
): Promise<void> {
  if (sizeBytes == 0) {
    return;
  }
  if (provider) {
    delegateWallet = maybeUseDevnetWallet(provider?.connection, delegateWallet);
    const connection = new Connection(getEndpoint(provider.connection), "max");
    const localProvider = new AnchorProvider(
      connection,
      delegateWallet ? new NodeWallet(delegateWallet) : provider.wallet,
      {}
    );
    const pubKey = delegateWallet
      ? delegateWallet.publicKey
      : provider.wallet.publicKey;

    const shdwDrive = new ShdwDrive(localProvider.connection, localProvider.wallet);

    const orca = getOrca(localProvider.connection);
    const orcaSolPool = orca.getPool(OrcaPoolConfig.SHDW_SOL);

    const [accountKey] = await getStorageAccount(pubKey, new BN(0));
    let storageAccount: StorageAccount | undefined;
    try {
      storageAccount = await shdwDrive.getStorageAccount(accountKey);
    } catch (e: any) {
      // ignore
    }

    // Double storage size every time there's not enough
    let sizeKB = 0;
    const storageAccountBigEnough = storageAccount && (Number(storageAccount.storageAvailable) > sizeBytes);
    if (!storageAccountBigEnough) {
      let sizeToAdd = Number(storageAccount?.storageAvailable || (2 * sizeBytes));
      while (sizeToAdd < sizeBytes) {
        sizeToAdd += sizeToAdd;
      }
      sizeKB = Math.ceil(sizeToAdd / 1024);
    } else if (!storageAccount) {
      sizeKB = Math.ceil(sizeBytes / 1024);
    }

    console.log(
      `Storage currently has ${Number(
        storageAccount?.storageAvailable || 0
      )}, file size is ${sizeBytes}, adding ${sizeKB} KB`
    );

    const shadesNeeded = storageAccountBigEnough ? 0 : Math.max((sizeKB * 1024), 1);
    const shdwNeeded = shadesNeeded / Math.pow(10, 9);
    const solToken = orcaSolPool.getTokenB();
    const shdwToken = orcaSolPool.getTokenA();
    const shdwOwnedAmount = await getOwnedAmount(localProvider, pubKey, SHDW);

    if (shdwOwnedAmount < shadesNeeded) {
      const quote = await orcaSolPool.getQuote(
        shdwToken,
        // Add 5% more than we need, at least need 1 shade
        new Decimal(shdwNeeded * 1.05)
      );
      console.log(`Not enough SHDW, buying ${shdwNeeded} SHDW for ~${quote.getExpectedOutputAmount().toNumber()} SOL`);
      const swapPayload = await orcaSolPool.swap(
        pubKey,
        solToken,
        quote.getExpectedOutputAmount(),
        new Decimal(shdwNeeded)
      );
      const tx = swapPayload.transaction;
      tx.recentBlockhash = (
        await localProvider.connection.getLatestBlockhash()
      ).blockhash;
      tx.feePayer = pubKey;
      const signers = [...swapPayload.signers, delegateWallet].filter(truthy);
      tx.sign(...signers);

      await sendAndConfirmWithRetry(
        localProvider.connection,
        tx.serialize(),
        {
          skipPreflight: true,
        },
        "max"
      );
      // Even with max confirmation, still this sometimes fails
      await sleep(2000);
    }

    await shdwDrive.init();

    if (storageAccount && sizeKB && !storageAccountBigEnough) {
      await withRetries(() => shdwDrive.addStorage(accountKey, sizeKB + "KB"), 3);
    } else if (!storageAccount) {
      await withRetries(() => shdwDrive.createStorageAccount("chat", sizeKB + "KB"), 3);
    }
  }
}

export async function uploadFiles(
  provider: AnchorProvider | undefined,
  files: File[],
  delegateWallet: Keypair | undefined,
  tries: number = 5
): Promise<string[] | undefined> {
  if (files.length == 0) {
    return []
  }
  
  const size = files.reduce((acc, f) => acc + f.size, 0);
  await initStorageIfNeeded(provider, delegateWallet, size);
  if (provider) {
    delegateWallet = maybeUseDevnetWallet(provider.connection, delegateWallet);
    const pubKey = delegateWallet
      ? delegateWallet.publicKey
      : provider.wallet.publicKey;
    const [accountKey] = await getStorageAccount(pubKey, new BN(0));
    const shdwDrive = new ShdwDrive(
      // @ts-ignore
      new Connection(getEndpoint(provider.connection), "max"),
      delegateWallet ? new NodeWallet(delegateWallet) : provider.wallet
    );
    await shdwDrive.init();

    // @ts-ignore
    const res = await withRetries(() => shdwDrive.uploadMultipleFiles(accountKey, files as FileList), tries);
    return res.map(r => r.location);
  }
}

export function randomizeFileName(file: File): void {
  const ext = file.name.split(".").pop();
  const name = randomIdentifier() + (ext ? `.${ext}` : "");

  Object.defineProperty(file, "name", {
    writable: true,
    value: name,
  });
}

function randomIdentifier(): string {
  return Math.random().toString(32).slice(2);
}

// A devnet wallet loaded with 1 SHDW for testing in devnet. Yes, anyone can mess with this wallet.
// If they do, devnet shdw things will not continue working. That's life. If you find this,
// please don't be an asshole.
const DEVNET_WALLET = Keypair.fromSecretKey(
  new Uint8Array([
    17, 83, 103, 136, 230, 98, 37, 214, 218, 31, 168, 218, 184, 30, 163, 18,
    164, 101, 117, 232, 151, 205, 200, 74, 198, 52, 31, 21, 234, 238, 220, 182,
    9, 99, 203, 242, 226, 192, 165, 246, 188, 184, 61, 204, 50, 228, 30, 89,
    215, 145, 146, 206, 179, 116, 224, 158, 180, 176, 27, 221, 238, 77, 69, 207,
  ])
);
function maybeUseDevnetWallet(connection: Connection, delegateWallet: Keypair | undefined): Keypair | undefined {
  // @ts-ignore
  if (connection._rpcEndpoint.includes("dev")) {
    return DEVNET_WALLET
  }
  return delegateWallet;
}

async function withRetries<T>(arg0: () => Promise<T>, tries: number = 3): Promise<T> {
  try {
    return await arg0()
  } catch (e: any) {
    if (tries > 0) {
      console.warn(`Failed tx, retrying up to ${tries} more times.`, e);
      return withRetries(arg0, tries - 1)
    }
    throw e;
  }
}

