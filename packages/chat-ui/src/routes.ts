import { SITE_URL } from "./constants/globals";

export interface IRoute {
  path: string;
  params: string[];
}

export const routes: Record<string, IRoute> = {
  landing: { path: "/", params: [] },
  chats: {
    path: "/c",
    params: []
  },
  chat: {
    path: "/c/:id",
    params: ["id"],
  },
  fullyManagedLaunchpad: {
    path: `${SITE_URL}/launchpad/full-managed/new`,
    params: [],
  },
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
