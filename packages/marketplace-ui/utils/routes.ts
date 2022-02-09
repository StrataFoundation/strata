export interface IRoute {
  path: string;
  params: string[];
}

export const routes = {
  bounties: { path: "/bounties", params: [] },
  newBounty: { path: "/bounties/new", params: [] },
  bounty: { path: "/bounties/:mintKey", params: ["mintKey"] },
};

export function route(route: IRoute, params: Record<string, string>): string {
  return route.params.reduce((acc, param) => {
    return acc.replaceAll(`:${param}`, params[param]);
  }, route.path);
}
