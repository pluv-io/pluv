import { SideBar, TableOfContents } from "@pluv-internal/react-components";
import { useRouter } from "next/router";
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

const Container = tw.div`
    grow
    flex
    flex-row
    items-start
    justify-center
    gap-8
    px-2
    py-8
    md:gap-12
    sm:px-8
    sm:py-12
`;

const Content = tw.main`
    flex
    flex-col
    items-start
    w-full
    lg:max-w-[80%]
`;

const StyledToC = tw(TableOfContents)`
    shrink-0
    hidden
    sticky
    top-24
    w-40
    sm:top-28
    lg:flex
`;

export interface DocsLayoutProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

export const DocsLayout = memo<DocsLayoutProps>((props) => {
    const { children, className, style } = props;

    const router = useRouter();

    return (
        <Root as="div" className={className} style={style}>
            <StyledSideBar>
                <DocsTreeViewNavigation />
            </StyledSideBar>
            <Container>
                <Content id="docs-content">{children}</Content>
                <StyledToC key={router.asPath} selector="#docs-content" />
            </Container>
        </Root>
    );
});

DocsLayout.displayName = "DocsLayout";