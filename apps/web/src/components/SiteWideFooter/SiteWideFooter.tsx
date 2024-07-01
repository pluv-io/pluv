import { Button, Footer, LogoIcon, NextLink } from "@pluv-internal/react-components/either";
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
                        items-stretch
                        gap-2
                        sm:flex-row
                    `}
                >
                    <Button asChild size="sm" variant="outline">
                        <NextLink
                            className="flex min-w-28 flex-1 grow flex-row items-center justify-center gap-2"
                            href="https://github.com/pluv-io/pluv"
                            rel="noreferrer noopener"
                            target="_blank"
                            title="GitHub"
                            aria-label="GitHub"
                        >
                            <GitHubIcon height={16} width={16} />
                            <span>GitHub</span>
                        </NextLink>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                        <NextLink
                            className="flex min-w-28 flex-1 grow flex-row items-center justify-center gap-2"
                            href="https://www.npmjs.com/package/@pluv/io"
                            rel="noreferrer noopener"
                            target="_blank"
                            title="npm"
                            aria-label="npm"
                        >
                            <NpmIcon height={16} width={16} />
                            <span>npm</span>
                        </NextLink>
                    </Button>
                </div>
            </div>
        </Footer>
    );
});

SiteWideFooter.displayName = "SiteWideFooter";
