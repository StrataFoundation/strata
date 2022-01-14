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
  key: null | undefined | PublicKey,
  parser?: TypedAccountParser<T>,
  isStatic: Boolean = false // Set if the accounts data will never change, optimisation to lower websocket usage.
): UseAccountState<T> {
  const cache = useAccountFetchCache();
  const [state, setState] = useState<UseAccountState<T>>({
    loading: true,
  });
  const parsedAccountBaseParser = (
    pubkey: PublicKey,
    data: AccountInfo<Buffer>
  ): ParsedAccountBase => {
    const info = parser!(pubkey, data);
    return {
      pubkey,
      account: data,
      info,
    };
  };

  const id = typeof key === "string" ? key : key?.toBase58();

  useEffect(() => {
    // Occassionally, dispose can get called while the cache promise is still going.
    // In that case, we want to dispose immediately.
    let shouldDisposeImmediately = false;
    let disposeWatch = () => {
      shouldDisposeImmediately = true;
    };

    if (!id || !cache) {
      setState({ loading: false });
      return;
    } else {
      setState({ loading: true });
    }

    cache
      .searchAndWatch(id, parser ? parsedAccountBaseParser : undefined, isStatic)
      .then(([acc, dispose]) => {
        if (shouldDisposeImmediately) {
          dispose();
          shouldDisposeImmediately = false;
        }
        disposeWatch = dispose;
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

    const disposeEmitter = cache.emitter.onCache((e) => {
      const event = e;
      if (event.id === id) {
        cache.search(id, parser ? parsedAccountBaseParser : undefined).then((acc) => {
          if (acc && acc.account != state.account) {
            setState({
              loading: false,
              info: (parser && parser(acc.pubkey, acc!.account)) as any,
              account: acc!.account,
            });
          }
        });
      }
    });
    return () => {
      disposeEmitter();
      setTimeout(disposeWatch, 30 * 1000); // Keep cached accounts around for 30s in case a rerender is causing reuse
    };
  }, [cache, id, !parser]); // only trigger on change to parser if it wasn't defined before.

  return state;
}
