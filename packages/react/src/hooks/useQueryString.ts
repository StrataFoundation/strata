import qs from "query-string";
import { useState, useCallback } from "react";
import { useInterval } from "./useInterval";

const setQueryStringWithoutPageReload = (qsValue: string) => {
  if (typeof window !== "undefined") {
    const newurl =
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname +
      qsValue;

    window.history.pushState({ path: newurl }, "", newurl);
  }
};

const setQueryStringValue = (
  key: string,
  value: string,
  queryString = window.location.search
) => {
  const values = qs.parse(queryString);
  const newQsValue = qs.stringify({ ...values, [key]: value });
  setQueryStringWithoutPageReload(`?${newQsValue}`);
};

export const getQueryStringValue = (
  key: string,
  queryString = typeof window !== "undefined" && window.location.search
) => {
  if (queryString) {
    const values = qs.parse(queryString);
    return values[key];
  }
};

export function useQueryString<A>(
  key: string,
  initialValue: A
): [A, (v: A) => void] {
  const [value, setValue] = useState(getQueryStringValue(key) || initialValue);
  useInterval(() => {
    const newValue = getQueryStringValue(key) as string
    if (newValue && newValue != value) {
      setValue(newValue);
    }
  }, 500)
  const onSetValue = useCallback(
    (newValue: any) => {
      setValue(newValue);
      setQueryStringValue(key, newValue);
    },
    [key]
  );

  return [value as A, onSetValue];
}
