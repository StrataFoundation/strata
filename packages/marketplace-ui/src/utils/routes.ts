export interface IRoute {
  path: string;
  params: string[];
}

export const routes = {
  bounties: { path: "/bounties", params: [] },
  newBounty: { path: "/bounties/new", params: [] },
  bounty: { path: "/bounties/:mintKey", params: ["mintKey"] },
  editBounty: { path: "/bounties/:mintKey/edit", params: ["mintKey"] },
  sales: { path: "/sales", params: [] },
  newSale: { path: "/sales/new", params: [] },
  sale: { path: "/sales/:mintKey", params: ["mintKey"] },
  newLbc: { path: "/lbcs/new", params: [] },
  tokenLbc: { path: "/lbcs/token-offering/:mintKey", params: ["mintKey"] },
  tokenOffering: { path: "/token-offering/:mintKey", params: ["mintKey"] },
  swap: { path: "/swap/:mintKey", params: ["mintKey"] },
};

export function route(route: IRoute, params: Record<string, string | undefined>): string {
  return route.params.reduce((acc, param) => {
    if (params[param]) return acc.replaceAll(`:${param}`, params[param]!);
    return acc;
  }, route.path);
}
