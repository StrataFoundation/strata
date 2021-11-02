import { useAsync } from "react-async-hook";
import { useProvider } from "./provider";

import { Provider } from "@project-serum/anchor";
import { SplTokenBonding } from "@wum.bo/spl-token-bonding";
import { SplTokenCollective } from "@wum.bo/spl-token-collective";

export type Programs = {
  tokenBondingSdk?: SplTokenBonding;
  tokenCollectiveSdk?: SplTokenCollective
}
async function getPrograms(provider: Provider): Promise<Programs> {
  const tokenCollective = await SplTokenCollective.init(provider);
  const tokenBonding = await SplTokenBonding.init(provider);
  return {
    tokenCollectiveSdk: tokenCollective,
    tokenBondingSdk: tokenBonding
  }
}

export function usePrograms(): Programs {
  const provider = useProvider();
  const { result: programs } = useAsync(() => getPrograms(provider), [provider]);

  return programs || {};
}
