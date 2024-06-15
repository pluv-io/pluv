"use client";

import { Anchor } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { usePathname } from "next/navigation";
import type { FC } from "react";

export interface SiteWideAppBarPathLinksProps {
    className?: string;
}

export const SiteWideAppBarPathLinks: FC<SiteWideAppBarPathLinksProps> = ({ className }) => {
    const pathName = usePathname();

    return (
        <div
            className={cn(
                oneLine`
                    hidden
                    items-center
                    gap-6
                    md:flex
                `,
                className,
            )}
        >
            <Anchor
                className="text-inherit font-semibold hover:no-underline"
                href="/docs/introduction"
                data-selected={pathName === "/docs/introduction"}
            >
                Docs
            </Anchor>
            <Anchor
                className="text-inherit font-semibold hover:no-underline"
                href="/docs/quickstart"
                data-selected={pathName === "/docs/quickstart"}
            >
                Quickstart
            </Anchor>
        </div>
    );
};
