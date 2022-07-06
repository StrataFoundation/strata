import { useConnection } from "@solana/wallet-adapter-react";
import {
  ConfirmedSignatureInfo,
  Connection,
  PublicKey, TransactionResponse
} from "@solana/web3.js";
import { Cluster } from "@strata-foundation/accelerator";
import { sleep } from "@strata-foundation/spl-utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccelerator } from "../contexts/acceleratorContext";
import { truthy } from "../utils";
import { useEndpoint } from "./useEndpoint";

async function getSignatures(
  connection: Connection | undefined,
  address: PublicKey | undefined,
  until: Date | undefined,
  lastSignature: string | undefined,
  maxSignatures: number = 1000
): Promise<ConfirmedSignatureInfo[]> {
  if (!connection || !address) {
    return [];
  }

  const fetchSize = Math.min(1000, maxSignatures);
  const signatures = await connection.getSignaturesForAddress(address, {
    before: lastSignature,
    limit: fetchSize,
  });

  const withinTime = signatures.filter(
    (sig) => (sig.blockTime || 0) > (until?.valueOf() || 0) / 1000
  );

  if (withinTime.length == 1000) {
    return [
      ...withinTime,
      ...(await getSignatures(
        connection,
        address,
        until,
        signatures[signatures.length - 1].signature,
        maxSignatures
      )),
    ];
  }

  return withinTime;
}

// Pending when coming from the accelerator
export type TransactionResponseWithSig = Partial<TransactionResponse> & {
  signature: string;
  pending?: boolean;
};

