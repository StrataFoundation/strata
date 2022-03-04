import { useConnection } from "@solana/wallet-adapter-react";
import { ConfirmedSignatureInfo, Connection, PublicKey, TransactionResponse } from "@solana/web3.js";
import { truthy } from "@strata-foundation/react";
import { useEffect, useMemo, useState } from "react";

function sampleSize<A>(arr: A[], num: number): A[] {
  const len = arr.length;

  const step = Math.max(Math.floor(len / num), 1);
  const includeLast = step * num == len;
  const sampled = [];
  for (let i = 0; i < len; i += step) {
    sampled.push(arr[i])
  }

  return [...sampled, includeLast ? arr[-1] : undefined].filter(truthy)
}

async function getSignatures(
  connection: Connection | undefined,
  address: PublicKey | undefined,
  until: Date | undefined,
  lastSignature: string | undefined
): Promise<ConfirmedSignatureInfo[]> {
  if (!connection || !address) {
    return [];
  }

  const signatures = await connection.getSignaturesForAddress(address, {
    before: lastSignature,
    limit: 1000
  });

  const withinTime = signatures.filter(sig => (sig.blockTime || 0) > ((until?.valueOf() || 0) / 1000))

  if (withinTime.length == 1000) {
    return [
      ...withinTime,
      ...(await getSignatures(
        connection,
        address,
        until,
        signatures[signatures.length - 1].signature
      )),
    ];
  }

  return withinTime;
}

async function sampleTransactions(connection: Connection | undefined, signatures: ConfirmedSignatureInfo[], numTransactions: number): Promise<TransactionResponse[]> {
  if (!connection) {
    return [];
  }

  const sampled = sampleSize(signatures, numTransactions).sort((a, b) => (a.blockTime || 0) - (b.blockTime || 0));
  return (await Promise.all(sampled.map(s => connection.getTransaction(s.signature)))).filter(truthy)
}

interface ISampledTransactions {
  error: Error | undefined;
  loadingInitial: boolean;
  loadingMore: boolean;
  transactions: TransactionResponse[];
  fetchMore(num: number): void;
}

export const useSampledTransactions = ({
  numTransactions,
  until,
  address
}: {
  numTransactions: number;
  until?: Date;
  address: PublicKey;
}): ISampledTransactions => {
  const { connection } = useConnection();
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | undefined>();
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const addrStr = useMemo(() => address?.toBase58(), [address])
  useEffect(() => {
    (async () => {
      setLoadingInitial(true);
      try {
        const signatures = await getSignatures(
          connection,
          address,
          until,
          undefined
        );

        setTransactions(await sampleTransactions(connection, signatures, numTransactions))
      } catch (e: any) {
        setError(e)
      } finally {
        setLoadingInitial(false);
      }
    })()
  }, [connection, addrStr, until, setTransactions, numTransactions]);

  const fetchMore = async () => {
    setLoadingMore(true);
    try {
      const lastTx = transactions[transactions.length - 1];
      const lastBlockTime = lastTx && lastTx.blockTime;
      let lastDate = until;
      if (lastBlockTime) {
        const date = new Date(0);
        date.setUTCSeconds(lastBlockTime);
        lastDate = date;
      }
      const signatures = await getSignatures(
        connection,
        address,
        lastDate,
        undefined
      );
      const newTxns = await sampleTransactions(connection, signatures, numTransactions);

      setTransactions((txns) => 
        [...txns, ...newTxns]
      );
    } catch (e: any) {
      setError(e);
    } finally {
      setLoadingMore(false)
    }
  }
  return {
    transactions,
    error,
    loadingInitial,
    loadingMore,
    fetchMore
  }
};
