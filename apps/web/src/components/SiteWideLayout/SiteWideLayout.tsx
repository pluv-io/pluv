import { CSSProperties, memo, ReactNode } from "react";
import tw from "twin.macro";
import { SiteWideAppBar } from "../SiteWideAppBar";
import { SiteWideFooter } from "../SiteWideFooter";
import { SiteWideLayoutContent } from "./SiteWideLayoutContent";

const Root = tw.div`
    flex
    flex-col
    min-h-screen
`;

const StyledSiteWideAppBar = tw(SiteWideAppBar)`
    shrink-0
`;

const StyledSiteWideFooter = tw(SiteWideFooter)`
    shrink-0
`;

export interface SiteWideLayoutProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

const _SiteWideLayout = memo<SiteWideLayoutProps>((props) => {
    const { children, className, style } = props;

    return (
        <Root className={className} style={style}>
            <StyledSiteWideAppBar />
            {children}
            <StyledSiteWideFooter />
        </Root>
    );
});

_SiteWideLayout.displayName = "SiteWideLayout";

export const SiteWideLayout = Object.assign(_SiteWideLayout, {
    Content: SiteWideLayoutContent,
});
