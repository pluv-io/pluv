import { cn } from "@pluv-internal/utils";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { oneLine } from "common-tags";
import type { CSSProperties, FC, MouseEvent, ReactNode } from "react";
import { NextLink } from "../../../src/atoms";

export interface TreeViewLinkProps {
    children?: ReactNode;
    className?: string;
    href: string;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
    rel?: string;
    selected?: boolean;
    style?: CSSProperties;
    target?: string;
}

export const TreeViewLink: FC<TreeViewLinkProps> = ({
    children,
    className,
    href,
    onClick,
    rel,
    selected = false,
    style,
    target,
}) => {
    return (
        <NavigationMenu.Item className={cn("flex flex-col items-stretch", className)} style={style}>
            <NavigationMenu.Link asChild>
                <NextLink
                    className={oneLine`
                        flex
                        h-8
                        cursor-pointer
                        flex-row
                        items-center
                        rounded
                        px-3
                        text-sm
                        text-slate-400
                        transition-colors
                        duration-150
                        ease-in
                        hover:bg-slate-300/10
                        hover:text-white
                        focus:bg-slate-300/20
                        focus:text-white
                        active:bg-slate-300/40
                        active:text-white
                        [&[data-selected="true"]]:bg-slate-300/20
                        [&[data-selected="true"]]:text-sky-500
                    `}
                    href={href}
                    onClick={onClick}
                    rel={rel}
                    target={target}
                    data-selected={selected}
                >
                    {children}
                </NextLink>
            </NavigationMenu.Link>
        </NavigationMenu.Item>
    );
};
