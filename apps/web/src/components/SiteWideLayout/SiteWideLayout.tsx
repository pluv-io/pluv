import { Anchor, Banner, getZIndex } from "@pluv-internal/react-components";
import { CSSProperties, memo, ReactNode } from "react";
import tw, { styled } from "twin.macro";
import { SiteWideAppBar } from "../SiteWideAppBar";
import { SiteWideFooter } from "../SiteWideFooter";

const SHOW_BANNER: boolean = true;

const PluvIOLink = tw(Anchor)`
    font-semibold
`;

const Root = tw.div`
    flex
    flex-col
`;

const StyledBanner = tw(Banner)`
    shrink-0
`;

const StyledSiteWideAppBar = tw(SiteWideAppBar)`
    shrink-0
`;

const StyledSiteWideFooter = styled(SiteWideFooter)`
    ${tw`shrink-0`}

    z-index: ${getZIndex("footer")};
`;

export interface SiteWideLayoutProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const SiteWideLayout = memo<SiteWideLayoutProps>((props) => {
    const { children, className, style } = props;

    return (
        <Root className={className} style={style}>
            {!!SHOW_BANNER && (
                <StyledBanner>
                    <div>
                        <PluvIOLink href="https://www.npmjs.com/package/@pluv/io">
                            pluv.io
                        </PluvIOLink>{" "}
                        is in preview! Please wait for a v1.0.0 stable release
                        before using this in production.
                    </div>
                </StyledBanner>
            )}
            <StyledSiteWideAppBar />
            {children}
            <StyledSiteWideFooter />
        </Root>
    );
});

SiteWideLayout.displayName = "SiteWideLayout";
