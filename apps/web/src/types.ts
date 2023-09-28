export interface DocRouteNode {
    name: string;
    order: number;
    children: Record<string, DocRouteNode>;
}

export type DocRoutes = Record<string, DocRouteNode>;

export interface MetaJson {
    title: string;
    description: string;
}
