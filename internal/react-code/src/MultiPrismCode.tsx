import { cn } from "@pluv-internal/utils";
import * as Tabs from "@radix-ui/react-tabs";
import { oneLine } from "common-tags";
import type { CSSProperties } from "react";
import { useMemo } from "react";
import type { Language } from "./PrismCode";
import { PrismCode } from "./PrismCode";

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

export const MultiPrismCode = <TTab extends string>(props: MultiPrismCodeProps<TTab>) => {
    const { className, style, tabs = [] } = props;

    const defaultTab = useMemo((): TTab | undefined => tabs[0]?.name, [tabs]);

    return (
        <Tabs.Root
            className={cn("flex flex-col items-stretch overflow-x-auto p-2", className)}
            defaultValue={defaultTab}
            style={style}
        >
            <Tabs.List className="flex shrink-0 flex-row items-stretch gap-0.5 overflow-hidden">
                {tabs.map((tab) => (
                    <Tabs.Trigger
                        key={tab.name}
                        className={oneLine`
                            [&[data-state='active']]bg-indigo-500/20
                            [&[data-state='active']]text-violet-400
                            [&[data-state='active']]hover:bg-indigo-500/40
                            [&[data-state='active']]active:bg-indigo-400/40
                            whitespace-nowrap
                            rounded-md
                            border
                            border-solid
                            border-transparent
                            px-3
                            py-1.5
                            text-sm
                            font-medium
                            transition-all
                            duration-150
                            ease-in
                            hover:bg-gray-500/40
                        `}
                        value={tab.name}
                    >
                        {tab.name}
                    </Tabs.Trigger>
                ))}
            </Tabs.List>
            {tabs.map((tab) => (
                <Tabs.Content
                    key={tab.name}
                    className={oneLine`
                        hover:[::-webkit-scrollbar-thumb]:block
                        grow
                        overflow-auto
                        overflow-y-auto
                        p-[0.5em]
                        text-left
                        font-mono
                        [&::-webkit-scrollbar-corner]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:hidden
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-thumb]:bg-gray-700/40
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar]:h-[8px]
                        [&::-webkit-scrollbar]:w-[8px]
                    `}
                    value={tab.name}
                >
                    <PrismCode className="w-fit" language={tab.language ?? "tsx"}>
                        {tab.code}
                    </PrismCode>
                </Tabs.Content>
            ))}
        </Tabs.Root>
    );
};
