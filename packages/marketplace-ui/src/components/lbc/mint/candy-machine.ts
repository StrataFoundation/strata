import * as anchor from "anchor-17";

import {
  MintLayout, Token, TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import {
  PublicKey,
  Signer,
  SystemProgram,
  SYSVAR_SLOT_HASHES_PUBKEY,
  TransactionInstruction
} from "@solana/web3.js";
import { sendMultipleInstructions } from "@strata-foundation/spl-utils";
import { IMintArgs } from "../MintButton";

import { CANDY_MACHINE_PROGRAM, ICandyMachine } from "../../../hooks";
import {
  CIVIC,
  getAtaForMint,
  getNetworkExpire,
  getNetworkToken,
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
} from "./utils";

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);
export interface CollectionData {
  mint: anchor.web3.PublicKey
  candyMachine: anchor.web3.PublicKey
}

export const awaitTransactionSignatureConfirmation = async (
  txid: anchor.web3.TransactionSignature,
  timeout: number,
  connection: anchor.web3.Connection,
  queryStatus = false
): Promise<anchor.web3.SignatureStatus | null | void> => {
  let done = false;
  let status: anchor.web3.SignatureStatus | null | void = {
    slot: 0,
    confirmations: 0,
    err: null,
  };
  let subId = 0;
  status = await new Promise(async (resolve, reject) => {
    setTimeout(() => {
      if (done) {
        return;
      }
      done = true;
      console.log("Rejecting for timeout...");
      reject({ timeout: true });
    }, timeout);

    while (!done && queryStatus) {
      // eslint-disable-next-line no-loop-func
      (async () => {
        try {
          const signatureStatuses = await connection.getSignatureStatuses([
            txid,
          ]);
          status = signatureStatuses && signatureStatuses.value[0];
          if (!done) {
            if (!status) {
              console.log("REST null result for", txid, status);
            } else if (status.err) {
              console.log("REST error for", txid, status);
              done = true;
              reject(status.err);
            } else if (!status.confirmations) {
              console.log("REST no confirmations for", txid, status);
            } else {
              console.log("REST confirmation for", txid, status);
              done = true;
              resolve(status);
            }
          }
        } catch (e) {
          if (!done) {
            console.log("REST connection error: txid", txid, e);
          }
        }
      })();
      await sleep(2000);
    }
  });

  //@ts-ignore
  if (connection._signatureSubscriptions && connection._signatureSubscriptions[subId]) {
    connection.removeSignatureListener(subId);
  }
  done = true;
  console.log("Returning status", status);
  return status;
};

const createAssociatedTokenAccountInstruction = (
  associatedTokenAddress: anchor.web3.PublicKey,
  payer: anchor.web3.PublicKey,
  walletAddress: anchor.web3.PublicKey,
  splTokenMintAddress: anchor.web3.PublicKey
) => {
  const keys = [
    { pubkey: payer, isSigner: true, isWritable: true },
    { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
    { pubkey: walletAddress, isSigner: false, isWritable: false },
    { pubkey: splTokenMintAddress, isSigner: false, isWritable: false },
    {
      pubkey: anchor.web3.SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    {
      pubkey: anchor.web3.SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new anchor.web3.TransactionInstruction({
    keys,
    programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    data: Buffer.from([]),
  });
};

const getMasterEdition = async (
  mint: anchor.web3.PublicKey
): Promise<anchor.web3.PublicKey> => {
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
};

const getMetadata = async (
  mint: anchor.web3.PublicKey
): Promise<anchor.web3.PublicKey> => {
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
};

export const getCandyMachineCreator = async (
  candyMachine: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("candy_machine"), candyMachine.toBuffer()],
    CANDY_MACHINE_PROGRAM
  );
};

export const getCollectionPDA = async (
  candyMachineAddress: anchor.web3.PublicKey
): Promise<[anchor.web3.PublicKey, number]> => {
  return await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("collection"), candyMachineAddress.toBuffer()],
    CANDY_MACHINE_PROGRAM
  )
}

export const getCollectionAuthorityRecordPDA = async (
  mint: anchor.web3.PublicKey,
  newAuthority: anchor.web3.PublicKey
): Promise<anchor.web3.PublicKey> => {
  return (
    await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("collection_authority"),
        newAuthority.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0]
}