async function hydrateTransactions(
  connection: Connection | undefined,
  signatures: ConfirmedSignatureInfo[],
  tries: number = 0
): Promise<TransactionResponseWithSig[]> {
  if (!connection) {
    return [];
  }

  const rawTxs = (
    await connection.getTransactions(signatures.map((sig) => sig.signature))
  );

  // Some were null. Try again
  if (rawTxs.some(t => !t) && tries < 3) {
    await sleep(500);
    return hydrateTransactions(connection, signatures, tries + 1)
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

interface ITransactions {
  error: Error | undefined;
  hasMore: boolean;
  loadingInitial: boolean;
  loadingMore: boolean;
  transactions: TransactionResponseWithSig[];
  fetchMore(num: number): void;
  fetchNew(num: number): void;
}

function removeDups(
  txns: TransactionResponseWithSig[]
): TransactionResponseWithSig[] {
  const notPending = new Set(
    Array.from(txns.filter((tx) => !tx.pending).map((tx) => tx.signature))
  );
  // Use the block times from pending messages so that there's no weird reording on screen
  const pendingBlockTimes = txns
    .filter((tx) => tx.pending)
    .reduce((acc, tx) => ({ ...acc, [tx.signature]: tx.blockTime }), {} as Record<string, number | null | undefined>);
    
  const seen = new Set();

  return txns
    .map((tx) => {
      const nonPendingAvailable = tx.pending && notPending.has(tx.signature);
      if (!seen.has(tx.signature) && !nonPendingAvailable) {
        tx.blockTime = pendingBlockTimes[tx.signature] || tx.blockTime;
        seen.add(tx.signature);
        return tx;
      }
    })
    .filter(truthy);
}

export const useTransactions = ({
  numTransactions,
  until,
  address,
  subscribe = false,
  accelerated = false,
}: {
  numTransactions: number;
  until?: Date;
  address?: PublicKey;
  /** Subscribe to new transactions on the address */
  subscribe?: boolean;
  /** Use the Strata accelerator service to see transacions before they are confirmed (if the user also sends to the accelerator) */
  accelerated?: boolean;
}): ITransactions => {
  const { accelerator } = useAccelerator();
  const { cluster } = useEndpoint();
  const { connection } = useConnection();
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [transactions, setTransactions] = useState<
    TransactionResponseWithSig[]
  >([]);
  const addrStr = useMemo(() => address?.toBase58(), [address]);

  useEffect(() => {
    let subId: number;
    if (subscribe && address) {
      subId = connection.onLogs(
        address,
        async ({ signature, err }, { slot }) => {
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
            setTransactions((txns) => removeDups([...newTxns, ...txns]));
          } catch (e: any) {
            console.error("Error while fetching new tx", e);
          }
        },
        "confirmed"
      );
    }
    return () => {
      if (subId) {
        connection.removeOnLogsListener(subId);
      }
    };
  }, [subscribe, connection, addrStr, setTransactions]);

  useEffect(() => {
    let subId: string;
    let promise = (async () => {
      if (subscribe && address && accelerated && accelerator) {
        subId = await accelerator.onTransaction(
          cluster as Cluster,
          address,
          ({ transaction, txid, blockTime }) => {
            setTransactions((txns) => {
              try {
                return removeDups([
                  {
                    signature: txid,
                    transaction: {
                      message: transaction.compileMessage(),
                      signatures: transaction.signatures.map((sig) =>
                        sig.publicKey.toBase58()
                      ),
                    },
                    blockTime,
                    pending: true,
                  },
                  ...txns,
                ]);
              } catch (e: any) {
                console.error(e);
                throw e;
              }
            });
          }
        );
      }
    })();

    return () => {
      if (subId && accelerator) {
        (async () => {
          await promise;
          accelerator.unsubscribeTransaction(subId);
        })()        
      }
    };
  }, [subscribe, accelerated, accelerator, addrStr, setTransactions]);

  useEffect(() => {
    (async () => {
      setLoadingInitial(true);
      setTransactions([]);
      try {
        const signatures = await getSignatures(
          connection,
          address,
          until,
          undefined,
          numTransactions
        );

        setHasMore(signatures.length === numTransactions);

        setTransactions(await hydrateTransactions(connection, signatures));
      } catch (e: any) {
        setError(e);
      } finally {
        setLoadingInitial(false);
      }
    })();
  }, [connection, addrStr, until, setTransactions, numTransactions]);

  const fetchMore = useCallback(
    async (num: number) => {
      setLoadingMore(true);
      try {
        const lastTx = transactions[transactions.length - 1];
        const signatures = await getSignatures(
          connection,
          address,
          until,
          lastTx && lastTx.transaction && lastTx.transaction.signatures[0],
          num
        );

        setHasMore(signatures.length === num);
        const newTxns = await hydrateTransactions(connection, signatures);

        setTransactions((txns) => removeDups([...txns, ...newTxns]));
      } catch (e: any) {
        setError(e);
      } finally {
        setLoadingMore(false);
      }
    },
    [
      transactions[transactions.length - 1],
      connection,
      address,
      until,
      setHasMore,
      setTransactions,
      setError,
      setLoadingMore,
    ]
  );

  const fetchNew = useCallback(
    async (num: number) => {
      setLoadingMore(true);
      try {
        const earlyTx = transactions[0];
        const earlyBlockTime = earlyTx && earlyTx.blockTime;
        let lastDate = until;
        if (earlyBlockTime) {
          const date = new Date(0);
          date.setUTCSeconds(earlyBlockTime);
          lastDate = date;
        }
        const signatures = await getSignatures(
          connection,
          address,
          lastDate,
          undefined,
          num
        );
        const newTxns = await hydrateTransactions(connection, signatures);

        setTransactions((txns) => removeDups([...newTxns, ...txns]));
      } catch (e: any) {
        setError(e);
      } finally {
        setLoadingMore(false);
      }
    },
    [
      setLoadingMore,
      setError,
      setTransactions,
      until,
      address,
      transactions[0],
      connection,
    ]
  );
  return {
    hasMore,
    transactions,
    error,
    loadingInitial,
    loadingMore,
    fetchMore,
    fetchNew,
  };
};
