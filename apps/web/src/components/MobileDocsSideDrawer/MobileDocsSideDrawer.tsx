"use client";

import { SideDrawer } from "@pluv-internal/react-components/client";
import { Button, LogoIcon, NextLink } from "@pluv-internal/react-components/either";
import { XIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties, FC, MouseEvent } from "react";
import { DocsTreeViewNavigation } from "../DocsTreeViewNavigation";

export interface MobileDocsSideDrawerProps {
    className?: string;
    onClickLink?: (event: MouseEvent<HTMLAnchorElement>) => void;
    style?: CSSProperties;
}

export const MobileDocsSideDrawer: FC<MobileDocsSideDrawerProps> = ({ className, onClickLink, style }) => {
    return (
        <SideDrawer
            className={cn(
                oneLine`
                    flex
                    flex-col
                    items-stretch
                    [&>:last-child]:min-h-0
                    [&>:last-child]:grow
                    [&>:last-child]:overflow-y-auto
                `,
                className,
            )}
            style={style}
        >
            <div
                className={oneLine`
                    flex
                    shrink-0
                    flex-row
                    items-center
                    justify-between
                    px-4
                    py-2
                `}
            >
                <NextLink className="flex items-center gap-1.5" href="/">
                    <LogoIcon className="rounded-md" height={36} width={36} />
                    <span className="text-lg font-bold">pluv.io</span>
                </NextLink>
                <SideDrawer.Close>
                    <Button size="icon" type="button" variant="outline">
                        <XIcon height={24} width={24} />
                    </Button>
                </SideDrawer.Close>
            </div>
            <DocsTreeViewNavigation onClickLink={onClickLink} />
        </SideDrawer>
    );
};
