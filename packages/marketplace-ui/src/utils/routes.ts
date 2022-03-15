export interface IRoute {
  path: string;
  params: string[];
  module: Module;
}

type Module = "launchpad" | "marketplace";

export const routes: Record<string, IRoute> = {
  bounties: { path: "/bounties", params: [], module: "marketplace" },
  newBounty: { path: "/bounties/new", params: [], module: "launchpad" },
  bounty: {
    path: "/bounties/:mintKey",
    params: ["mintKey"],
    module: "marketplace",
  },
  editBounty: {
    path: "/bounties/:mintKey/edit",
    params: ["mintKey"],
    module: "launchpad",
  },
  sales: { path: "/sales", params: [], module: "marketplace" },
  newSale: { path: "/sales/new", params: [], module: "launchpad" },
  sale: { path: "/sales/:mintKey", params: ["mintKey"], module: "marketplace" },
  newLbc: { path: "/lbcs/new", params: [], module: "launchpad" },
  tokenLbc: {
    path: "/lbcs/token-offering/:mintKey",
    params: ["mintKey"],
    module: "marketplace",
  },
  tokenOffering: {
    path: "/token-offering/:mintKey",
    params: ["mintKey"],
    module: "marketplace",
  },
  swap: { path: "/swap/:mintKey", params: ["mintKey"], module: "marketplace" },
};

const MARKETPLACE_URI = process.env.NEXT_PUBLIC_MARKETPLACE_URI || "";
const LAUNCHPAD_URI = process.env.NEXT_PUBLIC_LAUNCHPAD_URI || "";
export function route(route: IRoute, params: Record<string, string | undefined>): string {
  const relativeRoute = route.params.reduce((acc, param) => {
    if (params[param]) return acc.replaceAll(`:${param}`, params[param]!);
    return acc;
  }, route.path);

  const prefix = route.module === "marketplace" ? MARKETPLACE_URI : LAUNCHPAD_URI;

  return prefix + relativeRoute;
}
