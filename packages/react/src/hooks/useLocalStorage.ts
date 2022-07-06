import { useState, useCallback } from "react";
import { useInterval } from "./useInterval";

export function useLocalStorage<T>(
  key: string,
  defaultState: T
): [T, (newValue: T) => void] {
  const isBrowser: boolean = ((): boolean => typeof window !== "undefined")();
  const [valueRaw, setValueRaw] = useState<string | null>(() => {
    if (isBrowser) {
      return localStorage.getItem(key);
    }
    return typeof defaultState == "string" ? defaultState as string : JSON.stringify(defaultState);
  })
  const [value, setValue] = useState<T>(() => {
    if (isBrowser) {
      if (valueRaw) {
        // gross, but handling the case where T is a string
        let ret = valueRaw;
        try {
          ret = JSON.parse(valueRaw);
        } catch {
          // ignore
        }
        // @ts-ignore
        return ret as T
      }
    }
    return defaultState;
  });

  const setLocalStorage = useCallback(
    (newValue: T) => {
      if (newValue === value) return;
      setValue(newValue);
      setValueRaw(typeof newValue == "string" ? newValue : JSON.stringify(newValue));

      if (newValue === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newValue));
      }
    },
    [value, setValue, key]
  );

  useInterval(() => {
    if (isBrowser && localStorage.getItem(key) != valueRaw) {
      const value =
        typeof localStorage !== "undefined" && localStorage.getItem(key);
      if (value) {
        // gross, but handling the case where T is a string
        let ret = value;
        try {
          ret = JSON.parse(value);
        } catch {
          // ignore
        }

        setValueRaw(value);
        // @ts-ignore
        setValue(ret as T);
      }
    }
  }, 1000)

  return [value, setLocalStorage];
}
