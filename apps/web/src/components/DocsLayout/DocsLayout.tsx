import { MdxProvider } from "@pluv-internal/mdx-components";
import { SideBar, TableOfContents } from "@pluv-internal/react-components";
import { useRouter } from "next/router";
import { CSSProperties, memo, ReactNode } from "react";
import tw from "twin.macro";
import { DocsBreadcrumbs } from "../DocsBreadcrumbs";
import { DocsSeo } from "../DocsSeo";
import { DocsTreeViewNavigation } from "../DocsTreeViewNavigation";
import { SiteWideLayout } from "../SiteWideLayout";

const Root = tw(SiteWideLayout.Content)`
    flex
    flex-row
    p-0
`;

const StyledSideBar = tw(SideBar)`
    sticky
    top-16
    shrink-0
    hidden
    flex-col
    items-stretch
    [height: calc(100vh - 4rem)]
    px-3
    pt-8
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
    items-stretch
    w-full
    lg:max-w-[80%]
`;

const DocContent = tw.div`
    flex
    flex-col
    items-start
    w-full
`;

const StyledBreadcrumbs = tw(DocsBreadcrumbs)`
    mb-8
`;

const StyledToC = tw(TableOfContents)`
    shrink-0
    hidden
    sticky
    top-24
    w-64
    sm:top-28
    lg:flex
`;

export interface DocsLayoutProps {
    children?: ReactNode;
    className?: string;
    meta?: {
        description?: string;
        title?: string;
    };
    style?: CSSProperties;
}

export const DocsLayout = memo<DocsLayoutProps>((props) => {
    const { children, className, meta, style } = props;

    const router = useRouter();

    return (
        <Root as="div" className={className} style={style}>
            <DocsSeo description={meta?.description} title={meta?.title} />
            <StyledSideBar>
                <DocsTreeViewNavigation />
            </StyledSideBar>
            <Container>
                <Content id="docs-content">
                    <StyledBreadcrumbs />
                    <DocContent>
                        <MdxProvider>{children}</MdxProvider>
                    </DocContent>
                </Content>
                <StyledToC
                    key={router.asPath}
                    intersection={{
                        rootMargin: "-64px 0% 0%",
                        threshold: 1,
                    }}
                    selector="#docs-content"
                />
            </Container>
        </Root>
    );
});

DocsLayout.displayName = "DocsLayout";
