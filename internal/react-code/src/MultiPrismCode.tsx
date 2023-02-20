import * as Tabs from "@radix-ui/react-tabs";
import type { Language } from "prism-react-renderer";
import { CSSProperties, FC, ReactElement, useMemo } from "react";
import tw, { styled } from "twin.macro";
import { PrismCode } from "./PrismCode";

export const Root = tw(Tabs.Root)`
    flex
    flex-col
    items-stretch
    border
    border-solid
    border-indigo-500/40
    rounded-md
    p-2
`;

const TabsList = tw(Tabs.List)`
    flex
    flex-row
    items-stretch
    gap-0.5
`;

const TabsTrigger = styled(Tabs.Trigger)`
    ${tw`
        rounded-md
        py-1.5
        px-3
        border
        border-solid
        border-transparent
        font-medium
        text-sm
        hover:bg-gray-500/40
        transition-all
        ease-in
        duration-150
    `}

    &[data-state='active'] {
        ${tw`
            bg-indigo-500/20
            text-violet-400
            hover:bg-indigo-500/40
            active:bg-indigo-400/40
        `}
    }
`;

const TabsContent = tw(Tabs.Content)`

`;

export interface MultiPrismCodeTab<TTab extends string> {
    code?: string;
    language?: Language;
    name: TTab;
}

export interface MultiPrismCodeProps<TTab extends string> {
    className?: string;
    style?: CSSProperties;
    tabs?: readonly MultiPrismCodeTab<TTab>[];
}

export const MultiPrismCode = <TTab extends string>(
    props: MultiPrismCodeProps<TTab>
): ReactElement => {
    const { className, style, tabs = [] } = props;

    const defaultTab = useMemo((): TTab | undefined => tabs[0]?.name, [tabs]);

    return (
        <Root className={className} defaultValue={defaultTab} style={style}>
            <TabsList>
                {tabs.map((tab) => (
                    <TabsTrigger key={tab.name} value={tab.name}>
                        {tab.name}
                    </TabsTrigger>
                ))}
            </TabsList>
            {tabs.map((tab) => (
                <TabsContent key={tab.name} value={tab.name}>
                    <PrismCode language={tab.language}>{tab.code}</PrismCode>
                </TabsContent>
            ))}
        </Root>
    );
};