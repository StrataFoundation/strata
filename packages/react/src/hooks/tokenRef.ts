import { NameRegistryState } from "@bonfida/spl-name-service";
import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  ITokenBonding,
  TokenBondingV0,
} from "@strata-foundation/spl-token-bonding";
import {
  ITokenRef,
  SplTokenCollective,
} from "@strata-foundation/spl-token-collective";
import { AccountFetchCache } from "@strata-foundation/spl-utils";
import { useMemo } from "react";
import { useAsync } from "react-async-hook";
import { useTokenBonding, useTokenRef } from "../hooks";
import { useAccountFetchCache } from "../hooks/useAccountFetchCache";
import { getTwitterRegistryKey } from "../utils/nameServiceTwitter";
import { UseAccountState } from "./useAccount";
import { IUseTokenMetadataResult, useTokenMetadata } from "./useTokenMetadata";
import { deserializeUnchecked } from "borsh";

export async function getOwnerForName(
  cache: AccountFetchCache | undefined,
  handle: string | undefined,
  tld: PublicKey | undefined
): Promise<PublicKey | undefined> {
  const key = handle && await getTwitterRegistryKey(handle, tld);
  if (key && cache) {
    const [registry, dispose] = await cache.searchAndWatch(
      key,
      (pubkey, account) => {
        const info = deserializeUnchecked(
          NameRegistryState.schema,
          NameRegistryState,
          account.data
        );
        return {
          pubkey,
          account,
          info,
        };
      },
      true
    );
    setTimeout(dispose, 30 * 1000); // Keep this state around for 30s
  
    return registry?.info.owner;
  }
}

export async function getClaimedTokenRefKeyForName(
  cache: AccountFetchCache,
  handle: string,
  mint: PublicKey | undefined | null = undefined,
  tld: PublicKey
): Promise<PublicKey | undefined> {
  const owner = await getOwnerForName(cache, handle, tld);
  if (owner) {
    return (
      await SplTokenCollective.ownerTokenRefKey({
        owner,
        mint,
      })
    )[0];
  }
}
export async function getUnclaimedTokenRefKeyForName(
  handle: string,
  mint: PublicKey | undefined | null,
  tld: PublicKey | undefined
): Promise<PublicKey> {
  const name = await getTwitterRegistryKey(handle, tld);

  return (
    await SplTokenCollective.ownerTokenRefKey({
      name,
      mint: mint || SplTokenCollective.OPEN_COLLECTIVE_MINT_ID,
    })
  )[0];
}

export const useUnclaimedTokenRefKeyForName = (
  name: string | undefined | null,
  mint: PublicKey | undefined | null,
  tld: PublicKey | undefined
): { result: PublicKey | undefined; loading: boolean } => {
  const { connection } = useConnection();
  const { result: key, loading } = useAsync(
    async (
      name: string | undefined | null,
      mint: PublicKey | undefined | null,
      tld: PublicKey | undefined
    ) => {
      if (connection && name) {
        return getUnclaimedTokenRefKeyForName(name, mint, tld);
      }
    },
    [name, mint, tld]
  );
  return { result: key, loading };
};

export const useClaimedTokenRefKeyForName = (
  name: string | undefined | null,
  mint: PublicKey | undefined | null,
  tld: PublicKey | undefined
): { result: PublicKey | undefined; loading: boolean; error?: Error } => {
  const cache = useAccountFetchCache();
  const { result: key, loading, error } = useAsync(
    async (
      cache: AccountFetchCache | undefined,
      name: string | undefined | null,
      mint: PublicKey | undefined | null,
      tld: PublicKey | undefined
    ) => {
      if (cache && name && tld) {
        return getClaimedTokenRefKeyForName(cache, name, mint, tld);
      }
    },
    [cache, name, mint, tld]
  );
  return { result: key, loading, error };
};

