import { AnchorProvider } from "@project-serum/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ConfirmOptions, sendAndConfirmRawTransaction, Signer, Transaction } from "@solana/web3.js";
import React from "react";

export const ProviderContext = React.createContext<{
  provider?: AnchorProvider;
  awaitingApproval: boolean;
}>({
  awaitingApproval: false,
});

export const ProviderContextProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { connection } = useConnection();
  const { wallet } = useWallet();
  const [awaitingApproval, setAwaitingApproval] = React.useState(false);

  const provider = React.useMemo(() => {
    if (connection) {
      // Let adapter be null, it'll fail if anyone issues transaction commands but will let fetch go through
      // @ts-ignore
      const provider = new AnchorProvider(connection, wallet?.adapter, {});

      // The default impl of send does not use the transaction resuling from wallet.signTransaciton. So we need to fix it.
      provider.sendAndConfirm = async function FixedSend(
        tx: Transaction,
        signers?: Signer[],
        opts?: ConfirmOptions
      ) {
        if (signers === undefined) {
          signers = [];
        }
        if (opts === undefined) {
          opts = this.opts;
        }
        tx.feePayer = this.wallet.publicKey;
        tx.recentBlockhash = (
          await this.connection.getRecentBlockhash(opts?.preflightCommitment)
        ).blockhash;
        setAwaitingApproval(true);
        try {
          const signed = await this.wallet.signTransaction(tx);
          setAwaitingApproval(false);
          signers
            .filter((s) => s !== undefined)
            .forEach((kp) => {
              signed.partialSign(kp!);
            });
          const rawTx = signed.serialize();
          const txId = await sendAndConfirmRawTransaction(
            connection,
            rawTx,
            opts
          );
          return txId;
        } finally {
          setAwaitingApproval(false);
        }
      };

      return provider;
    }
  }, [connection, wallet]);

  return (
    <ProviderContext.Provider value={{ awaitingApproval, provider }}>
      {children}
    </ProviderContext.Provider>
  );
};
