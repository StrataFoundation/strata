import React from 'react';
import { Provider } from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { sendAndConfirmRawTransaction } from '@solana/web3.js';

export function useProvider(): Provider | undefined {
  const { connection } = useConnection();
  const { adapter } = useWallet();
  const provider = React.useMemo(() => {
    // Let adapter be null, it'll fail if anyone issues transaction commands but will let fetch go through
    // @ts-ignore
    const provider = new Provider(connection, adapter, {});

    // The default impl of send does not use the transaction resuling from wallet.signTransaciton. So we need to fix it.
    provider.send = async function FixedSend(tx, signers, opts) {
      if (signers === undefined) {
        signers = [];
      }
      if (opts === undefined) {
        opts = this.opts;
      }
      tx.feePayer = this.wallet.publicKey;
      tx.recentBlockhash = (await this.connection.getRecentBlockhash(opts.preflightCommitment)).blockhash;
      const signed = await this.wallet.signTransaction(tx);
      signers
        .filter((s) => s !== undefined)
        .forEach((kp) => {
          signed.partialSign(kp!);
        });
      const rawTx = signed.serialize();
      const txId = await sendAndConfirmRawTransaction(connection, rawTx, opts);
      return txId;
    }

    return provider;
  }, [connection, adapter]);

  return provider;
}
