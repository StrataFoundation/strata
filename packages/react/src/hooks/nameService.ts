import {
  getHashedName,
  getNameAccountKey,
  NameRegistryState, ReverseTwitterRegistryState
} from "@bonfida/spl-name-service";
import { useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  getOwnerForName,
  useAccountFetchCache
} from ".";
import { deserializeUnchecked } from "borsh";
import { useAsync } from "react-async-hook";

export async function reverseNameLookup(
  connection: Connection,
  owner: PublicKey,
  verifier?: PublicKey,
  tld?: PublicKey
): Promise<ReverseTwitterRegistryState> {
  const hashedName = await getHashedName(owner.toString());

  const key = await getNameAccountKey(
    hashedName,
    verifier,
    tld
  );

  const reverseAccount = await connection.getAccountInfo(key);
  if (!reverseAccount) {
    throw new Error("Invalid reverse account provided");
  }
  return deserializeUnchecked(
    ReverseTwitterRegistryState.schema,
    ReverseTwitterRegistryState,
    reverseAccount.data.slice(NameRegistryState.HEADER_LEN)
  );
}

async function getNameString(
  connection: Connection,
  owner: PublicKey | undefined,
  verifier?: PublicKey,
  tld?: PublicKey
) {
  if (!owner) {
    return;
  }

  return (await reverseNameLookup(connection, owner, verifier, tld)).twitterHandle;
}

interface ReverseNameState {
  loading: boolean;
  nameString: string | undefined;
  error: Error | undefined;
}
export function useReverseName(
  owner: PublicKey | undefined,
  verifier?: PublicKey,
  tld?: PublicKey
): ReverseNameState {
  const { connection } = useConnection();
  const {
    loading,
    error,
    result: handle,
  } = useAsync(getNameString, [connection, owner, verifier, tld]);

  return {
    loading,
    error: error?.message?.includes("Invalid reverse account provided")
      ? undefined
      : error,
    nameString: handle,
  };
}

interface NameState {
  loading: boolean;
  owner: PublicKey | undefined;
  error: Error | undefined;
}
export function useNameOwner(nameString: string | undefined, tld?: PublicKey): NameState {
  const cache = useAccountFetchCache();
  const {
    loading,
    error,
    result: owner,
  } = useAsync(getOwnerForName, [cache || undefined, nameString, tld]);

  return {
    loading,
    error,
    owner,
  };
}
