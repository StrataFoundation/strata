/**
 * A script to distribute bounty tokens to people who donated to a sol wallet
 */

import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID, u64 } from "@solana/spl-token";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { sendAndConfirmWithRetry } from "@strata-foundation/spl-utils";

const serviceAccount = Keypair.fromSecretKey(
  Buffer.from(
    JSON.parse(
      require("fs").readFileSync(process.env.ANCHOR_WALLET!, {
        encoding: "utf-8",
      })
    )
  )
);

type Truthy<T> = T extends false | "" | 0 | null | undefined ? never : T; // from lodash

const truthy = <T>(value: T): value is Truthy<T> => !!value;

async function run(): Promise<void> {
  const address = new PublicKey("FqgDG5xfGiMktv5MB7BCfD63gVYeRjbsmwn3oGZBmF9t");
  const mint = new PublicKey("AUcAKtWtxoc4vbrvzP4MXZBcVFKdtFsm7NjCUpkmsWWX");
  const connection = new Connection(process.env.SOLANA_URL!);
  const signatures = await connection.getSignaturesForAddress(address, {
    limit: 1000,
  });
  console.log(signatures.length);
  const txns = (
    await Promise.all(
      signatures.map((sig) => connection.getTransaction(sig.signature))
    )
  )
    .map((tx, index) => {
      if ((tx?.transaction?.message?.accountKeys?.length || 0) > 3) {
        console.log("Invalid tx", signatures[index].signature);
        return;
      }
      return tx;
    })
    .filter(truthy)
    .filter((t) => !t.meta?.err);

  const amounts = txns
    .map((tx, index) => {
      if (tx.meta) {
        const accounts = tx.transaction.message.accountKeys;
        return tx.meta.preBalances.reduce((acc, balance, index) => {
          acc.set(accounts[index].toBase58(), {
            preBalance: balance,
            postBalance: tx.meta!.postBalances[index],
          });
          return acc;
        }, new Map<string, { preBalance: number; postBalance: number }>());
      }
    })
    .filter(truthy);

  const totalsByWallet = amounts.map((a) => {
    const balances = a.get(address.toBase58())!;
    const amount = balances.postBalance - balances.preBalance;
    if (amount > 0) {
      a.delete(address.toBase58());
      a.delete("11111111111111111111111111111111");
      const myKey = [...a.keys()][0];
      console.log(`Key ${myKey}, Amount ${amount / Math.pow(10, 9)}`);
      return { wallet: myKey, amount }
    }
  }).filter(truthy);
  const myAta =  await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      serviceAccount.publicKey,
      false
    )
  for (const { wallet, amount } of totalsByWallet) {
    const owner = new PublicKey(wallet);
    const destination = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      mint,
      owner,
      false
    )
    const instructions = [];
    if (!await connection.getAccountInfo(destination)) {
      instructions.push(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          mint,
          destination,
          owner,
          serviceAccount.publicKey
        )
      )
    }

    instructions.push(Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      myAta,
      destination,
      serviceAccount.publicKey,
      [],
      new u64(amount)
    ));

    console.log(`Sending ${amount / Math.pow(10, 9)} tokens to ${owner.toBase58()}`)
    const tx = new Transaction({
      feePayer: serviceAccount.publicKey,
      recentBlockhash: (await connection.getRecentBlockhash()).blockhash,
    });
    tx.add(...instructions);
    tx.sign(serviceAccount);
    await sendAndConfirmWithRetry(connection, tx.serialize(), {
      skipPreflight: true
    }, "confirmed")
  }
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
