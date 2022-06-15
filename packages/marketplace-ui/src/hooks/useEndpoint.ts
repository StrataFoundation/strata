import { useQueryString } from "@strata-foundation/react";
import { DEFAULT_ENDPOINT } from "../components";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";

export interface IClusterState {
  cluster: WalletAdapterNetwork | "localnet";
  endpoint: string;
  setClusterOrEndpoint: (clusterOrEndpoint: string) => void;
}

const shortnames = new Set([
  "localnet",
  ...Object.values(WalletAdapterNetwork).map((v) => v.toString()),
]);

export function getClusterAndEndpoint(clusterOrEndpoint: string): {
  cluster: string;
  endpoint: string;
} {
  if (clusterOrEndpoint) {
    if (clusterOrEndpoint.startsWith("http")) {
      if (clusterOrEndpoint.includes("dev")) {
        return { cluster: "devnet", endpoint: clusterOrEndpoint };
      } else {
        return { cluster: "mainnet-beta", endpoint: clusterOrEndpoint };
      }
    } else if (shortnames.has(clusterOrEndpoint)) {
      if (clusterOrEndpoint === "localnet") {
        return {
          cluster: "localnet",
          endpoint: clusterApiUrl(clusterOrEndpoint as WalletAdapterNetwork),
        };
      } else if (clusterOrEndpoint === "devnet") {
        return {
          cluster: "devnet",
          endpoint: "https://devnet.genesysgo.net/",
        };
      } else if (clusterOrEndpoint === "mainnet-beta") {
        return {
          cluster: "mainnet-beta",
          endpoint: "https://strataprotocol.genesysgo.net",
        };
      }

      return {
        cluster: clusterOrEndpoint,
        endpoint: "http://localhost:8899",
      };
    }
  }

  return { cluster: "mainnet-beta", endpoint: DEFAULT_ENDPOINT };
}

export function useEndpoint(): IClusterState {
  const [clusterOrEndpoint, setCluster] = useQueryString(
    "cluster",
    DEFAULT_ENDPOINT
  );

  const { cluster: actualCluster, endpoint } = useMemo(
    () => getClusterAndEndpoint(clusterOrEndpoint),
    [clusterOrEndpoint]
  );

  return {
    cluster: actualCluster as WalletAdapterNetwork,
    endpoint,
    setClusterOrEndpoint: setCluster,
  };
}
