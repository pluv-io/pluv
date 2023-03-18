import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { CSSProperties, FC, ReactNode } from "react";
import tw from "twin.macro";
import { BreadcrumbsItem } from "./BreadcrumbsItem";

export type { BreadcrumbsItemProps } from "./BreadcrumbsItem";

const Root = tw(NavigationMenu.List)`
    flex
    flex-row
    items-center
    gap-2
    text-sm
`;

export interface BreadcrumbsProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

const _Breadcrumbs: FC<BreadcrumbsProps> = ({ children, className, style }) => {
    return (
        <NavigationMenu.Root asChild>
            <Root className={className} style={style}>
                {children}
            </Root>
        </NavigationMenu.Root>
    );
};

_Breadcrumbs.displayName = "Breadcrumbs";

export const Breadcrumbs = Object.assign(_Breadcrumbs, {
    Item: BreadcrumbsItem,
});
