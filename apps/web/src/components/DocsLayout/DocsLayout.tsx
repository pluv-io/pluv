import { SideBar } from "@pluv-internal/react-components";
import { CSSProperties, memo, ReactNode } from "react";
import tw from "twin.macro";
import { SiteWideLayout } from "../SiteWideLayout";
import { DocsLayoutContent } from "./DocsLayoutContent";

const Root = tw(SiteWideLayout.Content)`
    flex
    flex-row
    p-0
`;

export interface DocsLayoutProps {
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
}

const _DocsLayout = memo<DocsLayoutProps>((props) => {
    const { children, className, style } = props;

    return (
        <Root as="div" className={className} style={style}>
            <SideBar>
                <div />
            </SideBar>
            {children}
        </Root>
    );
});

_DocsLayout.displayName = "DocsLayout";

export const DocsLayout = Object.assign(_DocsLayout, {
    Content: DocsLayoutContent,
});
