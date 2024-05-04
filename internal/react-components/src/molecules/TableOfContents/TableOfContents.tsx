"use client";

import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import type { CSSProperties } from "react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Anchor } from "../../atoms";

interface HeadingItem {
    active: boolean;
    depth: number;
    id: string;
    title: string;
}

export type TableOfContentsProps = {
    className?: string;
    intersection?: IntersectionObserverInit;
    selector: string;
    style?: CSSProperties;
};

export const TableOfContents = memo<TableOfContentsProps>((props) => {
    const { className, intersection: { root, rootMargin, threshold } = {}, selector, style } = props;

    // Ensure options is referentially stable
    const options = useMemo(() => ({ root, rootMargin, threshold }), [root, rootMargin, threshold]);

    const getTocItem = useCallback((id: string): Element | null => {
        return Array.from(document.querySelectorAll(`a[href$="#${id}"]`)).at(-1) ?? null;
    }, []);

    const [items, setItems] = useState<readonly HeadingItem[]>([]);

    const getHeadings = useCallback((): readonly HTMLHeadingElement[] => {
        return Array.from(document.querySelectorAll(`${selector} :is(h1,h2,h3)`)) as readonly HTMLHeadingElement[];
    }, [selector]);

    const getHeadingDepth = useCallback((tagName: string): number => {
        const depth = parseInt(tagName.substring(1));

        return Number.isNaN(depth) ? 0 : depth;
    }, []);

    useEffect(() => {
        const headings = getHeadings()
            .map((heading): HeadingItem => {
                const depth = getHeadingDepth(heading.tagName);
                const id = heading.id || "";
                const title = heading.innerText || "";

                return { active: false, depth, id, title };
            })
            .filter(({ depth, id, title }) => !!depth && !!id && !!title);

        setItems(headings);
    }, [getHeadingDepth, getHeadings]);

    const hasItems = !!items.length;

    useEffect(() => {
        if (!hasItems) return;

        const unobservers = getHeadings().map((heading): (() => void) => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const active = entry.isIntersecting;
                    const id = entry.target.id;
                    const tocItem = getTocItem(id);

                    if (!tocItem) return;

                    setItems((prev) => {
                        const index = prev.findIndex((item) => {
                            return item.id === id && item.active !== active;
                        });

                        if (index === -1) return prev;

                        const clone = prev.slice();

                        clone[index] = { ...clone[index], active };

                        return clone;
                    });
                });
            }, options);

            observer.observe(heading);

            const unobserve = () => observer.unobserve(heading);

            return unobserve;
        });

        return () => {
            unobservers.forEach((unobserve) => unobserve());
        };
    }, [getTocItem, getHeadings, hasItems, options]);

    const activeId = useMemo((): string | null => items.find((item) => item.active)?.id ?? null, [items]);

    return (
        <ul
            className={cn(
                oneLine`
                    flex
                    flex-col
                    items-stretch
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-thumb]:border
                    [&::-webkit-scrollbar-thumb]:border-solid
                    [&::-webkit-scrollbar-thumb]:border-indigo-700/50
                    [&::-webkit-scrollbar-thumb]:bg-indigo-700/30
                    [&::-webkit-scrollbar-thumb]:transition-colors
                    [&::-webkit-scrollbar-thumb]:duration-150
                    [&::-webkit-scrollbar-thumb]:ease-in
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar]:w-2
                    [&:hover::-webkit-scrollbar-thumb]:rounded-full
                    [&:hover::-webkit-scrollbar-thumb]:bg-indigo-700/50
                `,
                className,
            )}
            style={style}
        >
            {items.length > 1 &&
                items.map((item) => (
                    <li
                        key={item.id}
                        className={oneLine`
                            border-l-2
                            border-indigo-300/20
                            pl-2
                            text-sm
                            text-slate-400
                            hover:border-indigo-400/40
                            [&[data-active="true"]]:border-indigo-500/60
                            [&[data-active="true"]]:bg-indigo-600/20
                            [&[data-active="true"]]:font-semibold
                            [&[data-active="true"]]:text-white
                            [&[data-nested="true"]]:pl-6
                        `}
                        data-active={item.id === activeId}
                        data-nested={item.depth > 2}
                    >
                        <Anchor
                            className={oneLine`
                                flex
                                min-h-[1.75rem]
                                grow
                                flex-row
                                items-center
                                py-1
                            `}
                            href={`#${item.id}`}
                        >
                            {item.title}
                        </Anchor>
                    </li>
                ))}
        </ul>
    );
});

TableOfContents.displayName = "TableOfContents";
