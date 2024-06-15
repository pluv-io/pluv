import { AppBar, SideDrawer } from "@pluv-internal/react-components/client";
import { Anchor, AnchorButton, Button, LogoIcon, NextLink } from "@pluv-internal/react-components/either";
import { BarsIcon, GitHubIcon, NpmIcon } from "@pluv-internal/react-icons";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { useRouter } from "next/router";
import type { CSSProperties } from "react";
import { memo, useState } from "react";
import { MobileDocsSideDrawer } from "../MobileDocsSideDrawer";

export interface SiteWideAppBarProps {
    className?: string;
    style?: CSSProperties;
}

export const SiteWideAppBar = memo<SiteWideAppBarProps>((props) => {
    const { className, style } = props;

    const router = useRouter();

    const [open, setOpen] = useState<boolean>(false);

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
                    <SideDrawer.Root
                        open={open}
                        onOpenChange={(newOpen) => {
                            setOpen(newOpen);
                        }}
                    >
                        <SideDrawer.Trigger>
                            <Button className="mr-3 xl:hidden" size="icon" type="button" variant="outline">
                                <BarsIcon height={24} width={24} />
                            </Button>
                        </SideDrawer.Trigger>
                        <MobileDocsSideDrawer
                            className="xl:hidden"
                            onClickLink={(e) => {
                                e.stopPropagation();

                                setOpen(false);
                            }}
                        />
                    </SideDrawer.Root>
                    <NextLink className="flex items-center gap-1.5" href="/">
                        <LogoIcon className="rounded-md" height={36} width={36} />
                        <span className="text-lg font-bold">pluv.io</span>
                    </NextLink>
                    <div
                        className={oneLine`
                            ml-10
                            hidden
                            items-center
                            gap-6
                            md:flex
                        `}
                    >
                        <Anchor
                            className="font-semibold text-inherit hover:no-underline"
                            href="/docs/introduction"
                            data-selected={router.pathname === "/docs/introduction"}
                        >
                            Docs
                        </Anchor>
                        <Anchor
                            className="font-semibold text-inherit hover:no-underline"
                            href="/docs/quickstart"
                            data-selected={router.pathname === "/docs/quickstart"}
                        >
                            Quickstart
                        </Anchor>
                    </div>
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
