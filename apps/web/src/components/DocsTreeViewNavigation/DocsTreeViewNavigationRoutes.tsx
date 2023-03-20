import { TreeView } from "@pluv-internal/react-components";
import { useRouter } from "next/router";
import { FC, useMemo } from "react";
import { DocRouteNode } from "../../types";

export interface DocsTreeViewNavigationRoutesProps {
    baseRoute?: string;
    routes: Record<string, DocRouteNode>;
}

export const DocsTreeViewNavigationRoutes: FC<
    DocsTreeViewNavigationRoutesProps
> = ({ baseRoute = "", routes }) => {
    const router = useRouter();

    const slugs = useMemo(() => {
        return router.pathname
            .replace(new RegExp(`^${baseRoute}`), "")
            .replace(/^\//, "")
            .split("/");
    }, [baseRoute, router.pathname]);

    const [currentSlug] = slugs;
    const finalSlug = slugs.at(-1);

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
                        defaultOpen={currentSlug === slug}
                        href={`${baseRoute}/${slug}`}
                        selected={finalSlug === slug}
                    >
                        {node.name}
                    </TreeView.List>
                ) : (
                    <TreeView.Link
                        key={slug}
                        href={`${baseRoute}/${slug}`}
                        selected={finalSlug === slug}
                    >
                        {node.name}
                    </TreeView.Link>
                )
            )}
        </>
    );
};
