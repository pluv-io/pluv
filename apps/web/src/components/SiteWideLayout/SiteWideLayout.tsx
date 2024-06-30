import { Anchor, Banner } from "@pluv-internal/react-components/either";
import { cn } from "@pluv-internal/utils";
import { CSSProperties, ReactNode, memo } from "react";
import { SiteWideAppBar } from "../SiteWideAppBar";
import { SiteWideFooter } from "../SiteWideFooter";

const SHOW_BANNER: boolean = true;

export interface SiteWideLayoutProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const SiteWideLayout = memo<SiteWideLayoutProps>((props) => {
    const { children, className, style } = props;

    return (
        <div className={cn("flex min-h-screen flex-col", className)} style={style}>
            {!!SHOW_BANNER && (
                <Banner className="shrink-0">
                    <div>
                        <Anchor className="font-semibold text-white" href="https://www.npmjs.com/package/@pluv/io">
                            pluv.io
                        </Anchor>{" "}
                        is in preview! Please wait for a v1.0.0 stable release before using this in production.
                    </div>
                </Banner>
            )}
            <SiteWideAppBar className="shrink-0" />
            {children}
            <SiteWideFooter className="z-footer shrink-0" />
        </div>
    );
});

SiteWideLayout.displayName = "SiteWideLayout";
