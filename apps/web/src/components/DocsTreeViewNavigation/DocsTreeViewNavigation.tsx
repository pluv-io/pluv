"use client";

import { TreeView } from "@pluv-internal/react-components/client";
import { CSSProperties, MouseEvent, memo } from "react";
import docRoutes from "../../generated/doc-routes.json";
import { DocRoutes } from "../../types";
import { DocsTreeViewNavigationRoutes } from "./DocsTreeViewNavigationRoutes";

const routes: DocRoutes = docRoutes;

export interface DocsTreeViewNavigationProps {
    className?: string;
    onClickLink?: (event: MouseEvent<HTMLAnchorElement>) => void;
    style?: CSSProperties;
}

export const DocsTreeViewNavigation = memo<DocsTreeViewNavigationProps>((props) => {
    const { className, onClickLink, style } = props;

    return (
        <TreeView className={className} style={style}>
            <DocsTreeViewNavigationRoutes
                baseRoute="/docs"
                level={1}
                onClickLink={onClickLink}
                routes={routes}
                selected={true}
            />
        </TreeView>
    );
});

DocsTreeViewNavigation.displayName = "DocsTreeViewNavigation";