export const mintOneToken = async (
  candyMachine: ICandyMachine,
  payer: anchor.web3.PublicKey,
  { tokenBondingSdk, tokenBonding, maxPrice }: IMintArgs
): Promise<PublicKey> => {
  if (!tokenBondingSdk) {
    throw new Error("No bonding sdk")
  }

  const mint = anchor.web3.Keypair.generate()

  const userTokenAccountAddress = (
    await getAtaForMint(mint.publicKey, payer)
  )[0]

  const userPayingAccountAddress = candyMachine.tokenMint
    ? (await getAtaForMint(candyMachine.tokenMint, payer))[0]
    : payer

  const candyMachineAddress = candyMachine.publicKey
  const remainingAccounts: any[] = []
  const instructions: TransactionInstruction[] = []
  const signers: Signer[] = [mint]
  const ataBalance = candyMachine.tokenMint ? (
    await tokenBondingSdk.getTokenAccountBalance(userPayingAccountAddress)
  ).toNumber() : (await candyMachine.program.provider.connection.getAccountInfo(payer))?.lamports

  let bondingInstructions: TransactionInstruction[] = []
  let bondingSigners: Signer[] = []
  if (tokenBonding && (ataBalance || 0) < 1) {
    console.log("Buying bonding curve...", ataBalance)
    if (isNaN(maxPrice)) {
      throw new Error("Invalid slippage");
    }
    const { instructions: bondInstrs, signers: bondSigners } = await tokenBondingSdk.buyInstructions({
      tokenBonding,
      desiredTargetAmount: 1,
      expectedBaseAmount: maxPrice,
      slippage: 0,
    })
    bondingInstructions.push(...bondInstrs)
    bondingSigners.push(...bondSigners)
  }

  instructions.push(
    ...[
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: mint.publicKey,
        space: MintLayout.span,
        lamports:
          await candyMachine.program.provider.connection.getMinimumBalanceForRentExemption(
            MintLayout.span
          ),
        programId: TOKEN_PROGRAM_ID,
      }),
      Token.createInitMintInstruction(
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        0,
        payer,
        payer
      ),
      createAssociatedTokenAccountInstruction(
        userTokenAccountAddress,
        payer,
        payer,
        mint.publicKey
      ),
      Token.createMintToInstruction(
        TOKEN_PROGRAM_ID,
        mint.publicKey,
        userTokenAccountAddress,
        payer,
        [],
        1
      ),
    ]
  )

  if (candyMachine.gatekeeper) {
    remainingAccounts.push({
      pubkey: (
        await getNetworkToken(
          payer,
          candyMachine.gatekeeper.gatekeeperNetwork
        )
      )[0],
      isWritable: true,
      isSigner: false,
    })

    if (candyMachine.gatekeeper.expireOnUse) {
      remainingAccounts.push({
        pubkey: CIVIC,
        isWritable: false,
        isSigner: false,
      })
      remainingAccounts.push({
        pubkey: (
          await getNetworkExpire(
            candyMachine.gatekeeper.gatekeeperNetwork
          )
        )[0],
        isWritable: false,
        isSigner: false,
      })
    }
  }
  if (candyMachine.whitelistMintSettings) {
    const mint = new anchor.web3.PublicKey(
      candyMachine.whitelistMintSettings.mint
    )

    const whitelistToken = (await getAtaForMint(mint, payer))[0]
    remainingAccounts.push({
      pubkey: whitelistToken,
      isWritable: true,
      isSigner: false,
    })

    if (candyMachine.whitelistMintSettings.mode.burnEveryTime) {
      remainingAccounts.push({
        pubkey: mint,
        isWritable: true,
        isSigner: false,
      })
      remainingAccounts.push({
        pubkey: payer,
        isWritable: false,
        isSigner: true,
      })
    }
  }

  if (candyMachine.tokenMint) {
    remainingAccounts.push({
      pubkey: userPayingAccountAddress,
      isWritable: true,
      isSigner: false,
    })
    remainingAccounts.push({
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    })
  }
  const metadataAddress = await getMetadata(mint.publicKey)
  const masterEdition = await getMasterEdition(mint.publicKey)

  const [candyMachineCreator, creatorBump] = await getCandyMachineCreator(
    candyMachineAddress
  )

  console.log(remainingAccounts.map((rm) => rm.pubkey.toBase58()))
  instructions.push(
    await candyMachine.program.instruction.mintNft(creatorBump, {
      accounts: {
        candyMachine: candyMachineAddress,
        candyMachineCreator,
        payer: payer,
        wallet: candyMachine.treasury,
        mint: mint.publicKey,
        metadata: metadataAddress,
        masterEdition,
        mintAuthority: payer,
        updateAuthority: payer,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        recentBlockhashes: SYSVAR_SLOT_HASHES_PUBKEY,
        instructionSysvarAccount: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
      },
      remainingAccounts:
        remainingAccounts.length > 0 ? remainingAccounts : undefined,
    })
  )

  const [collectionPDA] = await getCollectionPDA(candyMachineAddress)
  const collectionPDAAccount =
    await candyMachine.program.provider.connection.getAccountInfo(collectionPDA)

  if (collectionPDAAccount && candyMachine.retainAuthority) {
    try {
      const collectionData =
        // @ts-ignore
        (await candyMachine.program.account.collectionPda.fetch(
          collectionPDA
        )) as CollectionData;
      console.log(collectionData)
      const collectionMint = collectionData.mint
      const collectionAuthorityRecord = await getCollectionAuthorityRecordPDA(
        collectionMint,
        collectionPDA
      )
      console.log(collectionMint)
      if (collectionMint) {
        const collectionMetadata = await getMetadata(collectionMint)
        const collectionMasterEdition = await getMasterEdition(collectionMint)
        console.log("Collection PDA: ", collectionPDA.toBase58())
        console.log("Authority: ", candyMachine.authority.toBase58())
        instructions.push(
          await candyMachine.program.instruction.setCollectionDuringMint({
            accounts: {
              candyMachine: candyMachineAddress,
              metadata: metadataAddress,
              payer: payer,
              collectionPda: collectionPDA,
              tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
              instructions: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
              collectionMint,
              collectionMetadata,
              collectionMasterEdition,
              authority: candyMachine.authority,
              collectionAuthorityRecord,
            },
          })
        )
      }
    } catch (error) {
      console.error(error)
    }
  }

  // Close intermediary account, if it exists and doesn't hold more than 0 tokens
  const cleanupInstructions: TransactionInstruction[] = [];
  if (tokenBonding && (ataBalance || 0) == 1) {
    cleanupInstructions.push(
      Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        userPayingAccountAddress,
        payer,
        payer,
        []
      )
    );
  }

  await sendMultipleInstructions(
    tokenBondingSdk.errors || new Map(),
    tokenBondingSdk.provider,
    [bondingInstructions, instructions, cleanupInstructions],
    [bondingSigners, signers, []],
    payer,
    "confirmed"
  )

  return mint.publicKey
};

export const shortenAddress = (address: string, chars = 4): string => {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
