import { MdxProvider } from "@pluv-internal/mdx-components";
import { SideBar } from "@pluv-internal/react-components/either";
import { TableOfContents } from "@pluv-internal/react-components/client";
import { useRouter } from "next/router";
import { CSSProperties, ReactNode, memo } from "react";
import tw from "twin.macro";
import { DocsBreadcrumbs } from "../DocsBreadcrumbs";
import { DocsSeo } from "../DocsSeo";
import { DocsTreeViewNavigation } from "../DocsTreeViewNavigation";

const Root = tw.div`
    flex
    flex-row
    inset-0
`;

const StyledSideBar = tw(SideBar)`
    top-16
    shrink-0
    hidden
    flex-col
    items-stretch
    [height: calc(100vh - 4rem)]
    px-3
    pt-8
    overflow-y-auto
    xl:flex
`;

const Navigation = tw(DocsTreeViewNavigation)`
    pb-6
`;

const Container = tw.div`
    grow
    flex
    flex-row
    items-start
    justify-center
    gap-2
    min-w-0
    px-2
    py-8
    lg:gap-6
    xl:gap-8
    lg:px-6
    xl:px-8
    sm:py-12
`;

const Content = tw.main`
    flex
    flex-col
    items-stretch
    w-full
    min-w-0
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
    top-28
    w-72
    max-h-[calc(100vh - 12rem)]
    overflow-auto
    lg:flex
`;

export interface DocsLayoutProps {
    children?: ReactNode;
    className?: string;
    meta?: {
        description?: string;
        title?: string;
    } | null;
    style?: CSSProperties;
}

export const DocsLayout = memo<DocsLayoutProps>((props) => {
    const { children, className, meta, style } = props;

    const router = useRouter();

    return (
        <Root as="div" className={className} style={style}>
            <DocsSeo description={meta?.description} title={meta?.title} />
            <StyledSideBar>
                <Navigation />
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
                        rootMargin: "-56px 0% 0%",
                        threshold: 1,
                    }}
                    selector="#docs-content"
                />
            </Container>
        </Root>
    );
});

DocsLayout.displayName = "DocsLayout";
