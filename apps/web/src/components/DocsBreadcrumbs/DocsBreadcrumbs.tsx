"use client";

import { Breadcrumbs } from "@pluv-internal/react-components/client";
import { HomeIcon } from "@pluv-internal/react-icons";
import { get } from "@pluv-internal/utils";
import { usePathname } from "next/navigation";
import { CSSProperties, memo, useCallback } from "react";
import docRoutes from "../../generated/doc-routes.json";
import { DocRoutes } from "../../types";

const routes: DocRoutes = docRoutes;

export interface DocsBreadcrumbsProps {
    className?: string;
    style?: CSSProperties;
}

export const DocsBreadcrumbs = memo<DocsBreadcrumbsProps>((props) => {
    const { className, style } = props;

    const pathName = usePathname();

    const slugs = pathName
        .replace(/#.+$/g, "")
        .replace(/^(\/)?docs(\/)?/, "")
        .split("/")
        .filter((slug) => !!slug);

    const getName = useCallback((slugs: string[]): string | null => {
        const [head, ...tail] = slugs;

        const path = [head, ...tail.map((part) => `[${part}]`)].join("[children]");

        return get(routes, `${path}[name]`) ?? null;
    }, []);

    return (
        <Breadcrumbs className={className} style={style}>
            <Breadcrumbs.Item href="/" title="Home" aria-label="Home">
                <HomeIcon height={16} width={16} />
            </Breadcrumbs.Item>
            {slugs.map((slug, i) => {
                const parts = slugs.slice(0, i + 1);

                return (
                    <Breadcrumbs.Item key={slug} href={`/docs/${parts.join("/")}`} selected={i === slugs.length - 1}>
                        {getName(parts)}
                    </Breadcrumbs.Item>
                );
            })}
        </Breadcrumbs>
    );
});

DocsBreadcrumbs.displayName = "DocsBreadcrumbs";
