import {
  createInstruction,
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
  NAME_PROGRAM_ID,
  Numberu32,
  Numberu64,
  ReverseTwitterRegistryState,
  TWITTER_ROOT_PARENT_REGISTRY_KEY,
  TWITTER_VERIFICATION_AUTHORITY,
  updateInstruction,
} from "@solana/spl-name-service";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { serialize } from "borsh";
import BN from "bn.js";

export async function getTwitterRegistryKey(
  handle: string,
  twitterRootParentRegistryKey?: PublicKey
): Promise<PublicKey> {
  const hashedTwitterHandle = await getHashedName(handle);
  const twitterHandleRegistryKey = await getNameAccountKey(
    hashedTwitterHandle,
    undefined,
    twitterRootParentRegistryKey
  );

  return twitterHandleRegistryKey;
}

export async function getTwitterRegistry(
  connection: Connection,
  twitter_handle: string,
  twitterRootParentRegistryKey: PublicKey = TWITTER_ROOT_PARENT_REGISTRY_KEY
): Promise<NameRegistryState> {
  const key = await getTwitterRegistryKey(
    twitter_handle,
    twitterRootParentRegistryKey
  );
  const registry = NameRegistryState.retrieve(connection, key);
  return registry;
}

export async function createVerifiedTwitterRegistry(
  connection: Connection,
  twitterHandle: string,
  verifiedPubkey: PublicKey,
  space: number, // The space that the user will have to write data into the verified registry
  payerKey: PublicKey,
  nameProgramId: PublicKey = NAME_PROGRAM_ID,
  twitterVerificationAuthority: PublicKey = TWITTER_VERIFICATION_AUTHORITY,
  twitterRootParentRegistryKey: PublicKey = TWITTER_ROOT_PARENT_REGISTRY_KEY
): Promise<TransactionInstruction[]> {
  // Create user facing registry
  const hashedTwitterHandle = await getHashedName(twitterHandle);
  const twitterHandleRegistryKey = await getNameAccountKey(
    hashedTwitterHandle,
    undefined,
    twitterRootParentRegistryKey
  );

  let instructions = [
    createInstruction(
      nameProgramId,
      SystemProgram.programId,
      twitterHandleRegistryKey,
      verifiedPubkey,
      payerKey,
      hashedTwitterHandle,
      new Numberu64(await connection.getMinimumBalanceForRentExemption(space)),
      new BN(space),
      undefined,
      twitterRootParentRegistryKey,
      twitterVerificationAuthority // Twitter authority acts as owner of the parent for all user-facing registries
    ),
  ];

  instructions = instructions.concat(
    await createReverseTwitterRegistry(
      connection,
      twitterHandle,
      twitterHandleRegistryKey,
      verifiedPubkey,
      payerKey,
      nameProgramId,
      twitterVerificationAuthority,
      twitterRootParentRegistryKey
    )
  );

  return instructions;
}

export async function createReverseTwitterRegistry(
  connection: Connection,
  twitterHandle: string,
  twitterRegistryKey: PublicKey,
  verifiedPubkey: PublicKey,
  payerKey: PublicKey,
  nameProgramId: PublicKey = NAME_PROGRAM_ID,
  twitterVerificationAuthority: PublicKey = TWITTER_VERIFICATION_AUTHORITY,
  twitterRootParentRegistryKey: PublicKey = TWITTER_ROOT_PARENT_REGISTRY_KEY
): Promise<TransactionInstruction[]> {
  // Create the reverse lookup registry
  const hashedVerifiedPubkey = await getHashedName(verifiedPubkey.toString());
  const reverseRegistryKey = await getNameAccountKey(
    hashedVerifiedPubkey,
    twitterVerificationAuthority,
    twitterRootParentRegistryKey
  );
  let reverseTwitterRegistryStateBuff = serialize(
    ReverseTwitterRegistryState.schema,
    new ReverseTwitterRegistryState({
      twitterRegistryKey: twitterRegistryKey.toBuffer(),
      twitterHandle,
    })
  );
  return [
    createInstruction(
      nameProgramId,
      SystemProgram.programId,
      reverseRegistryKey,
      verifiedPubkey,
      payerKey,
      hashedVerifiedPubkey,
      new Numberu64(
        await connection.getMinimumBalanceForRentExemption(
          reverseTwitterRegistryStateBuff.length
        )
      ),
      new BN(reverseTwitterRegistryStateBuff.length),
      twitterVerificationAuthority, // Twitter authority acts as class for all reverse-lookup registries
      twitterRootParentRegistryKey, // Reverse registries are also children of the root
      twitterVerificationAuthority
    ),
    updateInstruction(
      nameProgramId,
      reverseRegistryKey,
      new Numberu32(0),
      Buffer.from(reverseTwitterRegistryStateBuff),
      twitterVerificationAuthority,
      undefined
    ),
  ];
}
