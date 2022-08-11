import {
  getHashedName,
  getNameAccountKey,
  NameRegistryState,
  ReverseTwitterRegistryState,
} from "@solana/spl-name-service";
import { useConnection } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useAccount } from "./useAccount";
import { getOwnerForName } from "./tokenRef";
import { useAccountFetchCache } from "./useAccountFetchCache";
import { deserialize } from "borsh";
import { useAsync } from "react-async-hook";

export async function reverseNameLookup(
  connection: Connection,
  owner: PublicKey,
  verifier?: PublicKey,
  tld?: PublicKey
): Promise<ReverseTwitterRegistryState> {
  const hashedName = await getHashedName(owner.toString());

  const key = await getNameAccountKey(hashedName, verifier, tld);

  const reverseAccount = await connection.getAccountInfo(key);
  if (!reverseAccount) {
    throw new Error("Invalid reverse account provided");
  }
  return deserialize(
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

  return (await reverseNameLookup(connection, owner, verifier, tld))
    .twitterHandle;
}

interface ReverseNameState {
  loading: boolean;
  nameString: string | undefined;
  error: Error | undefined;
}

async function getHashedNameNullable(
  owner: PublicKey | undefined
): Promise<Buffer | undefined> {
  if (!owner) {
    return undefined;
  }

  return getHashedName(owner.toString());
}

async function getNameAccountKeyNullable(
  hashedName: Buffer | undefined,
  verifier?: PublicKey,
  tld?: PublicKey
): Promise<PublicKey | undefined> {
  if (!hashedName) {
    return undefined;
  }

  return getNameAccountKey(hashedName, verifier, tld);
}

export function useReverseName(
  owner: PublicKey | undefined,
  verifier?: PublicKey,
  tld?: PublicKey
): ReverseNameState {
  const { connection } = useConnection();

  const {
    result: hashedName,
    error: nameError,
    loading: loading1,
  } = useAsync(getHashedNameNullable, [owner]);
  const {
    result: key,
    error: keyError,
    loading: loading2,
  } = useAsync(getNameAccountKeyNullable, [hashedName, verifier, tld]);
  const { info: reverseAccount } = useAccount(key, (key, acct) => {
    return deserialize(
      ReverseTwitterRegistryState.schema,
      ReverseTwitterRegistryState,
      acct.data.slice(NameRegistryState.HEADER_LEN)
    );
  });
  return {
    loading: loading1 || loading2,
    error: nameError || keyError,
    // @ts-ignore
    nameString: reverseAccount?.twitterHandle,
  };
}

interface NameState {
  loading: boolean;
  owner: PublicKey | undefined;
  error: Error | undefined;
}
export function useNameOwner(
  nameString: string | undefined,
  tld?: PublicKey
): NameState {
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
