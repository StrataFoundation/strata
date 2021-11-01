import { Provider } from "@wum.bo/anchor";
import { ProgramError } from "./error";
import {
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
  sendAndConfirmRawTransaction
} from "@solana/web3.js";

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
  payer?: PublicKey
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
    const tx = new Transaction({
      feePayer: payer || provider.wallet.publicKey,
      recentBlockhash
    });
    tx.add(...instructions)
    if (signers.length > 0) {
      tx.partialSign(...signers);
    }
    return tx;
  })

  const txnsSigned = await provider.wallet.signAllTransactions(txns);

  console.log("Sending multiple transactions...")
  try {
    return await promiseAllInOrder(txnsSigned.map((txn) => async () => {
      const txid = await provider.connection.sendRawTransaction(txn.serialize(), {
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