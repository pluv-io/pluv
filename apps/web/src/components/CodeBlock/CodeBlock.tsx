"use client";

import { useAsync, useMountEffect } from "@pluv-internal/react-hooks";
import type { InferComponentProps } from "@pluv-internal/typings";
import { cn } from "@pluv-internal/utils";
import { oneLine } from "common-tags";
import { forwardRef } from "react";
import { getShiki, type ShikiLanguage } from "../../utils/getShiki";

export type CodeBlockProps = InferComponentProps<"div"> & {
    code: string;
    lang: ShikiLanguage;
};

export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>((props, ref) => {
    const { className, lang, code, ...restProps } = props;

    const [{ result: html }, { execute }] = useAsync(async () => {
        const shiki = await getShiki();

        return shiki.codeToHtml(code, {
            lang,
            themes: {
                light: "catppuccin-latte",
                dark: "catppuccin-macchiato",
            },
        });
    });

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
