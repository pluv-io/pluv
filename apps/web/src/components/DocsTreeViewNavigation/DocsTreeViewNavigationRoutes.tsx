import { TreeView } from "@pluv-internal/react-components";
import { useRouter } from "next/router";
import { FC, useMemo } from "react";
import { DocRouteNode } from "../../types";

export interface DocsTreeViewNavigationRoutesProps {
    baseRoute?: string;
    level: number;
    routes: Record<string, DocRouteNode>;
    selected?: boolean;
}

export const DocsTreeViewNavigationRoutes: FC<
    DocsTreeViewNavigationRoutesProps
> = ({ baseRoute = "", level, routes, selected }) => {
    const router = useRouter();

    const sorted = useMemo(() => {
        const startsWithAZ = (word: string): boolean => /^[a-z]/i.test(word);

        return Object.entries(routes).sort(([, a], [, b]) => {
            if (!startsWithAZ(a.name) && startsWithAZ(b.name)) return 1;
            if (startsWithAZ(a.name) && !startsWithAZ(b.name)) return -1;

            return a.name.localeCompare(b.name);
        });
    }, [routes]);

    const slugs = useMemo(() => {
        return router.asPath
            .replace(/#.+$/g, "")
            .replace(new RegExp(`^${baseRoute}`), "")
            .replace(/^\//, "")
            .split("/");
    }, [baseRoute, router.asPath]);

    const routeSlug = useMemo(
        () => router.asPath.split("/")[level + 1],
        [level, router.asPath]
    );

    const finalSlug = slugs.at(-1);

    return (
        <>
            {sorted.map(([slug, node]) =>
                Object.keys(node.children).length ? (
                    <TreeView.List
                        key={slug}
                        content={
                            <DocsTreeViewNavigationRoutes
                                baseRoute={`${baseRoute}/${slug}`}
                                level={level + 1}
                                routes={node.children}
                                selected={selected && routeSlug === slug}
                            />
                        }
                        defaultOpen
                        href={`${baseRoute}/${slug}`}
                        selected={finalSlug === slug}
                    >
                        {node.name}
                    </TreeView.List>
                ) : (
                    <TreeView.Link
                        key={slug}
                        href={`${baseRoute}/${slug}`}
                        selected={selected && finalSlug === slug}
                    >
                        {node.name}
                    </TreeView.Link>
                )
            )}
        </>
    );
};
