export interface IRoute {
  path: string;
  params: string[];
}

export const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL;

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
  editMetadata: {
    path: "/edit-metadata",
    params: [],
  },
  sales: { path: "/sales", params: [] },
  newFixedPrice: { path: "/launchpad/fixed-price/new", params: [] },
  newLbc: { path: "/launchpad/lbcs/new", params: [] },
  tokenLbc: {
    path: "/lbcs/token-offering/:id", // key is expected to be either a mint or child entangler
    params: ["id"],
  },
  mintLbc: {
    path: "/lbcs/mint/:candyMachineId",
    params: ["candyMachineId"],
  },
  tokenLbcAdmin: {
    path:
      process.env.NEXT_PUBLIC_DOCS_URL + "/launchpad/admin/lbc",
    params: [],
  },
  fixedPriceAdmin: {
    path: process.env.NEXT_PUBLIC_DOCS_URL + "/launchpad/admin/fixed-price",
    params: [],
  },
  mintLbcAdmin: {
    path:
      process.env.NEXT_PUBLIC_DOCS_URL +
      "/launchpad/admin/dynamic-pricing-mint",
    params: [],
  },
  tokenOffering: {
    path: "/token-offering/:id",
    params: ["id"],
  },
  swap: { path: "/swap/:id", params: ["id"] },
  newFullyManaged: { path: "/launchpad/fully-managed/new", params: [] },
  newManual: { path: "/launchpad/manual/new", params: [] },
  launchpad: { path: "/launchpad", params: [] },
  create: { path: "/launchpad/create", params: [] },
  sell: { path: "/launchpad/sell", params: [] },
};

function rmUndefined(
  obj: Record<string, string | undefined>
): Record<string, string> {
  return Object.keys(obj).reduce((acc, key) => {
    if (typeof obj[key] !== "undefined") acc[key] = obj[key]!;
    return acc;
  }, {} as Record<string, string>);
}

export function route(
  route: IRoute,
  params: Record<string, string | undefined> = {}
): string {
  const subbed = route.params.reduce((acc, param) => {
    if (params[param]) {
      const ret = acc.replaceAll(`:${param}`, params[param]!);
      delete params[param];
      return ret;
    }
    return acc;
  }, route.path);

  const search = typeof window != "undefined" && window.location.search;
  const currQuery = new URLSearchParams(search || "");
  const cluster = currQuery.get("cluster");
  if (cluster && !params.cluster) {
    params.cluster = cluster;
  }
  const nextQuery = new URLSearchParams(rmUndefined(params)).toString();
  return subbed + (nextQuery ? `?${nextQuery}` : "");
}
