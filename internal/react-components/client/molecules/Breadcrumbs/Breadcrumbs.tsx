import { cn } from "@pluv-internal/utils";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import type { CSSProperties, FC, ReactNode } from "react";
import { BreadcrumbsItem } from "./BreadcrumbsItem";

export type { BreadcrumbsItemProps } from "./BreadcrumbsItem";

export interface BreadcrumbsProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

const _Breadcrumbs: FC<BreadcrumbsProps> = ({ children, className, style }) => {
    return (
        <NavigationMenu.Root asChild>
            <NavigationMenu.List className={cn("flex flex-row items-center gap-2 text-sm", className)} style={style}>
                {children}
            </NavigationMenu.List>
        </NavigationMenu.Root>
    );
};

_Breadcrumbs.displayName = "Breadcrumbs";

export const Breadcrumbs = Object.assign(_Breadcrumbs, {
    Item: BreadcrumbsItem,
});
