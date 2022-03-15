export interface IRoute {
  path: string;
  params: string[];
  module: Module;
}

enum Module {
  Marketplace = "marketplace",
  Launchpad = "launchpad",
};

export const routes: Record<string, IRoute> = {
  bounties: { path: "/bounties", params: [], module: Module.Marketplace },
  newBounty: { path: "/bounties/new", params: [], module: Module.Launchpad },
  bounty: {
    path: "/bounties/:mintKey",
    params: ["mintKey"],
    module: Module.Marketplace,
  },
  editBounty: {
    path: "/bounties/:mintKey/edit",
    params: ["mintKey"],
    module: Module.Launchpad,
  },
  sales: { path: "/sales", params: [], module: Module.Marketplace },
  newSale: { path: "/sales/new", params: [], module: Module.Launchpad },
  sale: { path: "/sales/:mintKey", params: ["mintKey"], module: Module.Marketplace },
  newLbc: { path: "/lbcs/new", params: [], module: Module.Launchpad },
  tokenLbc: {
    path: "/lbcs/token-offering/:mintKey",
    params: ["mintKey"],
    module: Module.Marketplace,
  },
  tokenOffering: {
    path: "/token-offering/:mintKey",
    params: ["mintKey"],
    module: Module.Marketplace,
  },
  swap: { path: "/swap/:mintKey", params: ["mintKey"], module: Module.Marketplace },
};

const MARKETPLACE_URI = process.env.NEXT_PUBLIC_MARKETPLACE_URI || "";
const LAUNCHPAD_URI = process.env.NEXT_PUBLIC_LAUNCHPAD_URI || "";
export function route(route: IRoute, params: Record<string, string | undefined>): string {
  const relativeRoute = route.params.reduce((acc, param) => {
    if (params[param]) return acc.replaceAll(`:${param}`, params[param]!);
    return acc;
  }, route.path);

  const prefix = route.module === Module.Marketplace ? MARKETPLACE_URI : LAUNCHPAD_URI;

  return prefix + relativeRoute;
}
