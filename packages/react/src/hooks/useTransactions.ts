import { useConnection } from "@solana/wallet-adapter-react";
import {
  ConfirmedSignatureInfo,
  Connection,
  PublicKey, TransactionResponse
} from "@solana/web3.js";
import {
  Cluster,
  subscribeTransactions,
  TransactionResponseWithSig,
  hydrateTransactions,
} from "@strata-foundation/accelerator";
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
  lazy = false,
}: {
  numTransactions: number;
  until?: Date;
  address?: PublicKey;
  /** Subscribe to new transactions on the address */
  subscribe?: boolean;
  /** Use the Strata accelerator service to see transacions before they are confirmed (if the user also sends to the accelerator) */
  accelerated?: boolean;
  /** If lazy, don't fetch until fetchNew called */
  lazy?: boolean;
}): ITransactions => {
  const { accelerator } = useAccelerator();
  const { cluster } = useEndpoint();
  const { connection } = useConnection();
  const [loadingInitial, setLoadingInitial] = useState(!lazy);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [transactions, setTransactions] = useState<
    TransactionResponseWithSig[]
  >([]);
  const addrStr = useMemo(() => address?.toBase58(), [address]);

  useEffect(() => {
    let dispose: () => void | undefined;
    if (connection && subscribe && address && cluster) {
      dispose = subscribeTransactions({
        connection,
        address,
        cluster: cluster as Cluster,
        accelerator,
        callback: (newTx) => {
          setTransactions((txns) => removeDups([newTx, ...txns]));
        },
      });
    }

    return () => {
      if (dispose) {
        dispose();
      }
    }
  }, [])

  useEffect(() => {
    (async () => {
      if (!lazy) {
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
