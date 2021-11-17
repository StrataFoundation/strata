import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import React from "react";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

interface IEndpointConext {
  endpoint: WalletAdapterNetwork;
  setEndpoint: (endpoint: WalletAdapterNetwork) => void;
}

const EndpointContext = React.createContext<IEndpointConext>({
  endpoint: clusterApiUrl(WalletAdapterNetwork.Devnet),
  setEndpoint: () => {},
});

export const EndpointProvider = ({
  children,
  initialEndpoint = clusterApiUrl(WalletAdapterNetwork.Devnet),
}: {
  children?: React.ReactNode;
  initialEndpoint: string;
}) => {
  const [stateEndpoint, setEndpoint] =
    React.useState<WalletAdapterNetwork>(initialEndpoint);
  return (
    <EndpointContext.Provider value={{ endpoint: stateEndpoint, setEndpoint }}>
      {children}
    </EndpointContext.Provider>
  );
};

export const useEndpoint = () => {
  return React.useContext(EndpointContext);
};
