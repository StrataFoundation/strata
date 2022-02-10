export interface IRoute {
  path: string;
  params: string[];
}

export const routes = {
  bounties: { path: "/bounties", params: [] },
  newBounty: { path: "/bounties/new", params: [] },
  bounty: { path: "/bounties/:mintKey", params: ["mintKey"] },
  editBounty: { path: "/bounties/:mintKey/edit", params: ["mintKey"] },
};

export function route(route: IRoute, params: Record<string, string | undefined>): string {
  return route.params.reduce((acc, param) => {
    if (params[param]) return acc.replaceAll(`:${param}`, params[param]!);
    return acc;
  }, route.path);
}
