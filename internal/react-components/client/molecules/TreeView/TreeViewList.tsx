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
        before:pointer-events-none
        before:absolute
        before:inset-0
        before:cursor-pointer
        before:rounded
        before:bg-slate-300/0
        before:transition-colors
        before:duration-150
        before:ease-in
        before:content-[""]
        hover:before:bg-slate-300/10
        focus:before:bg-slate-300/20
        active:before:bg-slate-300/40
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
                    [&[data-selected="true"]>:first-child]:before:bg-slate-300/20
                    [&[data-selected="true"]]:text-sky-500
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
                        hover:bg-slate-300/10
                        focus:bg-slate-300/20
                        active:bg-slate-300/40
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
