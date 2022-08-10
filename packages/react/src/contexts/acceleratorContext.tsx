import { Accelerator } from "@strata-foundation/accelerator";
import React, { useContext, useMemo } from "react";
import { useAsync } from "react-async-hook";

export const AcceleratorContext = React.createContext<IAcceleratorReactState>({
  loading: true,
});

export interface IAcceleratorReactState {
  error?: Error;
  loading: boolean;
  accelerator?: Accelerator;
}

async function tryProm<A>(prom: Promise<A>): Promise<A | undefined> {
  try {
    return await prom;
  } catch (e) {
    console.error(e);
  }

  return undefined;
}

async function getSdk(url: string): Promise<Accelerator | undefined> {
  return tryProm(Accelerator.init(url));
}

export const AcceleratorProviderRaw: React.FC<React.PropsWithChildren<{ url: string }>> = ({
  children,
  url,
}) => {
  const { result, loading, error } = useAsync(getSdk, [url]);
  const sdks = useMemo(
    () => ({
      accelerator: result,
      error,
      loading,
    }),
    [result, loading, error]
  );

  return (
    <AcceleratorContext.Provider value={sdks}>
      {children}
    </AcceleratorContext.Provider>
  );
};

export const AcceleratorProvider: React.FC<React.PropsWithChildren<{ url: string }>> = ({
  children,
  url,
}) => {
  return <AcceleratorProviderRaw url={url}>{children}</AcceleratorProviderRaw>;
};

export const useAccelerator = (): IAcceleratorReactState => {
  return useContext(AcceleratorContext);
};
