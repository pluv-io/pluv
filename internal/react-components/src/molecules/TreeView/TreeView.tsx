import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { CSSProperties, FC, ReactNode } from "react";
import tw from "twin.macro";
import { TreeViewButton } from "./TreeViewButton";
import { TreeViewLink } from "./TreeViewLink";
import { TreeViewList } from "./TreeViewList";

export type { TreeViewButtonProps } from "./TreeViewButton";
export type { TreeViewLinkProps } from "./TreeViewLink";
export type { TreeViewListProps } from "./TreeViewList";

const Root = tw(NavigationMenu.List)`
    flex
    flex-col
    items-stretch
    gap-0.5
    p-0.5
`;

export interface TreeViewProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

const _TreeView: FC<TreeViewProps> = ({ children, className, style }) => {
    return (
        <NavigationMenu.Root asChild>
            <Root className={className} style={style}>
                {children}
            </Root>
        </NavigationMenu.Root>
    );
};

_TreeView.displayName = "TreeView";

export const TreeView = Object.assign(_TreeView, {
    Button: TreeViewButton,
    Link: TreeViewLink,
    List: TreeViewList,
});
