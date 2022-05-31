export interface IRoute {
  path: string;
  params: string[];
}

export const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL;

export const routes: Record<string, IRoute> = {
  chats: { path: "/", params: [] },
  chat: {
    path: "/chats/:id",
    params: ["id"],
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
