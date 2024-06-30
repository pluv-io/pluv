"use client";

import { useAsync, useMountEffect } from "@pluv-internal/react-hooks";
import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef, useMemo } from "react";
import { getShiki, type ShikiLanguage } from "../../utils/getShiki";

export type CodeBlockProps = InferComponentProps<"div"> & {
    code: string;
    lang: ShikiLanguage;
};

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>((props, ref) => {
    const { className, lang, code, ...restProps } = props;

    const [{ result: shiki }, { execute }] = useAsync(async () => {
        return await getShiki();
    });

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

    useMountEffect(() => {
        execute();
    });

    return (
        <div
            {...restProps}
            className={cn(
                oneLine`
                    [&>pre]:size-full
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
