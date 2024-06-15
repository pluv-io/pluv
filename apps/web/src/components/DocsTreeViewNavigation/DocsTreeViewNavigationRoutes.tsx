import { TreeView } from "@pluv-internal/react-components/client";
import { usePathname } from "next/navigation";
import { FC, MouseEvent, useMemo } from "react";
import { DocRouteNode } from "../../types";

export interface DocsTreeViewNavigationRoutesProps {
    baseRoute?: string;
    level: number;
    onClickLink?: (event: MouseEvent<HTMLAnchorElement>) => void;
    routes: Record<string, DocRouteNode>;
    selected?: boolean;
}

export const DocsTreeViewNavigationRoutes: FC<DocsTreeViewNavigationRoutesProps> = ({
    baseRoute = "",
    level,
    onClickLink,
    routes,
    selected,
}) => {
    const pathName = usePathname();

    const sorted = useMemo(() => {
        const startsWithAZ = (word: string): boolean => /^[a-z]/i.test(word);

        return Object.entries(routes).sort(([, a], [, b]) => {
            if (!startsWithAZ(a.name) && startsWithAZ(b.name)) return 1;
            if (startsWithAZ(a.name) && !startsWithAZ(b.name)) return -1;

            const orderSort = a.order - b.order;

            return orderSort || a.name.localeCompare(b.name);
        });
    }, [routes]);

    const slugs = useMemo(() => {
        return pathName
            .replace(/#.+$/g, "")
            .replace(new RegExp(`^${baseRoute}`), "")
            .replace(/^\//, "")
            .split("/");
    }, [baseRoute, pathName]);

    const routeSlug = useMemo(() => pathName.split("/")[level + 1], [level, pathName]);

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
                                onClickLink={onClickLink}
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
                        onClick={onClickLink}
                        selected={selected && finalSlug === slug}
                    >
                        {node.name}
                    </TreeView.Link>
                ),
            )}
        </>
    );
};
