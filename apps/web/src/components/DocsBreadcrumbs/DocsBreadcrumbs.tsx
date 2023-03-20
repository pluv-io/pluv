import { Breadcrumbs } from "@pluv-internal/react-components";
import { HomeIcon } from "@pluv-internal/react-icons";
import { get } from "@pluv-internal/utils";
import { useRouter } from "next/router";
import { CSSProperties, memo } from "react";
import docRoutes from "../../generated/doc-routes.json";
import { DocRoutes } from "../../types";

const routes: DocRoutes = docRoutes;

export interface DocsBreadcrumbsProps {
    className?: string;
    style?: CSSProperties;
}

export const DocsBreadcrumbs = memo<DocsBreadcrumbsProps>((props) => {
    const { className, style } = props;

    const router = useRouter();

    const slugs = router.pathname.replace(/^\/docs\//, "").split("/");

    return (
        <Breadcrumbs className={className} style={style}>
            <Breadcrumbs.Item href="/" title="Home" aria-label="Home">
                <HomeIcon height={16} width={16} />
            </Breadcrumbs.Item>
            {slugs.map((slug, i) => {
                const parts = slugs.slice(0, i + 1);

                return (
                    <Breadcrumbs.Item
                        key={slug}
                        href={parts.join("/")}
                        selected={i === slugs.length - 1}
                    >
                        {get(routes, `${parts.join(".children.")}.name`)}
                    </Breadcrumbs.Item>
                );
            })}
        </Breadcrumbs>
    );
});

DocsBreadcrumbs.displayName = "DocsBreadcrumbs";
