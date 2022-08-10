import {
  ConfirmedSignatureInfo,
  Connection,
  PublicKey,
  TransactionResponse,
} from "@solana/web3.js";
import { Accelerator, Cluster } from ".";

export type TransactionResponseWithSig = Partial<TransactionResponse> & {
  signature: string;
  pending?: boolean;
  logs: string[] | null;
};

function sleep(ms: number): Promise<any> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T; // from lodash

const truthy = <T>(value: T): value is Truthy<T> => !!value;

export async function hydrateTransactions(
  connection: Connection | undefined,
  signatures: ConfirmedSignatureInfo[],
  tries: number = 0
): Promise<TransactionResponseWithSig[]> {
  if (!connection) {
    return [];
  }

  const rawTxs = await connection.getTransactions(
    signatures.map((sig) => sig.signature)
  );

  // Some were null. Try again
  if (rawTxs.some((t) => !t) && tries < 5) {
    await sleep(500);
    return hydrateTransactions(connection, signatures, tries + 1);
  }

  const txs = rawTxs.map((t, index) => {
    // @ts-ignore
    t.signature = signatures[index].signature;
    // @ts-ignore
    t.pending = false;

    return t as TransactionResponseWithSig;
  });

  return txs
    .filter(truthy)
    .sort((a, b) => (b.blockTime || 0) - (a.blockTime || 0));
}

// Returns a dispose funciton
export function subscribeTransactions({
  connection,
  address,
  cluster,
  accelerator,
  callback,
}: {
  connection: Connection;
  address: PublicKey;
  accelerator?: Accelerator;
  cluster: Cluster;
  callback: (tx: TransactionResponseWithSig) => void;
}): () => void {
  const connSubId = connection.onLogs(
    address,
    async ({ signature, err, logs }, { slot }) => {
      try {
        const newTxns = await hydrateTransactions(connection, [
          {
            slot,
            signature,
            blockTime: new Date().valueOf() / 1000,
            memo: "",
            err,
          },
        ]);
        if (newTxns[0]) callback({ ...newTxns[0], logs });
      } catch (e: any) {
        console.error("Error while fetching new tx", e);
      }
    },
    "confirmed"
  );
  let subId: string;
  let promise = (async () => {
    if (address && accelerator) {
      subId = await accelerator.onTransaction(
        cluster,
        address,
        ({ logs, transaction, txid, blockTime }) => {
          callback({
            signature: txid,
            transaction: {
              message: transaction.compileMessage(),
              signatures: transaction.signatures.map((sig) =>
                sig.publicKey.toBase58()
              ),
            },
            logs,
            blockTime,
            pending: true,
          });
        }
      );
    }
  })();

  return () => {
    connection.removeOnLogsListener(connSubId);
    (async () => {
      await promise;
      if (subId && accelerator) {
        accelerator.unsubscribeTransaction(subId);
      }
    })();
  };
}
