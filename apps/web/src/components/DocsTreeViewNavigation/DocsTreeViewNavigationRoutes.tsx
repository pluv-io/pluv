import { TreeView } from "@pluv-internal/react-components";
import { FC } from "react";
import { DocRouteNode } from "../../types";

export interface DocsTreeViewNavigationRoutesProps {
    baseRoute?: string;
    routes: Record<string, DocRouteNode>;
}

export const DocsTreeViewNavigationRoutes: FC<
    DocsTreeViewNavigationRoutesProps
> = ({ baseRoute = "", routes }) => {
    return (
        <>
            {Object.entries(routes).map(([slug, node]) =>
                Object.keys(node.children).length ? (
                    <TreeView.List
                        key={slug}
                        content={
                            <DocsTreeViewNavigationRoutes
                                baseRoute={`${baseRoute}/${slug}`}
                                routes={node.children}
                            />
                        }
                        href={`${baseRoute}/${slug}`}
                    >
                        {node.name}
                    </TreeView.List>
                ) : (
                    <TreeView.Link key={slug} href={`${baseRoute}/${slug}`}>
                        {node.name}
                    </TreeView.Link>
                )
            )}
        </>
    );
};
