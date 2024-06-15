import { AppBar } from "@pluv-internal/react-components/client";
import { AnchorButton, LogoIcon, NextLink } from "@pluv-internal/react-components/either";
import { GitHubIcon, NpmIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties } from "react";
import { memo } from "react";
import { SiteWideAppBarPathLinks } from "./SiteWideAppBarPathLinks";
import { SiteWideAppBarSideDrawer } from "./SiteWideAppBarSideDrawer";

export interface SiteWideAppBarProps {
    className?: string;
    style?: CSSProperties;
}

export const SiteWideAppBar = memo<SiteWideAppBarProps>((props) => {
    const { className, style } = props;

    return (
        <AppBar
            className={cn(
                oneLine`
                    flex
                    flex-row
                    items-stretch
                    justify-center
                `,
                className,
            )}
            style={style}
        >
            <div
                className={oneLine`
                    flex
                    w-full
                    items-center
                    justify-between
                    2xl:max-w-screen-2xl
                `}
            >
                <div className="flex items-center">
                    <SiteWideAppBarSideDrawer className="mr-3" />
                    <NextLink className="flex items-center gap-1.5" href="/">
                        <LogoIcon className="rounded-md" height={36} width={36} />
                        <span className="text-lg font-bold">pluv.io</span>
                    </NextLink>
                    <SiteWideAppBarPathLinks className="ml-10" />
                </div>
                <div
                    className={oneLine`
                        flex
                        flex-row
                        items-center
                        gap-2
                    `}
                >
                    <AnchorButton
                        href="https://github.com/pluv-io/pluv"
                        rel="noreferrer noopener"
                        size="icon"
                        target="_blank"
                        title="GitHub"
                        variant="outline"
                        aria-label="GitHub"
                    >
                        <GitHubIcon height={24} width={24} />
                    </AnchorButton>
                    <AnchorButton
                        href="https://www.npmjs.com/package/@pluv/io"
                        rel="noreferrer noopener"
                        size="icon"
                        target="_blank"
                        title="npm"
                        variant="outline"
                        aria-label="npm"
                    >
                        <NpmIcon height={24} width={24} />
                    </AnchorButton>
                </div>
            </div>
        </AppBar>
    );
});

SiteWideAppBar.displayName = "SiteWideAppBar";
