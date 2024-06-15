"use client";

import { TableOfContents } from "@pluv-internal/react-components/client";
import { SideBar } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { usePathname } from "next/navigation";
import { CSSProperties, ReactNode, memo } from "react";
import { DocsBreadcrumbs } from "../DocsBreadcrumbs";
import { DocsTreeViewNavigation } from "../DocsTreeViewNavigation";

export interface DocsLayoutProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const DocsLayout = memo<DocsLayoutProps>((props) => {
    const { children, className, style } = props;

    const pathName = usePathname();

    return (
        <div className={cn("inset-0 flex flex-row", className)} style={style}>
            <SideBar
                className={oneLine`
                    top-16
                    hidden
                    h-[calc(100vh-4rem)]
                    shrink-0
                    flex-col
                    items-stretch
                    overflow-y-auto
                    px-3
                    pt-8
                    xl:flex
                `}
            >
                <DocsTreeViewNavigation className="pb-6" />
            </SideBar>
            <div
                className={oneLine`
                    flex
                    min-w-0
                    grow
                    flex-row
                    items-start
                    justify-center
                    gap-2
                    px-2
                    py-8
                    sm:py-12
                    lg:gap-6
                    lg:px-6
                    xl:gap-8
                    xl:px-8
                `}
            >
                <main
                    id="docs-content"
                    className={oneLine`
                        flex
                        w-full
                        min-w-0
                        flex-col
                        items-stretch
                        lg:max-w-[80%]
                    `}
                >
                    <DocsBreadcrumbs className="mb-8" />
                    <div className="flex w-full flex-col items-start">{children}</div>
                </main>
                <TableOfContents
                    key={pathName}
                    className={oneLine`
                        sticky
                        top-28
                        hidden
                        max-h-[calc(100vh-12rem)]
                        w-72
                        shrink-0
                        overflow-auto
                        lg:flex
                    `}
                    intersection={{
                        rootMargin: "-56px 0% 0%",
                        threshold: 1,
                    }}
                    selector="#docs-content"
                />
            </div>
        </div>
    );
});

DocsLayout.displayName = "DocsLayout";
