import { TreeView } from "@pluv-internal/react-components";
import { CSSProperties, memo } from "react";
import docRoutes from "../../generated/doc-routes.json";
import { DocRoutes } from "../../types";
import { DocsTreeViewNavigationRoutes } from "./DocsTreeViewNavigationRoutes";

const routes: DocRoutes = docRoutes;

export interface DocsTreeViewNavigationProps {
    className?: string;
    style?: CSSProperties;
}

export const DocsTreeViewNavigation = memo<DocsTreeViewNavigationProps>(
    (props) => {
        const { className, style } = props;

        return (
            <TreeView className={className} style={style}>
                <DocsTreeViewNavigationRoutes
                    baseRoute="/docs"
                    routes={routes}
                />
            </TreeView>
        );
    }
);

DocsTreeViewNavigation.displayName = "DocsTreeViewNavigation";
