import { PageContainer } from "@pluv-internal/react-components";
import { CSSProperties, memo, ReactNode } from "react";
import tw from "twin.macro";
import { SiteWideAppBar } from "../SiteWideAppBar";
import { SiteWideFooter } from "../SiteWideFooter";

const Root = tw.div`
    flex
    flex-col
    min-h-screen
`;

const StyledSiteWideAppBar = tw(SiteWideAppBar)`
    shrink-0
`;

const Content = tw(PageContainer)`
    grow
`;

const StyledSiteWideFooter = tw(SiteWideFooter)`
    shrink-0
`;

export interface SiteWideLayoutProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const SiteWideLayout = memo<SiteWideLayoutProps>((props) => {
    const { children, className, style } = props;

    return (
        <Root>
            <StyledSiteWideAppBar />
            <Content className={className} style={style}>
                {children}
            </Content>
            <StyledSiteWideFooter />
        </Root>
    );
});

SiteWideLayout.displayName = "SiteWideLayout";
