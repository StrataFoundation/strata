import { AnchorProvider } from "@project-serum/anchor";
import { useContext } from "react";
import { ProviderContext } from "../contexts/providerContext";

/**
 * Get an anchor provider with signTransaction wrapped so that it hits the wallet adapter from wallet-adapter-react.
 *
 * @returns
 */
export function useProvider(): {
  provider?: AnchorProvider;
  awaitingApproval: boolean;
} {
  return useContext(ProviderContext);
}
