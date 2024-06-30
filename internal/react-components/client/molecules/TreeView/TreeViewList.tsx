import { ChevronDownIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { oneLine } from "common-tags";
import { m } from "framer-motion";
import type { CSSProperties, FC, ReactNode } from "react";
import { useState } from "react";
import { NextLink } from "../../../either";

export interface TreeViewListProps {
    children?: ReactNode;
    className?: string;
    content?: ReactNode;
    defaultOpen?: boolean;
    href?: string;
    selected?: boolean;
    style?: CSSProperties;
}

export const TreeViewList: FC<TreeViewListProps> = ({
    children,
    className,
    content,
    defaultOpen = false,
    href,
    selected = false,
    style,
}) => {
    const [open, setOpen] = useState<boolean>(defaultOpen);

    const childStyle = oneLine`
        flex
        grow
        cursor-pointer
        flex-row
        items-center
        px-3
        font-semibold
    `;

    const child = href ? (
        <NavigationMenu.Link asChild>
            <NextLink
                className={childStyle}
                href={href}
                onClick={(e) => {
                    e.stopPropagation();
                }}
            >
                {children}
            </NextLink>
        </NavigationMenu.Link>
    ) : (
        <button className={childStyle} type="button">
            {children}
        </button>
    );

    return (
        <NavigationMenu.Item className={cn("flex flex-col items-stretch", className)} style={style}>
            <div
                className={oneLine`
                    relative
                    flex
                    h-8
                    flex-row
                    items-stretch
                    rounded
                    bg-accent/0
                    transition-colors
                    duration-150
                    ease-in
                    hover:bg-accent
                    hover:text-accent-foreground
                    focus:bg-accent
                    focus:text-accent-foreground
                    active:bg-accent
                    active:text-accent-foreground
                    [&[data-selected="true"]>:first-child]:before:bg-accent
                    [&[data-selected="true"]]:text-sky-600
                `}
                onClick={() => {
                    setOpen((oldOpen) => !oldOpen);
                }}
                data-selected={selected}
            >
                {child}
                <button
                    className={oneLine`
                        flex
                        w-8
                        items-center
                        justify-center
                        rounded
                        [&[aria-expanded="true"]>:first-child]:rotate-0
                    `}
                    aria-expanded={open || selected}
                >
                    <ChevronDownIcon
                        className={oneLine`
                            -rotate-90
                            transition
                            duration-150
                            ease-linear
                        `}
                        height={24}
                        width={24}
                    />
                </button>
            </div>
            <m.ul
                className={oneLine`
                    mt-0.5
                    flex
                    flex-col
                    items-stretch
                    gap-0.5
                    overflow-y-clip
                    pl-3
                `}
                animate={open ? "open" : "default"}
                initial={false}
                variants={{
                    default: { height: 0 },
                    open: { height: "auto" },
                }}
            >
                {content}
            </m.ul>
        </NavigationMenu.Item>
    );
};
