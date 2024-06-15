import { AnchorButton, Footer, LogoIcon, NextLink } from "@pluv-internal/react-components/either";
import { GitHubIcon, NpmIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties } from "react";
import { memo } from "react";

export interface SiteWideFooterProps {
    className?: string;
    style?: CSSProperties;
}

export const SiteWideFooter = memo<SiteWideFooterProps>((props) => {
    const { className, style } = props;

    return (
        <Footer
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
                    sm:max-w-screen-sm
                    md:max-w-screen-md
                    lg:max-w-screen-lg
                    xl:max-w-screen-xl
                    2xl:max-w-screen-2xl
                `}
            >
                <NextLink className="flex items-center gap-1.5" href="/">
                    <LogoIcon className="rounded-md" height={40} width={40} />
                    <span className="text-lg font-bold">pluv.io</span>
                </NextLink>
                <div
                    className={oneLine`
                        flex
                        flex-col
                        items-center
                        gap-2
                        sm:flex-row
                    `}
                >
                    <AnchorButton
                        className="flex w-28 flex-row items-center justify-center gap-2"
                        href="https://github.com/pluv-io/pluv"
                        rel="noreferrer noopener"
                        size="sm"
                        target="_blank"
                        title="GitHub"
                        variant="outline"
                        aria-label="GitHub"
                    >
                        <GitHubIcon height={16} width={16} />
                        <span>GitHub</span>
                    </AnchorButton>
                    <AnchorButton
                        className="flex w-28 flex-row items-center justify-center gap-2"
                        href="https://www.npmjs.com/package/@pluv/io"
                        rel="noreferrer noopener"
                        size="sm"
                        target="_blank"
                        title="npm"
                        variant="outline"
                        aria-label="npm"
                    >
                        <NpmIcon height={16} width={16} />
                        <span>npm</span>
                    </AnchorButton>
                </div>
            </div>
        </Footer>
    );
});

SiteWideFooter.displayName = "SiteWideFooter";
