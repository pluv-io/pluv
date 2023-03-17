import { PageContainer, SideBar } from "@pluv-internal/react-components";
import { CSSProperties, memo, ReactNode } from "react";
import tw from "twin.macro";
import { DocsTreeViewNavigation } from "../DocsTreeViewNavigation";
import { SiteWideLayout } from "../SiteWideLayout";

const Root = tw(SiteWideLayout.Content)`
    flex
    flex-row
    p-0
`;

const StyledSideBar = tw(SideBar)`
    shrink-0
    hidden
    flex-col
    items-stretch
    px-3
    overflow-y-auto
    lg:flex
`;

const Content = tw(PageContainer)`
    grow
    flex
    flex-col
    items-start
`;

export interface DocsLayoutProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const DocsLayout = memo<DocsLayoutProps>((props) => {
    const { children, className, style } = props;

    return (
        <Root as="div" className={className} style={style}>
            <StyledSideBar>
                <DocsTreeViewNavigation />
            </StyledSideBar>
            <Content>{children}</Content>
        </Root>
    );
});

DocsLayout.displayName = "DocsLayout";
