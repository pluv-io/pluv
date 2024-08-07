import { ChevronDownIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { oneLine } from "common-tags";
import type { CSSProperties, FC, ReactNode } from "react";
import { NextLink, Pill } from "../../../either";

export interface BreadcrumbsItemProps {
    "aria-label"?: string;
    children?: ReactNode;
    className?: string;
    href: string;
    selected?: boolean;
    style?: CSSProperties;
    title?: string;
}

export const BreadcrumbsItem: FC<BreadcrumbsItemProps> = ({
    "aria-label": ariaLabel,
    children,
    className,
    href,
    selected = false,
    style,
    title,
}) => {
    return (
        <NavigationMenu.Item
            className={cn(
                oneLine`
                    flex
                    min-w-0
                    flex-row
                    items-center
                    gap-2
                    truncate
                    text-nowrap
                    [&:last-child>svg]:hidden
                `,
                className,
            )}
            style={style}
        >
            <NavigationMenu.Link asChild>
                <Pill
                    className={oneLine`
                        overflow-hidden
                        text-inherit
                    `}
                    title={title}
                    aria-label={ariaLabel}
                    data-selected={selected}
                >
                    <NextLink className="truncate" href={href}>
                        {children}
                    </NextLink>
                </Pill>
            </NavigationMenu.Link>
            <ChevronDownIcon className="shrink-0 -rotate-90" height={16} width={16} />
        </NavigationMenu.Item>
    );
};
