"use client";

import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef, useContext, useMemo } from "react";
import { type ShikiLanguage } from "../../utils/getShiki";
import { CodeBlockContext } from "./context";

export type CodeBlockProps = InferComponentProps<"div"> & {
    code: string;
    lang: ShikiLanguage;
};

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>((props, ref) => {
    const { className, lang, code, ...restProps } = props;

    const shiki = useContext(CodeBlockContext);

    const html = useMemo(() => {
        if (!shiki) return null;

        return shiki.codeToHtml(code, {
            lang,
            themes: {
                light: "catppuccin-latte",
                dark: "catppuccin-macchiato",
            },
        });
    }, [code, lang, shiki]);

    return (
        <div
            {...restProps}
            className={cn(
                oneLine`
                    text-sm
                    md:text-base
                    [&>pre]:size-full
                    [&>pre]:min-w-fit
                    [&>pre]:p-3
                `,
                className,
            )}
            dangerouslySetInnerHTML={html ? { __html: html } : undefined}
            ref={ref}
        />
    );
});

CodeBlock.displayName = "CodeBlock";
