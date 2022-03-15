export interface IRoute {
  path: string;
  params: string[];
}

export const routes: Record<string, IRoute> = {
  bounties: { path: "/bounties", params: [] },
  newBounty: { path: "/launchpad/bounties/new", params: [] },
  bounty: {
    path: "/bounties/:mintKey",
    params: ["mintKey"],
  },
  editBounty: {
    path: "/bounties/:mintKey/edit",
    params: ["mintKey"],
  },
  sales: { path: "/sales", params: [] },
  newSale: { path: "/launchpad/sales/new", params: [] },
  sale: { path: "/sales/:mintKey", params: ["mintKey"] },
  newLbc: { path: "/launchpad/lbcs/new", params: [] },
  tokenLbc: {
    path: "/lbcs/token-offering/:mintKey",
    params: ["mintKey"],
  },
  tokenOffering: {
    path: "/token-offering/:mintKey",
    params: ["mintKey"],
  },
  swap: { path: "/swap/:mintKey", params: ["mintKey"] },
  newFullyManaged: { path: "/launchpad/fully-managed/new", params: [] },
  newManual: { path: "/launchpad/manual/new", params: [] },
  launchpad: { path: "/launchpad", params: [] },
  create: { path: "/launchpad/create", params: [] },
  sell: { path: "/launchpad/sell", params: [] },
};

export function route(route: IRoute, params?: Record<string, string | undefined>): string {
  return route.params.reduce((acc, param) => {
    if (params && params[param]) return acc.replaceAll(`:${param}`, params[param]!);
    return acc;
  }, route.path);
}
