import { TreeView } from "@pluv-internal/react-components";
import { CSSProperties, memo } from "react";

export interface DocsTreeViewNavigationProps {
    className?: string;
    style?: CSSProperties;
}

export const DocsTreeViewNavigation = memo<DocsTreeViewNavigationProps>(
    (props) => {
        const { className, style } = props;

        return <TreeView className={className} style={style} />;
    }
);

DocsTreeViewNavigation.displayName = "DocsTreeViewNavigation";
