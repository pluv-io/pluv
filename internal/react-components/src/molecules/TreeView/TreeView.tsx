import { cn } from "@pluv-internal/utils";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { oneLine } from "common-tags";
import type { CSSProperties, FC, ReactNode } from "react";
import { TreeViewButton } from "./TreeViewButton";
import { TreeViewLink } from "./TreeViewLink";
import { TreeViewList } from "./TreeViewList";

export type { TreeViewButtonProps } from "./TreeViewButton";
export type { TreeViewLinkProps } from "./TreeViewLink";
export type { TreeViewListProps } from "./TreeViewList";

export interface TreeViewProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

const _TreeView: FC<TreeViewProps> = ({ children, className, style }) => {
    return (
        <NavigationMenu.Root asChild>
            <NavigationMenu.List
                className={cn(
                    oneLine`
                        flex
                        flex-col
                        items-stretch
                        gap-0.5
                        p-0.5
                    `,
                    className,
                )}
                style={style}
            >
                {children}
            </NavigationMenu.List>
        </NavigationMenu.Root>
    );
};

_TreeView.displayName = "TreeView";

export const TreeView = Object.assign(_TreeView, {
    Button: TreeViewButton,
    Link: TreeViewLink,
    List: TreeViewList,
});
