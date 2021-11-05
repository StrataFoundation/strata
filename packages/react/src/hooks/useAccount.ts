import { useState, useEffect } from "react";
import { PublicKey, AccountInfo } from "@solana/web3.js";
import { useAccountFetchCache } from "../hooks";
import { TypedAccountParser } from "@strata-foundation/spl-utils";

export interface ParsedAccountBase {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
  info: any; // TODO: change to unkown
}

export interface UseAccountState<T> {
  loading: boolean;
  account?: AccountInfo<Buffer>;
  info?: T;
}

/**
 * Generic hook to get a cached, auto updating, deserialized form of any Solana account. Massively saves on RPC usage by using
 * the spl-utils accountFetchCache.
 *
 * @param key 
 * @param parser 
 * @param isStatic 
 * @returns 
 */
export function useAccount<T>(
  key: undefined | PublicKey,
  parser?: TypedAccountParser<T>,
  isStatic: Boolean = false // Set if the accounts data will never change, optimisation to lower websocket usage.
): UseAccountState<T> {
  const cache = useAccountFetchCache();
  // @ts-ignore for helping to debug
  window.cache = cache;
  const [state, setState] = useState<UseAccountState<T>>({
    loading: true,
  });

  const parsedAccountBaseParser = (
    pubkey: PublicKey,
    data: AccountInfo<Buffer>
  ): ParsedAccountBase => {
    const info = parser && parser(pubkey, data);
    return {
      pubkey,
      account: data,
      info,
    };
  };

  const id = typeof key === "string" ? key : key?.toBase58();

  useEffect(() => {
    if (!id) {
      setState({ loading: false });
      return;
    } else {
      setState({ loading: true });
    }

    cache
      .searchAndWatch(id, parsedAccountBaseParser, isStatic)
      .then((acc) => {
        if (acc) {
          setState({
            loading: false,
            info: (parser && parser(acc.pubkey, acc!.account)) as any,
            account: acc.account,
          });
        } else {
          setState({ loading: false });
        }
      })
      .catch((e) => {
        console.error(e);
        setState({ loading: false });
      });

    const dispose = cache.emitter.onCache((e) => {
      const event = e;
      if (event.id === id && !event.isNew) {
        cache.query(id, parsedAccountBaseParser).then((acc) => {
          setState({
            loading: false,
            info: (parser && parser(acc.pubkey, acc!.account)) as any,
            account: acc!.account,
          });
        });
      }
    });
    return () => {
      dispose();
    };
  }, [cache, id]);

  return state;
}
