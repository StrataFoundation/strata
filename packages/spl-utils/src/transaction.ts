import { Provider } from "@project-serum/anchor";
import {
  PublicKey,
  Signer, Transaction,
  TransactionInstruction
} from "@solana/web3.js";
import { ProgramError } from "./anchorError";

async function promiseAllInOrder<T>(it: (() => Promise<T>)[]): Promise<Iterable<T>> {
  let ret: T[] = [];
  for (const i of it) {
    ret.push(await i());
  }

  return ret;
}

export interface InstructionResult<A> {
  instructions: TransactionInstruction[];
  signers: Signer[];
  output: A;
}

export interface BigInstructionResult<A> {
  instructions: TransactionInstruction[][];
  signers: Signer[][];
  output: A;
}

export async function sendInstructions(
  idlErrors: Map<number, string>,
  provider: Provider, 
  instructions: TransactionInstruction[], 
  signers: Signer[],
  payer: PublicKey = provider.wallet.publicKey
): Promise<string> {
  const tx = new Transaction();
  tx.feePayer = payer || provider.wallet.publicKey;
  tx.add(...instructions);

  try {
    return await provider.send(tx, signers, {
      commitment: "confirmed",
      preflightCommitment: "confirmed"
    });
  } catch (e) {
    console.error(e);
    const wrappedE = ProgramError.parse(e, idlErrors)
    throw wrappedE == null ? e : wrappedE;
  }
}

type Truthy<T> = T extends false | '' | 0 | null | undefined ? never : T; // from lodash

function truthy<T>(value: T): value is Truthy<T> {
  return !!value;
}

export async function sendMultipleInstructions(
  idlErrors: Map<number, string>,
  provider: Provider, 
  instructionGroups: TransactionInstruction[][], 
  signerGroups: Signer[][], 
  payer?: PublicKey
): Promise<Iterable<string>> {
  const recentBlockhash = (await provider.connection.getRecentBlockhash('confirmed')).blockhash
  const txns = instructionGroups.map((instructions, index) => {
    const signers = signerGroups[index];
    if (instructions.length > 0) {
      const tx = new Transaction({
        feePayer: payer || provider.wallet.publicKey,
        recentBlockhash
      });
      tx.add(...instructions)
      // https://github.com/solana-labs/solana/issues/21722
      // I wouldn't wish this bug on my worst enemies. If we don't do this hack, any time our txns are signed, then serialized, then deserialized,
      // then reserialized, they will break.
      const fixedTx = Transaction.from(tx.serialize({ requireAllSignatures: false }));
      if (signers.length > 0) {
        fixedTx.partialSign(...signers);
      }

      return fixedTx;
    }
  }).filter(truthy);

  const txnsSigned = (await provider.wallet.signAllTransactions(txns)).map(tx => tx.serialize());

  console.log("Sending multiple transactions...")
  try {
    return await promiseAllInOrder(txnsSigned.map((txn) => async () => {
      const txid = await provider.connection.sendRawTransaction(txn, {
        skipPreflight: true
      })
      const result = await provider.connection.confirmTransaction(txid, "confirmed");
      if (result.value.err) {
        const tx = await provider.connection.getTransaction(txid, {
          commitment: "confirmed"
        });
        console.error(tx?.meta?.logMessages?.join("\n"))
        throw result.value.err
      }
      return txid;
    }))
  } catch (e) {
    console.error(e);
    const wrappedE = ProgramError.parse(e, idlErrors)
    throw wrappedE == null ? e : wrappedE;
  }
}