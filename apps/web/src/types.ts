export interface DocRouteNode {
    name: string;
    children: Record<string, DocRouteNode>;
}

export type DocRoutes = Record<string, DocRouteNode>;