export const useClaimedTokenRefKey = (
  owner: PublicKey | undefined | null,
  mint: PublicKey | undefined | null
): PublicKey | undefined => {
  const { result } = useAsync(
    async (owner: PublicKey | undefined | null) =>
      owner && SplTokenCollective.ownerTokenRefKey({ owner, mint }),
    [owner]
  );

  return result ? result[0] : undefined;
};

/**
 * Get a token ref from the bonding instance
 *
 * @param tokenBonding
 * @returns
 */
export function useTokenRefFromBonding(
  tokenBonding: PublicKey | undefined | null
): UseAccountState<ITokenRef> {
  const bonding = useTokenBonding(tokenBonding);
  const { result: key } = useAsync(
    async (bonding: TokenBondingV0 | undefined | null) =>
      bonding && SplTokenCollective.mintTokenRefKey(bonding.targetMint),
    [bonding.info]
  );
  return useTokenRef(key && key[0]);
}

/**
 * Given a social token mint, get the social token TokenRef
 *
 * @param mint
 * @returns
 */
export function useMintTokenRef(
  mint: PublicKey | undefined | null
): UseAccountState<ITokenRef> {
  const { result: key } = useAsync(
    async (mint: PublicKey | undefined | null) =>
      mint && SplTokenCollective.mintTokenRefKey(mint),
    [mint]
  );
  return useTokenRef(key && key[0]);
}

/**
 * Get the token ref for this wallet
 * @param owner
 * @returns
 */
export function usePrimaryClaimedTokenRef(
  owner: PublicKey | undefined | null
): UseAccountState<ITokenRef> {
  const key = useClaimedTokenRefKey(owner, null);
  return useTokenRef(key);
}

/**
 * Get a TokenRef using a twitter handle name service lookup on `name`. Searches for `name`, then grabs the owner.
 *
 * If the name is unclaimed, grabs the unclaimed token ref if it exists
 *
 * @param name
 * @param mint
 * @param tld
 * @returns
 */
export const useTokenRefForName = (
  name: string | undefined | null,
  mint: PublicKey | null,
  tld: PublicKey | undefined
): UseAccountState<ITokenRef> => {
  const { result: claimedKey, loading: twitterLoading, error } =
    useClaimedTokenRefKeyForName(name, mint, tld);
  if (error) {
    console.error(error)
  }
  const { result: unclaimedKey, loading: claimedLoading } =
    useUnclaimedTokenRefKeyForName(name, mint, tld);
  const claimed = useTokenRef(claimedKey);
  const unclaimed = useTokenRef(unclaimedKey);

  const result = useMemo(() => {
    if (claimed.info) {
      return claimed;
    }
    return unclaimed;
  }, [claimed?.info, unclaimed?.info, claimed.loading, unclaimed.loading]);
  const loading = useMemo(() => {
    return (
      twitterLoading ||
      claimedLoading ||
      claimed.loading ||
      unclaimed.loading
    );
  }, [
    twitterLoading,
    claimedLoading,
    claimed,
    unclaimed,
  ]);

  return {
    ...result,
    loading,
  };
};

export interface IUseSocialTokenMetadataResult extends IUseTokenMetadataResult {
  tokenBonding?: ITokenBonding;
  tokenRef?: ITokenRef;
}

/**
 * Get all metadata associated with a given wallet's social token.
 *
 * @param ownerOrTokenRef
 * @returns
 */
export function useSocialTokenMetadata(
  ownerOrTokenRef: PublicKey | undefined | null
): IUseSocialTokenMetadataResult {
  const { info: tokenRef1, loading: loading1 } =
    usePrimaryClaimedTokenRef(ownerOrTokenRef);
  const { info: tokenRef2, loading: loading2 } = useTokenRef(ownerOrTokenRef);
  const tokenRef = tokenRef1 || tokenRef2;
  const { info: tokenBonding, loading: loading3 } = useTokenBonding(
    tokenRef?.tokenBonding || undefined
  );

  return {
    ...useTokenMetadata(tokenBonding?.targetMint),
    tokenRef,
    tokenBonding,
    loading: loading1 || loading2 || loading3
  };
}
