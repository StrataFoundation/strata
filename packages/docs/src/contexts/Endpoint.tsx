import React, {
  FC,
  ReactNode,
  createContext,
  useContext,
  useState,
} from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

export interface IEndpointProviderProps {
  children: ReactNode;
  initialEndpoint?: string;
}

export interface IEndpointContextState {
  endpoint: string;
  setEndpoint: (endpoint: string) => void;
}

const EndpointContext = createContext<IEndpointContextState>(
  {} as IEndpointContextState
);

const EndpointProvider: FC<IEndpointProviderProps> = ({
  children,
  initialEndpoint = "https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899",
}) => {
  const [endpoint, setEndpoint] = useState<string>(initialEndpoint);

  return (
    <EndpointContext.Provider value={{ endpoint, setEndpoint }}>
      {children}
    </EndpointContext.Provider>
  );
};

const useEndpoint = () => {
  const context = useContext(EndpointContext);
  if (context === undefined) {
    throw new Error("useEndpoint must be used within a EndpointProvider");
  }
  return context;
};

export { EndpointProvider, useEndpoint };
